const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testNotifications() {
  try {
    console.log('🧪 Starting notification tests...');

    // Test data
    const testUser = {
      id: 'test-user-1',
      username: 'Test User',
      email: process.env.TEST_EMAIL || process.env.EMAIL_USER,
      photoURL: 'https://example.com/photo.jpg'
    };

    const testPost = {
      id: 'test-post-1',
      content: 'This is a test post',
      authorId: 'test-user-2',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Test like notification
    console.log('Testing like notification...');
    await admin.firestore()
      .collection('posts')
      .doc(testPost.id)
      .collection('likes')
      .doc(testUser.id)
      .set({
        userId: testUser.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // Test comment notification
    console.log('Testing comment notification...');
    await admin.firestore()
      .collection('posts')
      .doc(testPost.id)
      .collection('comments')
      .add({
        userId: testUser.id,
        username: testUser.username,
        content: 'This is a test comment',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // Test share notification
    console.log('Testing share notification...');
    await admin.firestore()
      .collection('posts')
      .add({
        content: `Shared post: ${testPost.content}`,
        originalPostId: testPost.id,
        originalAuthorId: testPost.authorId,
        authorId: testUser.id,
        authorName: testUser.username,
        type: 'share',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // Test marking notifications as read
    console.log('Testing mark as read...');
    const notificationsSnapshot = await admin.firestore()
      .collection('users')
      .doc(testPost.authorId)
      .collection('notifications')
      .limit(5)
      .get();

    const notificationIds = notificationsSnapshot.docs.map(doc => doc.id);
    
    await admin.firestore()
      .runTransaction(async (transaction) => {
        notificationIds.forEach(id => {
          const notificationRef = admin.firestore()
            .collection('users')
            .doc(testPost.authorId)
            .collection('notifications')
            .doc(id);
          transaction.update(notificationRef, { read: true });
        });
      });

    console.log('✅ All tests completed successfully!');
    console.log('\nCheck the following:');
    console.log('1. Firebase Functions logs for notification triggers');
    console.log('2. Email inbox for notification emails');
    console.log(`3. Firestore notifications collection for user: ${testPost.authorId}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup (optional)
    process.exit(0);
  }
}

// Run tests
console.log('🚀 Starting notification system tests...');
testNotifications();
