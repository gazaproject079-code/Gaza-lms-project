// Compatibility shim for web builds
// Re-export everything from react-native-web so named imports like
// `import { View } from 'react-native'` work as expected.
export * from 'react-native-web';
export { default } from 'react-native-web';
