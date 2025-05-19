import { useState, useEffect } from 'react';
import { userService } from '../firebase/services';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * Hook to handle user authentication
 * @returns {Object} - User, loading state, and authentication functions
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userData = await userService.getById(firebaseUser.uid);
          setUser({
            ...firebaseUser,
            ...userData
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} - User data
   */
  const register = async (email, password, userData = {}) => {
    try {
      setError(null);
      return await userService.register(email, password, userData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User credential
   */
  const login = async (email, password) => {
    try {
      setError(null);
      return await userService.login(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setError(null);
      await userService.logout();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<void>}
   */
  const updateProfile = async (userData) => {
    try {
      setError(null);
      await userService.updateProfile(userData);
      // Get updated user data
      const updatedUser = await userService.getCurrentUserWithData();
      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await userService.updateUserPassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Reset user password
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      await userService.resetPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete user account
   * @param {string} password - Current password for verification
   * @returns {Promise<void>}
   */
  const deleteAccount = async (password) => {
    try {
      setError(null);
      await userService.deleteAccount(password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  /**
   * Login with Google
   * @returns {Promise<Object>} - User credential
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      return await userService.loginWithGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    updatePassword,
    resetPassword,
    deleteAccount
  };
};

/**
 * Hook to fetch users by role
 * @param {string} role - User role
 * @returns {Object} - Users data, loading state, and error
 */
export const useUsersByRole = (role) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!role) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const usersData = await userService.getUsersByRole(role);
        setUsers(usersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching users by role:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  return { users, loading, error };
};
