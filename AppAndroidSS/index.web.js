import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the app for web
AppRegistry.registerComponent(appName, () => App);

// Start the app on web
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});




