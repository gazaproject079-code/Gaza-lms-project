// Compatibility layer to use React Native libraries on web
// Re-export everything from react-native-web
export * from 'react-native-web';

// Provide a noop requireNativeComponent for libraries that expect it
import { View } from 'react-native-web';

export function requireNativeComponent() {
  // Return a basic View on web so components using native views don't crash
  return View;
}


