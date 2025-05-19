// Firebase 초기화 설정
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 웹 앱의 Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyA9fxYo9BbUy5iNpU4IMzdtsLwkXycPkfc",
  authDomain: "property-a148c.firebaseapp.com",
  projectId: "property-a148c",
  storageBucket: "property-a148c.firebasestorage.app",
  messagingSenderId: "752363513923",
  appId: "1:752363513923:web:6db3b5a2d0fc9667b34cf6"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
