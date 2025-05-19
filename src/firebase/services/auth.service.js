import { auth } from '../config';
import { 
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * AuthService for handling user authentication
 */
export class AuthService {
  /**
   * Ensure user is authenticated (anonymously if needed)
   * @returns {Promise<Object>} - Current user
   */
  async ensureAuthenticated() {
    // Check if user is already signed in
    if (auth.currentUser) {
      return auth.currentUser;
    }
    
    // Anonymously sign in
    try {
      const userCredential = await signInAnonymously(auth);
      console.log('Anonymous authentication successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Anonymous authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Get current auth state
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    return signOut(auth);
  }
  
  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Callback function with user object
   * @returns {Function} - Unsubscribe function
   */
  subscribeToAuthChanges(callback) {
    return onAuthStateChanged(auth, callback);
  }
}

// Export single instance
export const authService = new AuthService();
