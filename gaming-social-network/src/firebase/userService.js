import { db } from './config';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

// Ensure user document exists in Firestore
export async function ensureUserDocumentExists(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user document with default settings
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        bio: '',
        friends: [],
        blockedUsers: [],
        gamesPlayed: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAdmin: user.email === 'admin@gmail.com',
        privacySettings: {
          profileVisibility: 'public',
          postsVisibility: 'public',
          friendsListVisibility: 'public',
          showOnlineStatus: true,
          allowFriendRequests: true,
          allowMessages: true
        },
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          friendRequests: true,
          messages: true,
          postLikes: true,
          comments: true,
          mentions: true
        }
      });
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error ensuring user document exists:', error);
    return false;
  }
}

// Check if a user is blocked
export async function isUserBlocked(currentUserId, targetUserId) {
  try {
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    if (!targetUserDoc.exists()) return false;

    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists()) return false;

    // Check if either user has blocked the other
    const targetUserData = targetUserDoc.data();
    const currentUserData = currentUserDoc.data();

    return (
      targetUserData.blockedUsers?.includes(currentUserId) ||
      currentUserData.blockedUsers?.includes(targetUserId)
    );
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

// Block a user
export async function blockUser(currentUserId, userToBlockId) {
  try {
    const userRef = doc(db, 'users', currentUserId);
    const blockedUserRef = doc(db, 'users', userToBlockId);
    
    // Add user to blocked list
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(userToBlockId),
      friends: arrayRemove(userToBlockId)
    });

    // Remove current user from blocked user's friends list
    await updateDoc(blockedUserRef, {
      friends: arrayRemove(currentUserId)
    });

    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
}

// Unblock a user
export async function unblockUser(currentUserId, userToUnblockId) {
  try {
    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(userToUnblockId)
    });
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
}

// Report a user
export async function reportUser(reporterId, reportedUserId, reason) {
  try {
    // Create the report
    const reportRef = await addDoc(collection(db, 'reports'), {
      reportedUserId,
      reporterId,
      reason,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    // Get reporter and reported user details for notifications
    const [reporterDoc, reportedDoc] = await Promise.all([
      getDoc(doc(db, 'users', reporterId)),
      getDoc(doc(db, 'users', reportedUserId))
    ]);

    const reporterData = reporterDoc.data();
    const reportedData = reportedDoc.data();

    // Add report details
    await updateDoc(reportRef, {
      reporterName: reporterData.username,
      reportedName: reportedData.username
    });

    // Notify admins
    const adminsQuery = query(collection(db, 'users'), where('isAdmin', '==', true));
    const adminsSnapshot = await getDocs(adminsQuery);
    
    const notificationPromises = adminsSnapshot.docs.map(admin => 
      addDoc(collection(db, 'notifications'), {
        userId: admin.id,
        type: 'newReport',
        reportId: reportRef.id,
        message: `New report: ${reporterData.username} reported ${reportedData.username}`,
        timestamp: serverTimestamp(),
        read: false
      })
    );

    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
}

// Get blocked users list
export async function getBlockedUsers(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const userData = userDoc.data();
    const blockedIds = userData.blockedUsers || [];

    const blockedUsers = await Promise.all(
      blockedIds.map(async (blockedId) => {
        const blockedUserDoc = await getDoc(doc(db, 'users', blockedId));
        return blockedUserDoc.exists() 
          ? { id: blockedId, ...blockedUserDoc.data() }
          : null;
      })
    );

    return blockedUsers.filter(user => user !== null);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}
