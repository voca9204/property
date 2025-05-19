const admin = require('firebase-admin');

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestore database
const db = admin.firestore();

// Firebase Auth
const auth = admin.auth();

// Firebase Storage
const storage = admin.storage();

// Export the initialized services
module.exports = {
  admin,
  db,
  auth,
  storage,
  // Utility function to get a document by reference
  getDoc: async (docRef) => {
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() };
  },
  // Utility function to get a collection
  getCollection: async (collectionRef) => {
    const snapshot = await collectionRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  // Timestamp functions
  timestamp: admin.firestore.FieldValue.serverTimestamp,
  fromTimestamp: (timestamp) => timestamp ? timestamp.toDate() : null,
  // Batch operations
  createBatch: () => db.batch(),
};
