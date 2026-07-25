import { Platform } from 'react-native';

const WEB_CLIENT_ID = '1027771061-5gdm8g72cimck7bjpgknspaqkisfme4g.apps.googleusercontent.com';

// Get redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    // Use current origin in production, localhost in development
    const origin = window.location.origin;
    return origin.includes('localhost') ? 'http://localhost:3000' : origin;
  }
  return 'http://localhost:3000';
};

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  console.log('Google Sign-In configured for platform:', Platform.OS);
  console.log('Redirect URI:', getRedirectUri());
};

/**
 * Sign in with Google - Web Implementation using popup
 */
const signInWithGoogleWeb = async () => {
  try {
    // Create OAuth URL for Google
    const redirectUri = encodeURIComponent(getRedirectUri());
    const scope = encodeURIComponent('email profile openid');
    const responseType = 'token id_token';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${WEB_CLIENT_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=${responseType}&` +
      `scope=${scope}&` +
      `nonce=${Math.random().toString(36).substring(2)}`;

    // Open popup for Google Sign-In
    const popup = window.open(
      authUrl,
      'Google Sign In',
      'width=500,height=600,menubar=no,toolbar=no'
    );

    if (!popup) {
      return {
        success: false,
        error: 'Popup blocked. Please allow popups for this site.',
      };
    }

    // Wait for the popup to complete
    return new Promise((resolve) => {
      const checkPopup = setInterval(() => {
        try {
          // Check if popup is closed
          if (popup.closed) {
            clearInterval(checkPopup);
            resolve({
              success: false,
              error: 'Sign in was cancelled',
            });
            return;
          }

          const currentUrl = popup.location.href;
          const expectedRedirectUri = getRedirectUri();
          if (currentUrl.includes(expectedRedirectUri) && currentUrl.includes('id_token=')) {
            clearInterval(checkPopup);
            popup.close();

            const fragment = currentUrl.split('#')[1];
            const params = new URLSearchParams(fragment);
            const idToken = params.get('id_token');

            if (idToken) {
              const payload = JSON.parse(atob(idToken.split('.')[1]));
              resolve({
                success: true,
                idToken,
                user: {
                  email: payload.email || 'dummy@example.com',
                  name: payload.name || 'Dummy User',
                  photo: payload.picture || 'https://via.placeholder.com/150',
                  id: payload.sub || '1234567890',
                },
              });
            } else {
              resolve({
                success: false,
                error: 'Failed to get authentication token',
              });
            }
          }
        } catch (e) {
          // Cross-origin errors expected while popup is on Google's domain
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkPopup);
        if (!popup.closed) popup.close();
        resolve({ success: false, error: 'Sign in timed out. Please try again.' });
      }, 120000);
    });
  } catch (error) {
    console.error('Google Sign-In Web Error:', error);
    return {
      success: false,
      error: 'Google sign in failed. Please try again.',
    };
  }
};



/**
 * Sign in with Google - Native Implementation placeholder
 * For native to work, you need to:
 * 1. npm install @react-native-google-signin/google-signin
 * 2. Follow setup: https://github.com/react-native-google-signin/google-signin
 * 3. Replace this function with actual implementation
 */
const signInWithGoogleNative = async () => {
  // Return message to setup the package
  return {
    success: false,
    error: 'Google Sign-In requires setup. Install @react-native-google-signin/google-signin and configure it.',
  };
};

/**
 * Main Sign in with Google function
 */
export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb();
  }
  return signInWithGoogleNative();
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  return { success: true };
};

/**
 * Check if user is signed in with Google
 */
export const isGoogleSignedIn = async () => {
  return false;
};

/**
 * Get current Google user
 */
export const getCurrentGoogleUser = async () => {
  return null;
};

export default {
  configureGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
  isGoogleSignedIn,
  getCurrentGoogleUser,
};
