// Migration runner utility
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Ensure environment variables are loaded
require('dotenv').config();

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();
const MIGRATIONS_DIR = path.join(__dirname, 'versions');
const MIGRATION_COLLECTION = 'migration_versions';

class Migrator {
  constructor() {
    this.migrations = [];
    this.loadMigrations();
  }

  loadMigrations() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.match(/^\d{3}_.*\.js$/))
      .sort();

    console.log(`Found ${files.length} migration files`);

    files.forEach(file => {
      const filePath = path.join(MIGRATIONS_DIR, file);
      try {
        const migration = require(filePath);
        this.migrations.push({
          version: migration.version,
          name: migration.name,
          up: migration.up,
          down: migration.down,
          description: migration.description || '',
          fileName: file
        });
      } catch (error) {
        console.error(`Error loading migration file ${file}:`, error);
        process.exit(1);
      }
    });
  }

  async getCurrentVersion() {
    try {
      const versionDoc = await db.collection(MIGRATION_COLLECTION).doc('current').get();
      if (!versionDoc.exists) {
        return 0; // Initial version
      }
      return versionDoc.data().version;
    } catch (error) {
      console.error('Error getting current version:', error);
      return 0;
    }
  }

  async updateVersion(version, migrationInfo) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    try {
      // Update current version
      await db.collection(MIGRATION_COLLECTION).doc('current').set({
        version,
        updatedAt: timestamp
      });
      
      // Keep history
      await db.collection(MIGRATION_COLLECTION).doc(`v${version}`).set({
        version,
        name: migrationInfo.name,
        description: migrationInfo.description,
        appliedAt: timestamp
      });
      
      console.log(`Updated version to ${version}`);
    } catch (error) {
      console.error('Error updating version:', error);
      throw error;
    }
  }

  async migrate() {
    console.log('Starting migration...');
    
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    if (pendingMigrations.length === 0) {
      console.log('Database is already up to date.');
      return;
    }
    
    const context = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      firestore: admin.firestore
    };
    
    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      
      try {
        await migration.up(db, context);
        await this.updateVersion(migration.version, migration);
        console.log(`Successfully applied migration ${migration.version}`);
      } catch (error) {
        console.error(`Error applying migration ${migration.version}:`, error);
        process.exit(1);
      }
    }
    
    console.log('Migration completed successfully');
  }

  async rollback(targetVersion) {
    console.log('Starting rollback...');
    
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    if (!targetVersion) {
      targetVersion = currentVersion - 1;
    }
    
    if (targetVersion < 0) {
      console.error('Cannot roll back to a negative version');
      process.exit(1);
    }
    
    if (targetVersion >= currentVersion) {
      console.log(`Target version ${targetVersion} is not a rollback from current version ${currentVersion}`);
      return;
    }
    
    const migrationsToRollback = this.migrations
      .filter(m => m.version <= currentVersion && m.version > targetVersion)
      .sort((a, b) => b.version - a.version); // Reverse order
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations to version ${targetVersion}`);
    
    if (migrationsToRollback.length === 0) {
      console.log('No migrations to roll back');
      return;
    }
    
    const context = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      firestore: admin.firestore
    };
    
    for (const migration of migrationsToRollback) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
      
      try {
        if (!migration.down) {
          console.error(`Migration ${migration.version} does not have a down function`);
          process.exit(1);
        }
        
        await migration.down(db, context);
        await this.updateVersion(
          migration.version - 1,
          { 
            name: `Rollback from ${migration.name}`, 
            description: `Rolled back from version ${migration.version}`
          }
        );
        console.log(`Successfully rolled back migration ${migration.version}`);
      } catch (error) {
        console.error(`Error rolling back migration ${migration.version}:`, error);
        process.exit(1);
      }
    }
    
    console.log(`Successfully rolled back to version ${targetVersion}`);
  }

  async status() {
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);
    
    console.log(`\nPending migrations: ${pendingMigrations.length}`);
    
    if (pendingMigrations.length > 0) {
      console.log('\nPending:');
      pendingMigrations.forEach(m => {
        console.log(`  ${m.version}: ${m.name} (${m.fileName})`);
      });
    }
    
    // Get migration history
    try {
      const historySnapshot = await db.collection(MIGRATION_COLLECTION)
        .where('version', '<=', currentVersion)
        .orderBy('version', 'desc')
        .get();
      
      console.log('\nMigration history:');
      
      if (historySnapshot.empty) {
        console.log('  No migrations have been applied yet');
      } else {
        historySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const appliedAt = data.appliedAt ? data.appliedAt.toDate().toISOString() : 'Unknown';
          console.log(`  ${data.version}: ${data.name} (applied at ${appliedAt})`);
        });
      }
    } catch (error) {
      console.error('Error getting migration history:', error);
    }
  }

  async createMigration(name) {
    if (!name) {
      console.error('Migration name is required');
      process.exit(1);
    }
    
    // Convert name to snake_case
    const snakeName = name.replace(/\s+/g, '_').toLowerCase();
    
    // Find the next version number
    let nextVersion = 1;
    if (this.migrations.length > 0) {
      nextVersion = Math.max(...this.migrations.map(m => m.version)) + 1;
    }
    
    // Create file name with padding
    const paddedVersion = String(nextVersion).padStart(3, '0');
    const fileName = `${paddedVersion}_${snakeName}.js`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    
    // Template for new migration
    const template = `// Migration: ${name}
module.exports = {
  version: ${nextVersion},
  name: '${snakeName}',
  description: 'TODO: Add description',
  
  // Migration implementation
  up: async (db, context) => {
    // TODO: Implement migration
    console.log('Applying migration ${nextVersion}: ${snakeName}');
    
    // Example: Create or update a document
    // await db.collection('someCollection').doc('someDoc').set({
    //   field: 'value',
    //   createdAt: context.timestamp
    // });
  },
  
  // Rollback implementation
  down: async (db, context) => {
    // TODO: Implement rollback
    console.log('Rolling back migration ${nextVersion}: ${snakeName}');
    
    // Example: Delete the document created in the up migration
    // await db.collection('someCollection').doc('someDoc').delete();
  }
};
`;
    
    // Ensure migrations directory exists
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filePath, template);
    
    console.log(`Created migration file: ${filePath}`);
  }
}

// Command line interface
async function main() {
  const migrator = new Migrator();
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'migrate':
      await migrator.migrate();
      break;
    
    case 'rollback':
      const targetVersion = parseInt(process.argv[3] || '0', 10);
      await migrator.rollback(targetVersion);
      break;
    
    case 'status':
      await migrator.status();
      break;
    
    case 'create':
      const name = process.argv[3];
      await migrator.createMigration(name);
      break;
    
    case 'help':
    default:
      console.log(`
Firebase Firestore Migration Tool

Usage:
  node migrate.js <command> [options]

Commands:
  migrate                 Run all pending migrations
  rollback [version]      Roll back to a specific version (defaults to previous version)
  status                  Show current migration status
  create <name>           Create a new migration file
  help                    Show this help message

Examples:
  node migrate.js migrate
  node migrate.js rollback 5
  node migrate.js status
  node migrate.js create "add user roles"
`);
      break;
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
