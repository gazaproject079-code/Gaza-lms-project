# Quick Start - Run SkillSphere on Web

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `react-native-web` - For web support
- `react-dom` - React DOM renderer
- `webpack` and related tools - For bundling

## Step 2: Run the App

```bash
npm run web
```

The app will automatically open in your browser at `http://localhost:3000`

## Alternative: Using Webpack Directly

If the npm script doesn't work, try:

```bash
npx webpack serve --config webpack.config.js
```

## Build for Production

```bash
npm run build:web
```

The production build will be in the `web-build` folder.

## Troubleshooting

### If you get "module not found" errors:
```bash
npm install --force
```

### If port 3000 is already in use:
Edit `webpack.config.js` and change the port:
```javascript
devServer: {
  port: 3001, // Change this
}
```

### If styles don't load:
Make sure `react-native-web` is installed:
```bash
npm install react-native-web react-dom
```

## What's Included

✅ Web entry point (`index.web.js`)
✅ HTML template (`web/index.html`)
✅ Webpack configuration (`webpack.config.js`)
✅ Babel configuration for web
✅ All your React Native components work on web!

## Next Steps

- The app is fully responsive and works on desktop and mobile browsers
- All your existing screens and components will work on web
- Theme switching (light/dark mode) works on web
- Navigation works on web

For more details, see `docs/WEB_SETUP.md`




