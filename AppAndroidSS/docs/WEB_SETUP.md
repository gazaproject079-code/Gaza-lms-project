# Web Setup Guide for SkillSphere

This guide will help you set up and run the SkillSphere React Native app on the web.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

First, install all the required dependencies including web-specific packages:

```bash
npm install
```

This will install:
- `react-native-web` - React Native components for web
- `react-dom` - React DOM renderer for web
- `webpack` and related tools - For bundling the web app
- Other web-specific dependencies

### 2. Run the App on Web

You have two options to run the app:

#### Option A: Using Webpack Dev Server (Recommended)

```bash
npx webpack serve --config webpack.config.js
```

Or add this script to your `package.json` and run:

```bash
npm run web:dev
```

#### Option B: Using React Scripts (Alternative)

```bash
npm run web
```

The app will open automatically in your browser at `http://localhost:3000`

### 3. Build for Production

To create a production build:

```bash
npm run build:web
```

The built files will be in the `web-build` directory. You can deploy this folder to any static hosting service.

## Available Scripts

- `npm run web` - Start development server using react-scripts
- `npm run build:web` - Build for production
- `npx webpack serve` - Start webpack dev server

## Troubleshooting

### Common Issues

1. **Module not found errors**: Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. **Port already in use**: Change the port in `webpack.config.js`:
   ```javascript
   devServer: {
     port: 3001, // Change to any available port
   }
   ```

3. **Styles not loading**: Ensure `react-native-web` is properly aliased in webpack config.

4. **Reanimated errors**: The `react-native-reanimated` plugin should be in babel.config.js.

### Platform-Specific Code

If you need platform-specific code, use:
- `.web.js` extension for web-specific files
- `Platform.OS === 'web'` checks in your code

## File Structure

```
├── index.web.js          # Web entry point
├── web/
│   └── index.html        # HTML template
├── webpack.config.js     # Webpack configuration
└── web-build/            # Production build output (generated)
```

## Notes

- The app uses `react-native-web` to render React Native components on the web
- All your existing React Native code should work on web without changes
- Some native modules may need web alternatives (e.g., AsyncStorage works on web)
- The app is responsive and works on desktop and mobile browsers

## Deployment

To deploy to production:

1. Build the app: `npm run build:web`
2. Upload the `web-build` folder to your hosting service
3. Configure your server to serve `index.html` for all routes (for React Router)

### Popular Hosting Options

- **Netlify**: Drag and drop the `web-build` folder
- **Vercel**: Connect your repo and set build command to `npm run build:web`
- **GitHub Pages**: Deploy the `web-build` folder
- **Firebase Hosting**: Use `firebase deploy`

## Support

For issues or questions, check:
- React Native Web documentation: https://necolas.github.io/react-native-web/
- Webpack documentation: https://webpack.js.org/




