import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Get all content restrictions
export const getContentRestrictions = async () => {
  try {
    const restrictionsRef = collection(db, 'contentRestrictions');
    const snapshot = await getDocs(restrictionsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting content restrictions:', error);
    return [];
  }
};

// Add a new content restriction
export const addContentRestriction = async (restriction) => {
  try {
    const restrictionsRef = collection(db, 'contentRestrictions');
    const docRef = doc(restrictionsRef);
    await setDoc(docRef, {
      ...restriction,
      createdAt: serverTimestamp(),
      active: true
    });
    return true;
  } catch (error) {
    console.error('Error adding content restriction:', error);
    return false;
  }
};

// Delete a content restriction
export const deleteContentRestriction = async (restrictionId) => {
  try {
    await deleteDoc(doc(db, 'contentRestrictions', restrictionId));
    return true;
  } catch (error) {
    console.error('Error deleting content restriction:', error);
    return false;
  }
};

// Check if content violates any restrictions
export const checkContentRestrictions = async (content) => {
  try {
    const restrictions = await getContentRestrictions();
    const violations = [];

    for (const restriction of restrictions) {
      if (!restriction.active) continue;

      switch (restriction.type) {
        case 'word':
          if (new RegExp('\\b' + restriction.value + '\\b', 'i').test(content)) {
            violations.push({
              type: 'word',
              value: restriction.value,
              message: restriction.message || `The word "${restriction.value}" is not allowed`
            });
          }
          break;

        case 'link':
          if (new RegExp(restriction.value, 'i').test(content)) {
            violations.push({
              type: 'link',
              value: restriction.value,
              message: restriction.message || `Links to "${restriction.value}" are not allowed`
            });
          }
          break;

        case 'pattern':
          if (new RegExp(restriction.value, 'i').test(content)) {
            violations.push({
              type: 'pattern',
              value: restriction.value,
              message: restriction.message || `This content contains restricted patterns`
            });
          }
          break;
      }
    }

    return violations;
  } catch (error) {
    console.error('Error checking content restrictions:', error);
    return [];
  }
};
