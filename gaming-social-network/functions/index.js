const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const templates = require('./templates/emailTemplates');

admin.initializeApp();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

// Helper function to get user data
async function getUserData(userId) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  return userDoc.data();
}

// Helper function to get post data
async function getPostData(postId) {
  const postDoc = await admin.firestore().collection('posts').doc(postId).get();
  return { id: postDoc.id, ...postDoc.data() };
}

// Helper function to create notification
async function createNotification(userId, notification) {
  return admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('notifications')
    .add({
      ...notification,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
}

// Send email notification
async function sendEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: '"Gaming Social Network" <noreply@gamingsocial.com>',
    to,
    subject,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Like notification handler
exports.handleLikeNotification = functions.firestore
  .document('posts/{postId}/likes/{userId}')
  .onCreate(async (snap, context) => {
    const postId = context.params.postId;
    const likerId = context.params.userId;

    try {
      const [post, liker] = await Promise.all([
        getPostData(postId),
        getUserData(likerId)
      ]);

      // Don't notify if user likes their own post
      if (post.authorId === likerId) return null;

      const authorData = await getUserData(post.authorId);
      
      const notification = {
        type: 'LIKE',
        postId,
        actionUser: {
          id: likerId,
          username: liker.username,
          photoURL: liker.photoURL
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create in-app notification
      await createNotification(post.authorId, notification);

      // Send email notification
      const emailData = {
        actionUser: {
          username: liker.username,
          photoURL: liker.photoURL
        },
        postContent: post.content,
        postUrl: `${functions.config().app.url}/post/${postId}`
      };

      await sendEmail(
        authorData.email,
        `${liker.username} liked your post`,
        templates.likeTemplate(emailData)
      );

    } catch (error) {
      console.error('Error handling like notification:', error);
    }
  });

// Comment notification handler
exports.handleCommentNotification = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const postId = context.params.postId;
    const comment = snap.data();

    try {
      const [post, commenter] = await Promise.all([
        getPostData(postId),
        getUserData(comment.userId)
      ]);

      // Don't notify if user comments on their own post
      if (post.authorId === comment.userId) return null;

      const authorData = await getUserData(post.authorId);

      const notification = {
        type: 'COMMENT',
        postId,
        commentId: context.params.commentId,
        actionUser: {
          id: comment.userId,
          username: commenter.username,
          photoURL: commenter.photoURL
        },
        content: comment.content,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create in-app notification
      await createNotification(post.authorId, notification);

      // Send email notification
      const emailData = {
        actionUser: {
          username: commenter.username,
          photoURL: commenter.photoURL
        },
        commentContent: comment.content,
        postContent: post.content,
        postUrl: `${functions.config().app.url}/post/${postId}`
      };

      await sendEmail(
        authorData.email,
        `${commenter.username} commented on your post`,
        templates.commentTemplate(emailData)
      );

    } catch (error) {
      console.error('Error handling comment notification:', error);
    }
  });

// Share notification handler
exports.handleShareNotification = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    
    // Only process if it's a shared post
    if (post.type !== 'share') return null;

    try {
      const [originalPost, sharer] = await Promise.all([
        getPostData(post.originalPostId),
        getUserData(post.authorId)
      ]);

      // Don't notify if user shares their own post
      if (originalPost.authorId === post.authorId) return null;

      const authorData = await getUserData(originalPost.authorId);

      const notification = {
        type: 'SHARE',
        originalPostId: post.originalPostId,
        sharedPostId: context.params.postId,
        actionUser: {
          id: post.authorId,
          username: sharer.username,
          photoURL: sharer.photoURL
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create in-app notification
      await createNotification(originalPost.authorId, notification);

      // Send email notification
      const emailData = {
        actionUser: {
          username: sharer.username,
          photoURL: sharer.photoURL
        },
        postContent: originalPost.content,
        postUrl: `${functions.config().app.url}/post/${post.originalPostId}`
      };

      await sendEmail(
        authorData.email,
        `${sharer.username} shared your post`,
        templates.shareTemplate(emailData)
      );

    } catch (error) {
      console.error('Error handling share notification:', error);
    }
  });

// Mark notifications as read
exports.markNotificationsRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { notificationIds } = data;
  const userId = context.auth.uid;

  try {
    const batch = admin.firestore().batch();
    
    notificationIds.forEach(id => {
      const notificationRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(id);
      batch.update(notificationRef, { read: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw new functions.https.HttpsError('internal', 'Error updating notifications');
  }
});

// Clean up old notifications
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    );

    try {
      const usersSnapshot = await admin.firestore().collection('users').get();
      
      const batch = admin.firestore().batch();
      let count = 0;

      for (const userDoc of usersSnapshot.docs) {
        const oldNotificationsSnapshot = await userDoc.ref
          .collection('notifications')
          .where('timestamp', '<', cutoff)
          .where('read', '==', true)
          .get();

        oldNotificationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          count++;
        });
      }

      if (count > 0) {
        await batch.commit();
        console.log(`Cleaned up ${count} old notifications`);
      }

      return null;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return null;
    }
  });
