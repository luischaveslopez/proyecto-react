import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

export const checkProfileVisibility = async (profileUserId, viewerUserId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', profileUserId));
    const userData = userDoc.data();

    // If it's the user's own profile, always allow access
    if (profileUserId === viewerUserId) {
      return true;
    }

    // Get privacy settings
    const privacySettings = userData.privacySettings || {};
    
    // If profile is public, allow access
    if (privacySettings.profileVisibility === 'public') {
      return true;
    }

    // If profile is private, check if viewer is a friend
    const friends = userData.friends || [];
    return friends.includes(viewerUserId);
  } catch (error) {
    console.error('Error checking profile visibility:', error);
    return false;
  }
};

export const checkPostsVisibility = async (profileUserId, viewerUserId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', profileUserId));
    const userData = userDoc.data();

    if (profileUserId === viewerUserId) {
      return true;
    }

    const privacySettings = userData.privacySettings || {};
    
    if (privacySettings.postsVisibility === 'public') {
      return true;
    }

    const friends = userData.friends || [];
    return friends.includes(viewerUserId);
  } catch (error) {
    console.error('Error checking posts visibility:', error);
    return false;
  }
};

export const checkFriendsListVisibility = async (profileUserId, viewerUserId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', profileUserId));
    const userData = userDoc.data();

    if (profileUserId === viewerUserId) {
      return true;
    }

    const privacySettings = userData.privacySettings || {};
    
    if (privacySettings.friendsListVisibility === 'public') {
      return true;
    }

    const friends = userData.friends || [];
    return friends.includes(viewerUserId);
  } catch (error) {
    console.error('Error checking friends list visibility:', error);
    return false;
  }
};

export const canSendMessage = async (targetUserId, senderUserId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    const userData = userDoc.data();

    const privacySettings = userData.privacySettings || {};
    
    if (privacySettings.allowMessages) {
      return true;
    }

    const friends = userData.friends || [];
    return friends.includes(senderUserId);
  } catch (error) {
    console.error('Error checking message permissions:', error);
    return false;
  }
};

export const canSendFriendRequest = async (targetUserId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    const userData = userDoc.data();

    const privacySettings = userData.privacySettings || {};
    return privacySettings.allowFriendRequests;
  } catch (error) {
    console.error('Error checking friend request permissions:', error);
    return false;
  }
};
