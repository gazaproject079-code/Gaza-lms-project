import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/apiClient';

const normalizeUser = (payload, fallbackRole) => {
  console.log('🔧 normalizeUser called with payload:', JSON.stringify(payload, null, 2));
  console.log('🔧 fallbackRole:', fallbackRole);

  if (!payload) {
    console.log('⚠️ normalizeUser: payload is null/undefined, returning null');
    return null;
  }

  // Infer role if missing (seeded superadmin email), otherwise use provided/fallback/default.
  const inferredRole =
    payload.role ||
    (payload.email === 'gazarisesuperadmin@admin.com' ? 'superadmin' : undefined) ||
    fallbackRole ||
    'instructor';

  console.log('🔧 normalizeUser: payload.role=', payload.role);
  console.log('🔧 normalizeUser: email check=', payload.email === 'gazarisesuperadmin@admin.com');
  console.log('🔧 normalizeUser: inferredRole=', inferredRole);

  const result = { ...payload, role: inferredRole };
  console.log('🔧 normalizeUser returning:', JSON.stringify(result, null, 2));

  return result;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [additionalUsers, setAdditionalUsers] = useState([]);

  useEffect(() => {
    checkAuthStatus();
    loadAdditionalUsers();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('@gazarise:token');
      const userData = await AsyncStorage.getItem('@gazarise:user');

      if (token && userData) {
        const parsedUser = normalizeUser(JSON.parse(userData));
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await authAPI.login(email, password);
      console.log('📡 Login API response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('🔍 Raw user from response:', JSON.stringify(response.user, null, 2));
        console.log('🔍 Raw admin from response:', JSON.stringify(response.admin, null, 2));
        console.log('🔍 Will normalize:', response.user || response.admin);

        const userPayload = normalizeUser(response.user || response.admin, 'instructor');
        console.log('✅ User payload after normalization:', JSON.stringify(userPayload, null, 2));
        console.log('✅ Role specifically:', userPayload?.role);

        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));

        // Verify what was stored
        const storedUser = await AsyncStorage.getItem('@gazarise:user');
        console.log('💾 Stored user in AsyncStorage:', storedUser);

        setUser(userPayload);
        console.log('✅ User set in context, role:', userPayload.role);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      console.log('❌ Login failed - response.success is false');
      setIsLoading(false);
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.log('❌ Login error caught:', error.message);
      console.error('Full error:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'Login failed. Please check your credentials.' };
    }
  };

  const signup = async (name, email, password, role = 'instructor', phone = null) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ name, email, password, role, phone });

      if (response.success) {
        const userPayload = normalizeUser(response.user || response.admin, role || 'instructor');
        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));
        setUser(userPayload);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      setIsLoading(false);
      return { success: false, error: response.error || 'Signup failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Signup failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@gazarise:token');
      await AsyncStorage.removeItem('@gazarise:user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data) => {
    setIsLoading(true);
    try {
      const response = await authAPI.updateProfile(data);

      if (response.success) {
        const updatedUser = normalizeUser({ ...user, ...response.user }, user?.role);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsLoading(false);
        return { success: true, user: updatedUser };
      }

      setIsLoading(false);
      return { success: false, error: response.error || 'Update failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Update failed' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      setIsLoading(false);

      if (response.success) {
        return { success: true, message: 'Password changed successfully' };
      }

      return { success: false, error: response.error || 'Password change failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Password change failed' };
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        const updatedUser = normalizeUser(response.user || response.admin, user?.role);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loadAdditionalUsers = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('@gazarise:additionalUsers');
      if (storedUsers) {
        setAdditionalUsers(JSON.parse(storedUsers));
      }
    } catch (error) {
      console.error('Load additional users error:', error);
    }
  };

  const createAccount = async (email, password, name, role) => {
    try {
      // Check if user already exists
      if (additionalUsers.find(u => u.email === email)) {
        return { success: false, error: 'Email already exists' };
      }

      // Create new user via backend
      const response = await authAPI.register({ name, email, password, role });

      if (response.success) {
        const newUser = {
          id: response.admin?.id || Date.now().toString(),
          email,
          name,
          role,
          createdAt: new Date().toISOString(),
        };

        const updatedUsers = [...additionalUsers, newUser];
        setAdditionalUsers(updatedUsers);
        await AsyncStorage.setItem('@gazarise:additionalUsers', JSON.stringify(updatedUsers));

        return { success: true, user: newUser };
      }

      return { success: false, error: response.error || 'Account creation failed' };
    } catch (error) {
      console.error('Create account error:', error);
      return { success: false, error: error.message || 'Account creation failed' };
    }
  };

  const deleteAccount = async (userId) => {
    try {
      const updatedUsers = additionalUsers.filter(u => u.id !== userId);
      setAdditionalUsers(updatedUsers);
      await AsyncStorage.setItem('@gazarise:additionalUsers', JSON.stringify(updatedUsers));
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }
  };

  // OTP Authentication Methods
  const sendOTP = async (email, name) => {
    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(email, name);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to verify OTP' };
    }
  };

  const resendOTP = async (email) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resendOTP(email);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to resend OTP' };
    }
  };

  const completeRegistration = async (email, password, name, phone, location, isWarZone, role = 'student') => {
    setIsLoading(true);
    try {
      const response = await authAPI.completeRegistration({ email, password, name, phone, location, isWarZone, role });

      if (response.success) {
        const userPayload = normalizeUser(response.user, 'student');
        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));
        setUser(userPayload);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      setIsLoading(false);
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // OTP Login Methods (for existing users)
  const sendLoginOTP = async (email) => {
    setIsLoading(true);
    try {
      const response = await authAPI.sendLoginOTP(email);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to send verification code' };
    }
  };

  const loginWithOTP = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await authAPI.loginWithOTP(email, otp);

      if (response.success) {
        const userPayload = normalizeUser(response.user, 'student');
        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));
        setUser(userPayload);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      setIsLoading(false);
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Forgot Password - Send OTP for password reset
  const forgotPassword = async (email) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to send reset code' };
    }
  };

  // Reset Password - Verify OTP and update password
  const resetPassword = async (email, otp, newPassword) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(email, otp, newPassword);
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  };

  // Verify Signup OTP
  const verifySignupOTP = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifySignupOTP(email, otp);

      if (response.success && response.token) {
        const userPayload = normalizeUser(response.user, 'student');
        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));
        setUser(userPayload);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to verify OTP' };
    }
  };

  // Google OAuth Authentication
  const googleSignIn = async (idToken, role = 'student') => {
    setIsLoading(true);
    try {
      const response = await authAPI.googleAuth(idToken, role);

      if (response.success) {
        const userPayload = normalizeUser(response.user, response.user?.role || role || 'student');
        await AsyncStorage.setItem('@gazarise:token', response.token);
        await AsyncStorage.setItem('@gazarise:user', JSON.stringify(userPayload));
        setUser(userPayload);
        setIsLoading(false);
        return { success: true, user: userPayload };
      }

      setIsLoading(false);
      return { success: false, error: response.error || 'Google sign in failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  };

  const value = {
    user,
    isLoading,
    isInitialized,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
    additionalUsers,
    createAccount,
    deleteAccount,
    // OTP methods (for signup)
    sendOTP,
    verifyOTP,
    resendOTP,
    completeRegistration,
    // OTP login methods (for existing users)
    sendLoginOTP,
    loginWithOTP,
    // Password reset
    forgotPassword,
    resetPassword,
    verifySignupOTP,
    // Google OAuth
    googleSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
