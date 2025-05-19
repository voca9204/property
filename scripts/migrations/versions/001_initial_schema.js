// Migration: Initial Schema
module.exports = {
  version: 1,
  name: 'initial_schema',
  description: 'Create initial schema for the property management system',
  
  // Migration implementation
  up: async (db, context) => {
    console.log('Applying migration 1: initial_schema');
    
    // Create initial admin user
    await db.collection('users').doc('admin').set({
      email: 'admin@property-app.com',
      displayName: 'System Administrator',
      role: 'admin',
      emailVerified: true,
      createdAt: context.timestamp,
      updatedAt: context.timestamp
    });
    
    // Create property status tags
    const statusTags = [
      { id: 'available', name: '공실', category: 'status' },
      { id: 'underContract', name: '계약중', category: 'status' },
      { id: 'rented', name: '임대완료', category: 'status' }
    ];
    
    // Create property feature tags
    const featureTags = [
      { id: 'parking', name: '주차가능', category: 'feature' },
      { id: 'elevator', name: '엘리베이터', category: 'feature' },
      { id: 'security', name: '보안시설', category: 'feature' },
      { id: 'subway', name: '역세권', category: 'location' },
      { id: 'university', name: '대학가', category: 'location' },
      { id: 'park', name: '공원근처', category: 'location' },
      { id: 'pet', name: '애완동물가능', category: 'condition' },
      { id: 'furnished', name: '가구완비', category: 'condition' },
      { id: 'new', name: '신축', category: 'condition' }
    ];
    
    const batch = db.batch();
    
    // Add status tags
    for (const tag of statusTags) {
      const tagRef = db.collection('tags').doc(tag.id);
      batch.set(tagRef, {
        ...tag,
        createdAt: context.timestamp
      });
    }
    
    // Add feature tags
    for (const tag of featureTags) {
      const tagRef = db.collection('tags').doc(tag.id);
      batch.set(tagRef, {
        ...tag,
        createdAt: context.timestamp
      });
    }
    
    await batch.commit();
    
    console.log('Initial schema creation complete');
  },
  
  // Rollback implementation
  down: async (db, context) => {
    console.log('Rolling back migration 1: initial_schema');
    
    // Delete all tags
    const tagsSnapshot = await db.collection('tags').get();
    
    if (!tagsSnapshot.empty) {
      const batch = db.batch();
      
      tagsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${tagsSnapshot.size} tags`);
    }
    
    // Delete initial admin user
    try {
      await db.collection('users').doc('admin').delete();
      console.log('Deleted admin user');
    } catch (error) {
      console.error('Error deleting admin user:', error);
    }
    
    console.log('Rollback complete');
  }
};
