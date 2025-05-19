import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Generic Firestore service to handle common CRUD operations
 */
export class FirestoreService {
  /**
   * @param {string} collectionName - The name of the Firestore collection
   */
  constructor(collectionName) {
    this.collectionRef = collection(db, collectionName);
    this.collectionName = collectionName;
  }

  /**
   * Create a new document with auto-generated ID
   * @param {Object} data - The data to create
   * @returns {Promise<string>} - The created document ID
   */
  async create(data) {
    const timestampedData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(this.collectionRef, timestampedData);
    return docRef.id;
  }

  /**
   * Create a new document with specific ID
   * @param {string} id - The document ID
   * @param {Object} data - The data to create
   * @returns {Promise<void>}
   */
  async createWithId(id, data) {
    const docRef = doc(db, this.collectionName, id);
    const timestampedData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, timestampedData);
  }

  /**
   * Get a document by ID
   * @param {string} id - The document ID
   * @returns {Promise<Object|null>} - The document data or null if not found
   */
  async getById(id) {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  }

  /**
   * Get all documents from collection
   * @returns {Promise<Array>} - Array of document data
   */
  async getAll() {
    const querySnapshot = await getDocs(this.collectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Update a document
   * @param {string} id - The document ID
   * @param {Object} data - The data to update
   * @returns {Promise<void>}
   */
  async update(id, data) {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
  }

  /**
   * Delete a document
   * @param {string} id - The document ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  /**
   * Query documents with filters
   * @param {Array} conditions - Array of where conditions [field, operator, value]
   * @param {string} orderByField - Field to order by
   * @param {string} orderDirection - Order direction ('asc' or 'desc')
   * @param {number} limitCount - Max number of documents to return
   * @param {Object} startAfterDoc - Document to start after (for pagination)
   * @returns {Promise<Array>} - Array of document data
   */
  async query({
    conditions = [],
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitCount = 50,
    startAfterDoc = null
  }) {
    let q = collection(db, this.collectionName);
    
    // Apply where conditions
    if (conditions.length > 0) {
      q = query(q, ...conditions.map(([field, operator, value]) => 
        where(field, operator, value)
      ));
    }
    
    // Apply orderBy
    q = query(q, orderBy(orderByField, orderDirection));
    
    // Apply limit
    q = query(q, limit(limitCount));
    
    // Apply pagination if startAfterDoc is provided
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Subscribe to real-time updates
   * @param {function} callback - Callback function with documents
   * @param {Array} conditions - Array of where conditions [field, operator, value]
   * @returns {function} - Unsubscribe function
   */
  subscribeToChanges(callback, conditions = []) {
    let q = this.collectionRef;
    
    // Apply where conditions
    if (conditions.length > 0) {
      q = query(q, ...conditions.map(([field, operator, value]) => 
        where(field, operator, value)
      ));
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(documents);
    });
  }

  /**
   * Perform batch operations
   * @param {Array} operations - Array of operations [type, id, data]
   * @returns {Promise<void>}
   */
  async batchOperation(operations) {
    const batch = writeBatch(db);
    
    operations.forEach(([type, id, data]) => {
      const docRef = doc(db, this.collectionName, id);
      
      switch (type) {
        case 'set':
          batch.set(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
            createdAt: data.createdAt || serverTimestamp()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...data,
            updatedAt: serverTimestamp()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default:
          throw new Error(`Unknown batch operation type: ${type}`);
      }
    });
    
    await batch.commit();
  }
}
