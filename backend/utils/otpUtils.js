// OTP Utility Functions

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time (10 minutes from now)
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Check if OTP is expired
const isOTPExpired = (expiryDate) => {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
};

// Validate OTP format (must be 6 digits)
const isValidOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

// Verify OTP
const verifyOTP = (inputOTP, storedOTP, expiryDate) => {
  // Check format
  if (!isValidOTPFormat(inputOTP)) {
    return { valid: false, message: 'Invalid OTP format. Must be 6 digits.' };
  }

  // Check if OTP matches
  if (inputOTP !== storedOTP) {
    return { valid: false, message: 'Invalid OTP code.' };
  }

  // Check if OTP is expired
  if (isOTPExpired(expiryDate)) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  return { valid: true, message: 'OTP verified successfully.' };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
  isValidOTPFormat,
  verifyOTP
};
