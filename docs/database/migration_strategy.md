# 데이터베이스 마이그레이션 전략

## 1. 개요

이 문서는 부동산 관리 애플리케이션의 데이터베이스 마이그레이션 전략을 설명합니다. 이 애플리케이션은 Firebase Firestore를 데이터베이스로 사용하며, 점진적인 스키마 변경을 관리하기 위한 전략이 필요합니다.

## 2. 마이그레이션 도구

Firebase Firestore는 스키마 없는(schemaless) NoSQL 데이터베이스이므로, 전통적인 SQL 데이터베이스처럼 스키마 변경에 대한 공식적인 마이그레이션 도구가 없습니다. 하지만 애플리케이션 레벨에서 마이그레이션을 관리하기 위해 다음 도구를 사용할 수 있습니다:

1. **Firestore Admin SDK**: Node.js 기반의 스크립트로 일괄 데이터 조작
2. **Cloud Functions**: 대규모 데이터 마이그레이션을 위한 백그라운드 함수
3. **커스텀 마이그레이션 프레임워크**: 버전 관리와 마이그레이션 실행을 처리하는 자체 구현 프레임워크

## 3. 마이그레이션 스크립트 구조

마이그레이션을 관리하기 위해 다음과 같은 디렉토리 구조를 사용합니다:

```
/migrations
  /scripts
    001_initial_schema.js
    002_add_location_to_properties.js
    003_update_user_roles.js
    ...
  /utils
    migration_runner.js
    version_tracker.js
    helpers.js
  index.js
  config.js
```

### 3.1 마이그레이션 스크립트 예시

각 마이그레이션 스크립트는 다음과 같은 구조를 가집니다:

```javascript
// 001_initial_schema.js
module.exports = {
  version: 1,
  name: 'initial_schema',
  description: 'Initial schema creation for Firestore collections',
  
  // 마이그레이션 적용
  up: async (db, context) => {
    // 마이그레이션 로직
    console.log('Applying migration 001: initial_schema');
    
    // 예시: 기본 사용자 역할 생성
    const roles = ['admin', 'agent', 'viewer'];
    const batch = db.batch();
    
    roles.forEach(role => {
      const roleRef = db.collection('roles').doc(role);
      batch.set(roleRef, {
        name: role,
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} role`,
        createdAt: context.timestamp
      });
    });
    
    await batch.commit();
    console.log('Migration 001 applied successfully');
  },
  
  // 롤백
  down: async (db, context) => {
    // 롤백 로직
    console.log('Rolling back migration 001: initial_schema');
    
    // 예시: 역할 컬렉션 삭제
    const rolesSnapshot = await db.collection('roles').get();
    const batch = db.batch();
    
    rolesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Migration 001 rolled back successfully');
  }
};
```

### 3.2 버전 추적

마이그레이션 버전을 추적하기 위해 Firestore에 특별한 컬렉션을 사용합니다:

```javascript
// version_tracker.js
const admin = require('firebase-admin');

class VersionTracker {
  constructor(db) {
    this.db = db;
    this.versionCollection = 'migration_versions';
  }
  
  // 현재 버전 가져오기
  async getCurrentVersion() {
    const versionDoc = await this.db.collection(this.versionCollection).doc('current').get();
    if (!versionDoc.exists) {
      return 0; // 초기 버전
    }
    return versionDoc.data().version;
  }
  
  // 버전 업데이트
  async updateVersion(version, migrationInfo) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // 현재 버전 업데이트
    await this.db.collection(this.versionCollection).doc('current').set({
      version,
      updatedAt: timestamp
    });
    
    // 버전 기록 유지
    await this.db.collection(this.versionCollection).doc(`v${version}`).set({
      version,
      name: migrationInfo.name,
      description: migrationInfo.description,
      appliedAt: timestamp
    });
  }
}

module.exports = VersionTracker;
```

### 3.3 마이그레이션 실행기

```javascript
// migration_runner.js
const admin = require('firebase-admin');
const VersionTracker = require('./version_tracker');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(db) {
    this.db = db;
    this.migrations = [];
    this.versionTracker = new VersionTracker(db);
  }
  
  // 마이그레이션 스크립트 로드
  loadMigrations(directory) {
    const files = fs.readdirSync(directory)
      .filter(file => file.match(/^\d{3}_.*\.js$/))
      .sort();
    
    files.forEach(file => {
      const migration = require(path.join(directory, file));
      this.migrations.push(migration);
    });
    
    console.log(`Loaded ${this.migrations.length} migrations`);
    return this;
  }
  
  // 모든 마이그레이션 실행
  async runMigrations() {
    const currentVersion = await this.versionTracker.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);
    console.log(`${pendingMigrations.length} migrations pending`);
    
    if (pendingMigrations.length === 0) {
      console.log('Database is up to date');
      return;
    }
    
    const context = {
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      
      try {
        await migration.up(this.db, context);
        await this.versionTracker.updateVersion(migration.version, migration);
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Error running migration ${migration.version}:`, error);
        throw error; // 마이그레이션 실패 시 중단
      }
    }
    
    console.log('All migrations completed successfully');
  }
  
  // 특정 버전으로 롤백
  async rollbackToVersion(targetVersion) {
    const currentVersion = await this.versionTracker.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    if (targetVersion >= currentVersion) {
      console.log(`Target version ${targetVersion} is not a rollback from current version ${currentVersion}`);
      return;
    }
    
    const migrationsToRollback = this.migrations
      .filter(m => m.version <= currentVersion && m.version > targetVersion)
      .sort((a, b) => b.version - a.version); // 역순으로 정렬
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations`);
    
    const context = {
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    for (const migration of migrationsToRollback) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
      
      try {
        await migration.down(this.db, context);
        await this.versionTracker.updateVersion(
          migration.version - 1,
          { name: `Rollback from ${migration.name}`, description: `Rolled back from version ${migration.version}` }
        );
        console.log(`Rollback of migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Error rolling back migration ${migration.version}:`, error);
        throw error; // 롤백 실패 시 중단
      }
    }
    
    console.log(`Successfully rolled back to version ${targetVersion}`);
  }
}

module.exports = MigrationRunner;
```

## 4. 마이그레이션 명령어

마이그레이션을 실행하기 위한 명령어를 `package.json`에 추가합니다:

```json
{
  "scripts": {
    "migrate": "node migrations/index.js",
    "migrate:create": "node migrations/create.js",
    "migrate:rollback": "node migrations/index.js rollback",
    "migrate:status": "node migrations/index.js status"
  }
}
```

## 5. 마이그레이션 스크립트 작성 지침

### 5.1 마이그레이션 스크립트 생성

새로운 마이그레이션 스크립트 생성을 위한 템플릿:

```javascript
// 00X_migration_name.js
module.exports = {
  version: X, // 증가하는 버전 번호
  name: 'migration_name',
  description: 'Brief description of the migration',
  
  // 마이그레이션 적용
  up: async (db, context) => {
    // 마이그레이션 로직 구현
  },
  
  // 롤백
  down: async (db, context) => {
    // 롤백 로직 구현
  }
};
```

### 5.2 일반적인 마이그레이션 작업

1. **컬렉션 추가**:
   ```javascript
   // 새 컬렉션 생성 예시
   up: async (db, context) => {
     // 특별한 작업 필요 없음 - 문서 추가 시 자동 생성됨
     const docRef = db.collection('newCollection').doc('initialDoc');
     await docRef.set({
       field1: 'value1',
       field2: 'value2',
       createdAt: context.timestamp
     });
   }
   ```

2. **필드 추가**:
   ```javascript
   // 기존 문서에 필드 추가
   up: async (db, context) => {
     const snapshot = await db.collection('someCollection').get();
     const batch = db.batch();
     
     snapshot.docs.forEach(doc => {
       batch.update(doc.ref, {
         newField: 'defaultValue',
         updatedAt: context.timestamp
       });
     });
     
     await batch.commit();
   }
   ```

3. **필드 이름 변경**:
   ```javascript
   // 필드 이름 변경
   up: async (db, context) => {
     const snapshot = await db.collection('someCollection').get();
     const batch = db.batch();
     
     snapshot.docs.forEach(doc => {
       const data = doc.data();
       if (data.oldField !== undefined) {
         batch.update(doc.ref, {
           newField: data.oldField,
           oldField: admin.firestore.FieldValue.delete(),
           updatedAt: context.timestamp
         });
       }
     });
     
     await batch.commit();
   }
   ```

4. **데이터 변환**:
   ```javascript
   // 데이터 형식 변경
   up: async (db, context) => {
     const snapshot = await db.collection('properties').get();
     const batch = db.batch();
     
     snapshot.docs.forEach(doc => {
       const data = doc.data();
       if (typeof data.price === 'string') {
         batch.update(doc.ref, {
           price: parseFloat(data.price) || 0,
           updatedAt: context.timestamp
         });
       }
     });
     
     await batch.commit();
   }
   ```

## 6. 대용량 데이터 마이그레이션

대용량 데이터 마이그레이션을 위해 Cloud Functions를 사용할 수 있습니다:

```javascript
// 대용량 데이터 마이그레이션 함수
exports.migrateData = functions.runWith({
  timeoutSeconds: 540, // 9분 (최대 타임아웃)
  memory: '1GB'
}).https.onRequest(async (req, res) => {
  // 인증 확인
  const auth = req.get('Authorization');
  if (!auth || auth !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    res.status(403).send('Unauthorized');
    return;
  }

  const db = admin.firestore();
  
  // 페이지네이션을 통한 처리
  const { collection, batchSize = 500, lastDocId } = req.body;
  
  let query = db.collection(collection).limit(batchSize);
  if (lastDocId) {
    const lastDoc = await db.collection(collection).doc(lastDocId).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    res.json({ complete: true, processed: 0 });
    return;
  }
  
  // 배치 처리
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    // 마이그레이션 로직
    batch.update(doc.ref, {
      // 업데이트할 필드
      updatedField: 'new value',
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  
  // 결과 반환
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  res.json({
    complete: snapshot.docs.length < batchSize,
    processed: snapshot.docs.length,
    lastDocId: lastVisible.id
  });
});
```

이 Cloud Function은 REST API로 호출할 수 있으며, 대용량 데이터를 배치로 처리할 수 있습니다. 클라이언트 코드는 다음과 같이 작성할 수 있습니다:

```javascript
// 대용량 마이그레이션 클라이언트
async function runLargeMigration(collection) {
  let complete = false;
  let lastDocId = null;
  let totalProcessed = 0;
  
  while (!complete) {
    const response = await fetch('https://us-central1-your-project.cloudfunctions.net/migrateData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`
      },
      body: JSON.stringify({
        collection,
        batchSize: 500,
        lastDocId
      })
    });
    
    const result = await response.json();
    totalProcessed += result.processed;
    
    console.log(`Processed ${result.processed} documents, total: ${totalProcessed}`);
    
    complete = result.complete;
    lastDocId = result.lastDocId;
    
    // API 호출 간에 약간의 딜레이를 둠
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Migration complete. Total documents processed: ${totalProcessed}`);
}
```

## 7. 모범 사례

### 7.1 마이그레이션 계획

1. **영향 평가**: 마이그레이션 전에 영향 범위를 평가합니다.
2. **백업**: 중요한 데이터 변경 전에 항상 백업을 수행합니다.
3. **테스트**: 프로덕션 환경 적용 전에 테스트 환경에서 마이그레이션을 테스트합니다.
4. **롤백 계획**: 모든 마이그레이션에 대한 롤백 계획이 있어야 합니다.

### 7.2 실행 전략

1. **적은 영향의 마이그레이션 먼저**: 영향이 적은 마이그레이션부터 시작합니다.
2. **점진적 접근**: 한 번에 대규모 변경보다 작은 단계로 나누어 실행합니다.
3. **오프 피크 시간 실행**: 사용자가 적은 시간에 마이그레이션을 실행합니다.
4. **모니터링**: 마이그레이션 중 및 이후에 시스템을 모니터링합니다.

### 7.3 문서화

1. **변경 로그**: 모든 마이그레이션을 문서화합니다.
2. **의존성 표시**: 마이그레이션 간의 의존성을 명확히 기록합니다.
3. **데이터 모델 변경**: 마이그레이션으로 인한 데이터 모델 변경을 문서화합니다.

## 8. 마이그레이션 예시

### 8.1 초기 스키마 생성

```javascript
// 001_initial_schema.js
module.exports = {
  version: 1,
  name: 'initial_schema',
  description: 'Initial schema setup for the property management system',
  
  up: async (db, context) => {
    // 초기 관리자 사용자 생성
    await db.collection('users').doc('admin').set({
      email: 'admin@example.com',
      role: 'admin',
      displayName: 'System Administrator',
      emailVerified: true,
      createdAt: context.timestamp,
      updatedAt: context.timestamp
    });
    
    // 기본 태그 생성
    const tags = [
      { id: 'parking', name: '주차가능', category: 'facility' },
      { id: 'elevator', name: '엘리베이터', category: 'facility' },
      { id: 'security', name: '보안시설', category: 'facility' },
      { id: 'subway', name: '역세권', category: 'location' },
      { id: 'pet', name: '반려동물', category: 'condition' }
    ];
    
    const batch = db.batch();
    
    tags.forEach(tag => {
      const tagRef = db.collection('tags').doc(tag.id);
      batch.set(tagRef, {
        ...tag,
        createdAt: context.timestamp
      });
    });
    
    await batch.commit();
  },
  
  down: async (db, context) => {
    // 태그 컬렉션 삭제
    const tagsSnapshot = await db.collection('tags').get();
    let batch = db.batch();
    
    tagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // 관리자 사용자 삭제
    await db.collection('users').doc('admin').delete();
  }
};
```

### 8.2 속성 필드 추가

```javascript
// 002_add_location_to_properties.js
module.exports = {
  version: 2,
  name: 'add_location_to_properties',
  description: 'Add location fields to properties collection',
  
  up: async (db, context) => {
    const snapshot = await db.collection('properties').get();
    
    if (snapshot.empty) {
      console.log('No properties found, nothing to migrate');
      return;
    }
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        location_latitude: 0, // 기본값
        location_longitude: 0, // 기본값
        updatedAt: context.timestamp
      });
    });
    
    await batch.commit();
  },
  
  down: async (db, context) => {
    const snapshot = await db.collection('properties').get();
    
    if (snapshot.empty) {
      console.log('No properties found, nothing to roll back');
      return;
    }
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        location_latitude: admin.firestore.FieldValue.delete(),
        location_longitude: admin.firestore.FieldValue.delete(),
        updatedAt: context.timestamp
      });
    });
    
    await batch.commit();
  }
};
```

### 8.3 사용자 역할 업데이트

```javascript
// 003_update_user_roles.js
module.exports = {
  version: 3,
  name: 'update_user_roles',
  description: 'Update user roles to new role structure',
  
  up: async (db, context) => {
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('No users found, nothing to migrate');
      return;
    }
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let newRole = data.role;
      
      // 역할 이름 변경 (예: 'administrator' -> 'admin')
      if (data.role === 'administrator') {
        newRole = 'admin';
      } else if (data.role === 'user') {
        newRole = 'agent';
      }
      
      batch.update(doc.ref, {
        role: newRole,
        updatedAt: context.timestamp
      });
    });
    
    await batch.commit();
  },
  
  down: async (db, context) => {
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('No users found, nothing to roll back');
      return;
    }
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let oldRole = data.role;
      
      // 역할 이름 복원
      if (data.role === 'admin') {
        oldRole = 'administrator';
      } else if (data.role === 'agent') {
        oldRole = 'user';
      }
      
      batch.update(doc.ref, {
        role: oldRole,
        updatedAt: context.timestamp
      });
    });
    
    await batch.commit();
  }
};
```

## 9. 마이그레이션 상태 확인

마이그레이션 상태를 확인하기 위한 도구:

```javascript
// status.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const VersionTracker = require('./utils/version_tracker');

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const versionTracker = new VersionTracker(db);

async function checkStatus() {
  try {
    // 현재 버전 확인
    const currentVersion = await versionTracker.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    // 마이그레이션 기록 가져오기
    const migrationsSnapshot = await db.collection('migration_versions')
      .orderBy('version', 'desc')
      .get();
    
    console.log('\nMigration History:');
    console.log('=================');
    
    if (migrationsSnapshot.empty) {
      console.log('No migrations found');
    } else {
      migrationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Version ${data.version}: ${data.name}`);
        console.log(`Applied at: ${data.appliedAt ? data.appliedAt.toDate() : 'Unknown'}`);
        console.log(`Description: ${data.description || 'No description'}`);
        console.log('-----------------');
      });
    }
  } catch (error) {
    console.error('Error checking migration status:', error);
  }
}

checkStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

## 10. 결론

이 문서는 Firebase Firestore를 사용하는 부동산 관리 애플리케이션의 데이터베이스 마이그레이션 전략을 설명했습니다. 이 전략을 통해 스키마 변경을 체계적으로 관리하고, 필요한 경우 롤백을 수행할 수 있습니다.

마이그레이션은 버전 관리 시스템과 함께 추적되어야 하며, 변경 사항은 명확히 문서화되어야 합니다. 데이터 무결성을 보장하기 위해 마이그레이션 전에 항상 백업을 수행하고, 테스트 환경에서 먼저 테스트해야 합니다.
