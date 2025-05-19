# 부동산 관리 시스템 데이터베이스 스키마

## 1. 개요

이 문서는 부동산 관리 및 쇼케이스 애플리케이션을 위한 데이터베이스 스키마를 설명합니다. 이 스키마는 Firebase Firestore를 사용하여 구현되었으며, 부동산 정보 관리, 고객 관리, 쇼케이스 생성 등의 기능을 지원합니다.

## 2. 엔티티 및 관계

### 2.1 사용자 (Users)

사용자 엔티티는 시스템에 접근할 수 있는 모든 사용자를 나타냅니다. 주로 부동산 중개인, 관리자, 뷰어 등의 역할을 가집니다.

**컬렉션명**: `users`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 사용자 고유 식별자 | PK, Firebase Auth UID |
| email | string | 사용자 이메일 | Not null, Unique |
| password_hash | string | 비밀번호 해시 | Not null, Firebase Auth에서 관리 |
| display_name | string | 사용자 표시 이름 | |
| photo_url | string | 프로필 사진 URL | |
| phone_number | string | 전화번호 | |
| role | enum | 사용자 역할 (admin, agent, viewer) | Not null, Default: 'agent' |
| email_verified | boolean | 이메일 인증 여부 | Not null, Default: false |
| created_at | timestamp | 생성 일시 | Not null |
| updated_at | timestamp | 수정 일시 | Not null |

**관계**:
- 1:N `properties`: 한 사용자는 여러 부동산을 소유/관리할 수 있습니다.
- 1:N `clients`: 한 사용자는 여러 고객을 관리할 수 있습니다.
- 1:N `showcases`: 한 사용자는 여러 쇼케이스를 생성할 수 있습니다.
- 1:N `appointments`: 한 사용자는 여러 예약을 담당할 수 있습니다.
- 1:N `messages` (sender): 한 사용자는 여러 메시지를 보낼 수 있습니다.
- 1:N `messages` (recipient): 한 사용자는 여러 메시지를 받을 수 있습니다.
- 1:N `notifications`: 한 사용자는 여러 알림을 받을 수 있습니다.

### 2.2 부동산 (Properties)

부동산 엔티티는 임대 또는 판매를 위한 부동산 정보를 저장합니다.

**컬렉션명**: `properties`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 부동산 고유 식별자 | PK |
| title | string | 부동산 제목 | Not null |
| address | string | 주소 | Not null |
| floor | string | 층/빌딩 내 위치 | |
| deposit | number | 보증금 (원) | Not null |
| monthly_rent | number | 월세 (원) | Not null |
| maintenance_fee | number | 관리비 (원) | |
| area | number | 면적(제곱미터) | Not null |
| notes | text | 추가 메모/비고 | |
| status | enum | 상태 (available, underContract, rented) | Not null, Default: 'available' |
| owner_id | string | 소유자(에이전트) ID | Not null, FK -> users.id |
| created_at | timestamp | 생성 일시 | Not null |
| updated_at | timestamp | 수정 일시 | Not null |
| location_latitude | number | 위도 | |
| location_longitude | number | 경도 | |

**관계**:
- N:1 `users`: 각 부동산은 한 사용자에 의해 소유/관리됩니다.
- 1:N `property_images`: 한 부동산은 여러 이미지를 가질 수 있습니다.
- M:N `tags`: 부동산은 여러 태그를 가질 수 있으며, 태그는 여러 부동산에 적용될 수 있습니다. (junction: `property_tags`)
- 1:N `appointments`: 한 부동산에 대해 여러 예약이 있을 수 있습니다.
- M:N `showcases`: 부동산은 여러 쇼케이스에 포함될 수 있으며, 쇼케이스는 여러 부동산을 포함할 수 있습니다. (junction: `showcase_properties`)

### 2.3 부동산 이미지 (Property Images)

부동산 이미지 엔티티는 각 부동산에 연결된 이미지를 저장합니다.

**컬렉션명**: `properties/{propertyId}/images` (서브컬렉션)

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 이미지 고유 식별자 | PK |
| property_id | string | 연결된 부동산 ID | Not null, FK -> properties.id |
| image_url | string | 이미지 URL | Not null |
| thumbnail_url | string | 썸네일 URL | Not null |
| display_order | number | 표시 순서 | Not null, Default: 0 |
| created_at | timestamp | 생성 일시 | Not null |

**관계**:
- N:1 `properties`: 각 이미지는 한 부동산에 속합니다.

### 2.4 태그 (Tags)

태그 엔티티는 부동산을 분류하는 데 사용되는 키워드를 저장합니다.

**컬렉션명**: `tags`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 태그 고유 식별자 | PK |
| name | string | 태그 이름 | Not null, Unique |
| category | string | 태그 카테고리 | Not null |
| created_at | timestamp | 생성 일시 | Not null |

**관계**:
- M:N `properties`: 태그는 여러 부동산에 적용될 수 있으며, 부동산은 여러 태그를 가질 수 있습니다. (junction: `property_tags`)

### 2.5 부동산-태그 관계 (Property Tags)

부동산과 태그 간의 다대다 관계를 표현하는 연결 엔티티입니다.

**컬렉션명**: `property_tags`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| property_id | string | 부동산 ID | PK, FK -> properties.id |
| tag_id | string | 태그 ID | PK, FK -> tags.id |
| created_at | timestamp | 생성 일시 | Not null |

**관계**:
- N:1 `properties`: 각 부동산-태그 관계는 한 부동산에 연결됩니다.
- N:1 `tags`: 각 부동산-태그 관계는 한 태그에 연결됩니다.

### 2.6 고객 (Clients)

고객 엔티티는 부동산 중개인이 관리하는 잠재적 임차인 또는 구매자 정보를 저장합니다.

**컬렉션명**: `clients`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 고객 고유 식별자 | PK |
| name | string | 고객 이름 | Not null |
| email | string | 고객 이메일 | Not null |
| phone | string | 전화번호 | |
| agent_id | string | 담당 에이전트 ID | Not null, FK -> users.id |
| preferences | json | 선호 사항 (JSON 형식) | |
| notes | text | 추가 메모 | |
| created_at | timestamp | 생성 일시 | Not null |
| updated_at | timestamp | 수정 일시 | Not null |

**관계**:
- N:1 `users`: 각 고객은 한 에이전트에 의해 관리됩니다.
- 1:N `appointments`: 한 고객은 여러 예약을 가질 수 있습니다.
- 1:N `client_interactions`: 한 고객은 여러 상호작용을 가질 수 있습니다.
- 1:N `showcases`: 한 고객은 여러 쇼케이스에 연결될 수 있습니다.

### 2.7 쇼케이스 (Showcases)

쇼케이스 엔티티는 에이전트가 고객에게 공유하는 부동산 모음을 저장합니다.

**컬렉션명**: `showcases`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 쇼케이스 고유 식별자 | PK |
| title | string | 쇼케이스 제목 | Not null |
| url_id | string | 고유 URL 식별자 | Not null, Unique |
| description | text | 쇼케이스 설명 | |
| creator_id | string | 생성자 ID | Not null, FK -> users.id |
| client_id | string | 대상 고객 ID | FK -> clients.id |
| branding | json | 브랜딩 설정 (JSON 형식) | |
| active | boolean | 활성화 상태 | Not null, Default: true |
| view_count | number | 조회수 | Not null, Default: 0 |
| invitation_count | number | 초대 횟수 | Default: 0 |
| created_at | timestamp | 생성 일시 | Not null |
| updated_at | timestamp | 수정 일시 | Not null |
| last_viewed | timestamp | 마지막 조회 일시 | |

**관계**:
- N:1 `users`: 각 쇼케이스는 한 사용자에 의해 생성됩니다.
- N:1 `clients`: 각 쇼케이스는 한 고객에게 공유될 수 있습니다.
- M:N `properties`: 쇼케이스는 여러 부동산을 포함할 수 있으며, 부동산은 여러 쇼케이스에 포함될 수 있습니다. (junction: `showcase_properties`)

### 2.8 쇼케이스-부동산 관계 (Showcase Properties)

쇼케이스와 부동산 간의 다대다 관계를 표현하는 연결 엔티티입니다.

**컬렉션명**: `showcases/{showcaseId}/properties` (서브컬렉션)

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| showcase_id | string | 쇼케이스 ID | PK, FK -> showcases.id |
| property_id | string | 부동산 ID | PK, FK -> properties.id |
| display_order | number | 표시 순서 | Not null, Default: 0 |
| created_at | timestamp | 생성 일시 | Not null |

**관계**:
- N:1 `showcases`: 각 쇼케이스-부동산 관계는 한 쇼케이스에 연결됩니다.
- N:1 `properties`: 각 쇼케이스-부동산 관계는 한 부동산에 연결됩니다.

### 2.9 고객 상호작용 (Client Interactions)

고객 상호작용 엔티티는 고객의 시스템 내 활동을 기록합니다.

**컬렉션명**: `clients/{clientId}/interactions` (서브컬렉션)

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 상호작용 고유 식별자 | PK |
| client_id | string | 고객 ID | Not null, FK -> clients.id |
| type | enum | 상호작용 유형 (showcase_view, property_view, message, appointment) | Not null |
| reference_id | string | 참조 ID (쇼케이스/부동산/메시지 ID) | |
| user_id | string | 기록한 사용자 ID | Not null, FK -> users.id |
| timestamp | timestamp | 상호작용 일시 | Not null |
| details | json | 추가 상세 정보 (JSON 형식) | |

**관계**:
- N:1 `clients`: 각 상호작용은 한 고객에 연결됩니다.
- N:1 `users`: 각 상호작용은 한 사용자에 의해 기록됩니다.

### 2.10 예약 (Appointments)

예약 엔티티는 부동산 방문 예약을 관리합니다.

**컬렉션명**: `appointments`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 예약 고유 식별자 | PK |
| client_id | string | 고객 ID | Not null, FK -> clients.id |
| property_id | string | 부동산 ID | Not null, FK -> properties.id |
| agent_id | string | 담당 에이전트 ID | Not null, FK -> users.id |
| scheduled_at | timestamp | 예약 일시 | Not null |
| duration_minutes | number | 소요 시간 (분) | Not null, Default: 30 |
| status | enum | 예약 상태 (scheduled, completed, cancelled, rescheduled) | Not null, Default: 'scheduled' |
| notes | text | 추가 메모 | |
| created_at | timestamp | 생성 일시 | Not null |
| updated_at | timestamp | 수정 일시 | Not null |

**관계**:
- N:1 `clients`: 각 예약은 한 고객에 의해 생성됩니다.
- N:1 `properties`: 각 예약은 한 부동산에 대한 것입니다.
- N:1 `users`: 각 예약은 한 에이전트에 의해 처리됩니다.

### 2.11 메시지 (Messages)

메시지 엔티티는 사용자 간 커뮤니케이션을 저장합니다.

**컬렉션명**: `messages`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 메시지 고유 식별자 | PK |
| sender_id | string | 발신자 ID | Not null, FK -> users.id |
| recipient_id | string | 수신자 ID | Not null, FK -> users.id |
| content | text | 메시지 내용 | Not null |
| read | boolean | 읽음 여부 | Not null, Default: false |
| created_at | timestamp | 생성 일시 | Not null |
| read_at | timestamp | 읽은 일시 | |

**관계**:
- N:1 `users` (sender): 각 메시지는 한 사용자에 의해 전송됩니다.
- N:1 `users` (recipient): 각 메시지는 한 사용자에게 수신됩니다.

### 2.12 알림 (Notifications)

알림 엔티티는 사용자를 위한 알림을 저장합니다.

**컬렉션명**: `notifications`

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | string | 알림 고유 식별자 | PK |
| recipient_id | string | 수신자 ID | Not null, FK -> users.id |
| sender_id | string | 발신자 ID | FK -> users.id |
| type | enum | 알림 유형 (message, showcase, appointment, system) | Not null |
| title | string | 알림 제목 | Not null |
| body | text | 알림 내용 | Not null |
| read | boolean | 읽음 여부 | Not null, Default: false |
| reference_id | string | 참조 ID | |
| reference_type | string | 참조 유형 | |
| created_at | timestamp | 생성 일시 | Not null |
| read_at | timestamp | 읽은 일시 | |

**관계**:
- N:1 `users` (recipient): 각 알림은 한 사용자에게 수신됩니다.
- N:1 `users` (sender): 각 알림은 한 사용자에 의해 발송될 수 있습니다.

## 3. 설계 결정 사항

### 3.1 Firebase Firestore 구현 전략

Firestore는 NoSQL 데이터베이스로, 관계형 데이터베이스와 다른 접근 방식이 필요합니다. 다음과 같은 전략을 사용했습니다:

1. **컬렉션 및 서브컬렉션**: 주요 엔티티는 최상위 컬렉션으로 구현하고, 1:N 관계의 일부는 서브컬렉션으로 구현했습니다.
   - 예: `properties/{propertyId}/images`는 부동산 이미지를 부동산의 서브컬렉션으로 구현

2. **조인 테이블 접근**: M:N 관계는 별도의 컬렉션으로 구현했습니다.
   - 예: `property_tags`는 부동산과 태그 간의 M:N 관계를 관리

3. **중복 데이터**: 쿼리 성능을 위해 일부 데이터 중복을 허용했습니다.
   - 예: 부동산 이미지에 `property_id`를 포함하여 역참조 가능

### 3.2 인덱싱 전략

Firestore 쿼리 성능을 최적화하기 위해 다음과 같은 복합 인덱스를 생성할 계획입니다:

1. **부동산 검색 인덱스**:
   - `status, created_at`
   - `owner_id, status`
   - `deposit, monthly_rent, area`

2. **고객 관련 인덱스**:
   - `agent_id, created_at`

3. **쇼케이스 관련 인덱스**:
   - `creator_id, created_at`
   - `client_id, created_at`
   - `url_id`

4. **예약 관련 인덱스**:
   - `agent_id, scheduled_at`
   - `client_id, scheduled_at`
   - `property_id, scheduled_at`
   - `status, scheduled_at`

### 3.3 보안 규칙

Firestore 보안 규칙은 다음 원칙에 따라 구현되었습니다:

1. **사용자 인증**: 모든 데이터 액세스는 인증된 사용자만 가능합니다.
2. **역할 기반 액세스 제어**: 사용자 역할(admin, agent, viewer)에 따라 데이터 액세스 권한이 다릅니다.
3. **소유권 기반 액세스**: 사용자는 자신이 소유한 데이터만 수정할 수 있습니다.
4. **공유 리소스 접근**: 일부 데이터(예: 쇼케이스)는 공유 URL을 통해 인증되지 않은 사용자도 접근 가능합니다.

## 4. 마이그레이션 전략

데이터베이스 스키마 변경이 필요한 경우 다음 마이그레이션 전략을 따를 계획입니다:

1. **점진적 마이그레이션**: 대규모 마이그레이션보다 작은 단계로 분할하여 위험 최소화
2. **백업 및 복원**: 마이그레이션 전 데이터 백업 수행
3. **다운타임 최소화**: 가능한 경우 무중단 마이그레이션 수행
4. **롤백 계획**: 문제 발생 시 이전 상태로 복원할 수 있는 계획 마련
5. **버전 관리**: 스키마 변경 사항 버전 관리 및 문서화

## 5. 성능 최적화

데이터베이스 성능을 최적화하기 위한 전략입니다:

1. **적절한 인덱싱**: 자주 사용되는 쿼리에 대한 인덱스 생성
2. **데이터 분할**: 대용량 컬렉션은 서브컬렉션으로 분할
3. **페이지네이션**: 대량의 데이터 조회 시 페이지네이션 사용
4. **쿼리 최적화**: 필터링 및 정렬 조건 최적화
5. **캐싱**: 자주 접근하는 데이터에 대한 클라이언트 측 캐싱

## 6. 확장성 고려사항

향후 애플리케이션 성장에 대비한 확장성 고려사항입니다:

1. **샤딩**: 대용량 데이터 처리를 위한 샤딩 전략 마련
2. **백업 및 복제**: 데이터 안정성을 위한 백업 및 복제 방안
3. **지역별 데이터**: 지역에 따른 데이터 분리 가능성 고려
4. **다양한 부동산 유형**: 다양한 부동산 유형을 지원할 수 있는 유연한 스키마
5. **분석 및 보고**: 분석 및 보고 기능을 위한 데이터 구조 고려
