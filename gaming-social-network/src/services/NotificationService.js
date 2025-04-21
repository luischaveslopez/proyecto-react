import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const NotificationType = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  SHARE: 'SHARE',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  MESSAGE: 'MESSAGE'
};

export const createNotification = async (userId, notification) => {
  try {
    const notificationData = {
      ...notification,
      timestamp: serverTimestamp(),
      read: false,
      emailSent: false
    };

    await addDoc(collection(db, 'users', userId, 'notifications'), notificationData);

    // Trigger email notification through Cloud Function
    await addDoc(collection(db, 'mail'), {
      to: notification.userEmail,
      template: {
        name: notification.type.toLowerCase(),
        data: {
          ...notification
        }
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createLikeNotification = async (userId, userEmail, postData, likedByUser) => {
  await createNotification(userId, {
    type: NotificationType.LIKE,
    userEmail,
    message: `${likedByUser.username} liked your post`,
    postId: postData.id,
    actionUser: {
      id: likedByUser.uid,
      username: likedByUser.username,
      photoURL: likedByUser.photoURL
    }
  });
};

export const createCommentNotification = async (userId, userEmail, postData, commentByUser) => {
  await createNotification(userId, {
    type: NotificationType.COMMENT,
    userEmail,
    message: `${commentByUser.username} commented on your post`,
    postId: postData.id,
    actionUser: {
      id: commentByUser.uid,
      username: commentByUser.username,
      photoURL: commentByUser.photoURL
    }
  });
};

export const createShareNotification = async (userId, userEmail, postData, sharedByUser) => {
  await createNotification(userId, {
    type: NotificationType.SHARE,
    userEmail,
    message: `${sharedByUser.username} shared your post`,
    postId: postData.id,
    actionUser: {
      id: sharedByUser.uid,
      username: sharedByUser.username,
      photoURL: sharedByUser.photoURL
    }
  });
};

export const createFriendRequestNotification = async (userId, userEmail, requestByUser) => {
  await createNotification(userId, {
    type: NotificationType.FRIEND_REQUEST,
    userEmail,
    message: `${requestByUser.username} sent you a friend request`,
    actionUser: {
      id: requestByUser.uid,
      username: requestByUser.username,
      photoURL: requestByUser.photoURL
    }
  });
};

export const createMessageNotification = async (userId, userEmail, messageData, sentByUser) => {
  await createNotification(userId, {
    type: NotificationType.MESSAGE,
    userEmail,
    message: `New message from ${sentByUser.username}`,
    messageId: messageData.id,
    actionUser: {
      id: sentByUser.uid,
      username: sentByUser.username,
      photoURL: sentByUser.photoURL
    }
  });
};
