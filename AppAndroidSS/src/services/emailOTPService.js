import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Email OTP Service
 * 
 * In a production app, this would integrate with a real email service
 * like SendGrid, AWS SES, or Firebase. For now, we'll simulate it.
 */

const OTP_STORAGE_KEY = '@gazarise:otp_codes';
const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP with expiry time
 */
const storeOTP = async (email, otp) => {
  try {
    const otpData = {
      otp,
      email,
      expiresAt: Date.now() + OTP_EXPIRY_TIME,
      createdAt: Date.now(),
    };
    
    const existingOTPs = await AsyncStorage.getItem(OTP_STORAGE_KEY);
    const otps = existingOTPs ? JSON.parse(existingOTPs) : {};
    otps[email] = otpData;
    
    await AsyncStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (email, otp) => {
  try {
    const existingOTPs = await AsyncStorage.getItem(OTP_STORAGE_KEY);
    if (!existingOTPs) {
      return { success: false, error: 'No OTP found' };
    }
    
    const otps = JSON.parse(existingOTPs);
    const otpData = otps[email];
    
    if (!otpData) {
      return { success: false, error: 'No OTP found for this email' };
    }
    
    // Check if OTP expired
    if (Date.now() > otpData.expiresAt) {
      delete otps[email];
      await AsyncStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }
    
    // OTP verified successfully - remove it
    delete otps[email];
    await AsyncStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Error verifying OTP' };
  }
};

/**
 * Send OTP to email
 * In production, this would send an actual email
 */
export const sendOTP = async (email) => {
  try {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    const stored = await storeOTP(email, otp);
    if (!stored) {
      return { success: false, error: 'Failed to generate OTP' };
    }
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In development, log the OTP for testing
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('⚠️ In production, this would be sent via email service');
    
    // In a real app, you would call your email service here:
    // await emailService.send({
    //   to: email,
    //   subject: 'GazaRise - Email Verification Code',
    //   body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
    // });
    
    return {
      success: true,
      message: `OTP sent to ${email}`,
      // In development, include OTP for testing
      otp: __DEV__ ? otp : undefined,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: 'Failed to send OTP. Please try again.' };
  }
};

/**
 * Verify OTP
 */
export const verifyEmailOTP = async (email, otp) => {
  return await verifyOTP(email, otp);
};

/**
 * Resend OTP
 */
export const resendOTP = async (email) => {
  return await sendOTP(email);
};

/**
 * Clear expired OTPs (cleanup function)
 */
export const clearExpiredOTPs = async () => {
  try {
    const existingOTPs = await AsyncStorage.getItem(OTP_STORAGE_KEY);
    if (!existingOTPs) return;
    
    const otps = JSON.parse(existingOTPs);
    const now = Date.now();
    let cleaned = false;
    
    for (const email in otps) {
      if (otps[email].expiresAt < now) {
        delete otps[email];
        cleaned = true;
      }
    }
    
    if (cleaned) {
      await AsyncStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    }
  } catch (error) {
    console.error('Error clearing expired OTPs:', error);
  }
};

