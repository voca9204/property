import { FirestoreService } from './firestore.service';
import { auth } from '../config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo
} from 'firebase/auth';

/**
 * UserService for managing users in Firebase Auth and Firestore
 */
export class UserService extends FirestoreService {
  constructor() {
    super('users');
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} - User data
   */
  async register(email, password, userData = {}) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);

      // Update display name if provided
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }
      
      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        role: userData.role || 'agent',
        phone: userData.phone || '',
        company: userData.company || '',
        ...userData
      };
      
      await this.createWithId(user.uid, userDoc);
      
      return userDoc;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User credential
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Get current user
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Get current user with Firestore data
   * @returns {Promise<Object|null>} - User data or null
   */
  async getCurrentUserWithData() {
    const user = this.getCurrentUser();
    
    if (!user) {
      return null;
    }
    
    try {
      const userData = await this.getById(user.uid);
      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<void>}
   */
  async updateProfile(userData) {
    const user = this.getCurrentUser();
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }
    
    try {
      // Update Auth profile if display name or photo URL provided
      if (userData.displayName || userData.photoURL) {
        await updateProfile(user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL
        });
      }
      
      // Update Firestore document
      await this.update(user.uid, userData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updateUserPassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }
    
    if (!user.email) {
      throw new Error('User has no email address');
    }
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * @param {string} password - Current password for verification
   * @returns {Promise<void>}
   */
  async deleteAccount(password) {
    const user = this.getCurrentUser();
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }
    
    if (!user.email) {
      throw new Error('User has no email address');
    }
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete Firestore document
      await this.delete(user.uid);
      
      // Delete Auth user
      await deleteUser(user);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} - Array of user data
   */
  async getUsersByRole(role) {
    return this.query({
      conditions: [['role', '==', role]]
    });
  }

  /**
   * Update user role
   * @param {string} uid - User ID
   * @param {string} role - New role
   * @returns {Promise<void>}
   */
  async updateUserRole(uid, role) {
    const validRoles = ['admin', 'agent', 'viewer'];
    
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    await this.update(uid, { role });
  }
  
  /**
   * Login with Google
   * @returns {Promise<Object>} - User credential
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // 구글 로그인에 필요한 스코프 추가
      provider.addScope('email');
      provider.addScope('profile');
      
      // 계정 선택 페이지 항상 표시
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // 개발 환경에서는 리디렉션 방식 사용
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 현재 URL 저장 (로그인 후 돌아오기 위함)
        sessionStorage.setItem('authRedirectURL', window.location.href);
        
        // 리디렉션 방식으로 로그인
        await signInWithRedirect(auth, provider);
        return null; // 리디렉션 후에는 반환값이 의미 없음
      } else {
        // 프로덕션 환경에서는 팝업 방식 사용
        const userCredential = await signInWithPopup(auth, provider);
        await this._processGoogleAuthResult(userCredential);
        return userCredential;
      }
    } catch (error) {
      console.error('Error logging in with Google:', error);
      throw error;
    }
  }
  
  /**
   * Process Google authentication result
   * @param {Object} userCredential - User credential from Firebase Auth
   * @private
   */
  async _processGoogleAuthResult(userCredential) {
    const user = userCredential.user;
    const additionalInfo = getAdditionalUserInfo(userCredential);
    
    try {
      // 이미 존재하는 사용자인지 확인
      const userExists = await this.getById(user.uid);
      
      // 신규 사용자인 경우 Firestore에 문서 생성
      if (!userExists || additionalInfo?.isNewUser) {
        const userDoc = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'agent',
          createdAt: new Date(),
          updatedAt: new Date(),
          authProvider: 'google',
          lastLogin: new Date()
        };
        
        await this.createWithId(user.uid, userDoc);
      } else {
        // 기존 사용자의 로그인 정보 업데이트
        await this.update(user.uid, {
          lastLogin: new Date(),
          updatedAt: new Date(),
          // 구글 로그인 시 업데이트 가능한 정보
          photoURL: user.photoURL || userExists.photoURL,
          displayName: user.displayName || userExists.displayName,
          emailVerified: user.emailVerified
        });
      }
    } catch (firestoreError) {
      console.error('Error updating Firestore after Google login:', firestoreError);
      // Firestore 오류가 발생해도 인증은 성공한 것으로 처리
    }
  }
}

// Export single instance
export const userService = new UserService();
