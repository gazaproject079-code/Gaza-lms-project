const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateOTP, getOTPExpiry, verifyOTP } = require('../utils/otpUtils');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

// Firebase Admin - Optional for Google OAuth
let admin = null;
let firebaseConfigured = false;

try {
  admin = require('firebase-admin');

  // Only initialize if all required env vars are present
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
    firebaseConfigured = true;
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    console.log('⚠️ Firebase not configured - using direct Google OAuth token verification');
  }
} catch (error) {
  console.log('⚠️ Firebase Admin SDK not available - using direct Google OAuth token verification');
  admin = null;
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt received');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);
    console.log('🔑 Password:', password);
    console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👤 User found:', user.email, 'role:', user.role);
    console.log('🔑 User permissions:', JSON.stringify(user.permissions));

    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return res.status(401).json({ error: 'Account is inactive' });
    }

    console.log('🔐 Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        permissions: user.permissions
      }
    };

    console.log('✅ Login successful for:', user.email);
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Allow all valid roles: student, admin, superadmin, sponsor
    const validRoles = ['student', 'instructor', 'superadmin', 'sponsor'];
    const roleToUse = validRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name,
      email,
      password,
      role: roleToUse,
      phone: phone || null,
      isActive: true
    });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otpCode', 'otpExpiry'] }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePicture } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      name: name ?? user.name,
      phone: phone ?? user.phone,
      profilePicture: profilePicture ?? user.profilePicture
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        authProvider: user.authProvider,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Password change is not available for this account' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    await user.update({ password: newPassword });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send OTP for email verification
exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry(10); // 10 minutes expiry

    if (existingUser) {
      // Update existing user with new OTP
      await existingUser.update({
        otpCode: otp,
        otpExpiry: otpExpiry
      });
    } else {
      // Create temporary user record with OTP
      await User.create({
        email,
        name: name || 'User',
        otpCode: otp,
        otpExpiry: otpExpiry,
        emailVerified: false,
        authProvider: 'local'
      });
    }

    // Send OTP email (or log for development)
    try {
      await sendOTPEmail(email, otp, name || 'User');
      console.log('📧 OTP sent to:', email);
    } catch (emailError) {
      console.log('⚠️ Email sending failed, OTP for development:', otp);
      console.log('⚠️ Email error:', emailError.message);
      // Continue even if email fails in development
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.otpCode, user.otpExpiry);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    // Mark email as verified and clear OTP
    await user.update({
      emailVerified: true,
      otpCode: null,
      otpExpiry: null
    });

    console.log('✅ Email verified for:', email);
    res.json({
      success: true,
      message: 'Email verified successfully',
      emailVerified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry(10);

    await user.update({
      otpCode: otp,
      otpExpiry: otpExpiry
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
      console.log('📧 OTP resent to:', email);
    } catch (emailError) {
      console.log('⚠️ Email resend failed, OTP for development:', otp);
      console.log('⚠️ Email error:', emailError.message);
      // Continue even if email fails - OTP is still saved in database
    }

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
};

// Complete registration after OTP verification
exports.completeRegistration = async (req, res) => {
  try {
    const { email, password, name, phone, location, isWarZone, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please verify your email first.' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    if (user.password) {
      return res.status(400).json({ error: 'Account already set up. Please login.' });
    }

    // Update user with password and details
    await user.update({
      password: password, // Will be hashed by the beforeUpdate hook
      name: name || user.name,
      phone: phone || null,
      location: location || null,
      isWarZone: isWarZone || false,
      role: role || user.role,
      isActive: true
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    const token = generateToken(user);

    console.log('✅ Registration completed for:', email);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
};

// Send OTP for Login (existing verified users)
exports.sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry(10);

    await user.update({
      otpCode: otp,
      otpExpiry: otpExpiry
    });

    // Send OTP email (or log for development)
    try {
      await sendOTPEmail(email, otp, user.name);
      console.log('📧 Login OTP sent to:', email);
    } catch (emailError) {
      console.log('⚠️ Email sending failed, Login OTP for development:', otp);
      console.log('⚠️ Email error:', emailError.message);
      // Continue even if email fails in development
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send Login OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
};

// Login with OTP (passwordless login)
exports.loginWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.otpCode, user.otpExpiry);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    // Clear OTP after successful verification
    await user.update({
      otpCode: null,
      otpExpiry: null,
      emailVerified: true
    });

    const token = generateToken(user);

    console.log('✅ OTP Login successful for:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login with OTP error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Forgot Password - Send OTP for password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry(10); // 10 minutes expiry

    await user.update({
      otpCode: otp,
      otpExpiry: otpExpiry
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name, 'Password Reset');
      console.log('📧 Password reset OTP sent to:', email);
    } catch (emailError) {
      console.log('⚠️ Email sending failed, OTP for development:', otp);
      console.log('⚠️ Email error:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code. Please try again.' });
  }
};

// Reset Password - Verify OTP and update password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.otpCode, user.otpExpiry);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    // Update password and clear OTP
    await user.update({
      password: newPassword, // Will be hashed by beforeUpdate hook
      otpCode: null,
      otpExpiry: null
    });

    console.log('✅ Password reset successful for:', email);
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

// Verify Signup OTP and complete registration
exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.otpCode, user.otpExpiry);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    // Mark email as verified and clear OTP
    await user.update({
      emailVerified: true,
      isActive: true,
      otpCode: null,
      otpExpiry: null
    });

    // Generate token for auto-login
    const token = generateToken(user);

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('✅ Signup verified for:', email);
    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        emailVerified: true,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

// Google OAuth Authentication
// Accept Privacy Policy
exports.acceptPrivacyPolicy = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date()
    });

    console.log('✅ Privacy policy accepted by user:', user.email);
    res.json({
      success: true,
      message: 'Privacy policy accepted successfully',
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt
    });
  } catch (error) {
    console.error('Accept privacy policy error:', error);
    res.status(500).json({ error: 'Failed to accept privacy policy. Please try again.' });
  }
};

// Get Privacy Policy Status
exports.getPrivacyPolicyStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['privacyPolicyAccepted', 'privacyPolicyAcceptedAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      privacyPolicyAccepted: user.privacyPolicyAccepted || false,
      privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt
    });
  } catch (error) {
    console.error('Get privacy policy status error:', error);
    res.status(500).json({ error: 'Failed to get privacy policy status.' });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { idToken, role: requestedRole } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    let email, name, picture, uid;

    // Try Firebase verification first if configured, otherwise decode directly
    if (firebaseConfigured && admin) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        email = decodedToken.email;
        name = decodedToken.name;
        picture = decodedToken.picture;
        uid = decodedToken.uid;
        console.log('✅ Verified as Firebase token');
      } catch (firebaseError) {
        console.log('❌ Firebase verification failed:', firebaseError.message);
        // Fall through to direct Google OAuth token decode
      }
    }

    // If Firebase didn't work or isn't configured, decode Google OAuth token directly
    if (!email) {
      try {
        console.log('🔍 Decoding Google OAuth token directly...');
        // Decode the JWT payload (Google OAuth ID token is a JWT)
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

        console.log('📋 Token payload:', {
          iss: payload.iss,
          email: payload.email,
          name: payload.name,
          exp: payload.exp,
          iat: payload.iat
        });

        // Verify the token is from Google
        if (!payload.iss || (!payload.iss.includes('accounts.google.com') && !payload.iss.includes('https://accounts.google.com'))) {
          console.log('❌ Invalid token issuer:', payload.iss);
          return res.status(401).json({ error: 'Invalid token issuer' });
        }

        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('❌ Token expired. Exp:', new Date(payload.exp * 1000), 'Now:', new Date());
          return res.status(401).json({ error: 'Token has expired' });
        }

        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        uid = payload.sub; // Google's subject ID
        console.log('✅ Decoded Google OAuth token successfully');
      } catch (decodeError) {
        console.error('❌ Token decode error:', decodeError);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        await user.update({
          googleId: uid,
          authProvider: user.authProvider === 'local' ? 'local' : 'google',
          profilePicture: picture || user.profilePicture,
          emailVerified: true
        });
      }
    } else {
      // Create new user
      const allowedRoles = ['student', 'sponsor'];
      const assignedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'student';
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        authProvider: 'google',
        profilePicture: picture,
        emailVerified: true,
        isActive: true,
        role: assignedRole,
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(email, user.name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = generateToken(user);

    console.log('✅ Google auth successful for:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isWarZone: user.isWarZone,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        authProvider: user.authProvider,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Google token expired. Please try again.' });
    }
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
};
