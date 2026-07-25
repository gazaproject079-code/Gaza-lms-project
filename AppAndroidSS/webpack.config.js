const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const resolveModule = (request) =>
  require.resolve(request, {
    paths: [__dirname, path.resolve(__dirname, '../node_modules')],
  });

// Helper function to check if a file path contains any of the specified packages
const shouldTranspileModule = (filepath) => {
  const packagesToTranspile = [
    'react-native-toast-message',
    'react-native-linear-gradient',
    'react-native-vector-icons',
    '@expo/vector-icons',
    'react-native-paper',
    'react-native-gesture-handler',
    'react-native-screens',
    'react-native-safe-area-context',
    'react-native-svg',
  ];

  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filepath.replace(/\\/g, '/');
  return packagesToTranspile.some(pkg => {
    const normalizedPkg = pkg.replace(/\\/g, '/');
    return normalizedPath.includes(normalizedPkg);
  });
};

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.js', '.jsx', '.json'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
      'node_modules'
    ],
    alias: {
      'react-native$': path.resolve(__dirname, 'react-native-web-compat.js'),
      'react-native/package.json': resolveModule('react-native/package.json'),
      '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage',
      '@expo/vector-icons': 'react-native-vector-icons',
      '@expo/vector-icons/MaterialCommunityIcons': 'react-native-vector-icons/MaterialCommunityIcons',
      '@react-native-vector-icons/material-design-icons': 'react-native-vector-icons/MaterialCommunityIcons',
      'react-native-reanimated': path.resolve(__dirname, 'src/shims/Reanimated.web.js'),
      react: path.dirname(resolveModule('react/package.json')),
      'react-dom': path.dirname(resolveModule('react-dom/package.json')),
    },
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
  module: {
    rules: [
      // Process app source files
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'App.js'),
          path.resolve(__dirname, 'index.web.js'),
          path.resolve(__dirname, 'react-native-web-compat.js'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.config.js'),
            envName: 'web',
            cacheDirectory: false, // Disable cache for debugging
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-flow-strip-types',
            ],
          },
        },
      },
      // Process specific node_modules that need transpilation
      {
        test: /\.(js|jsx)$/,
        include: (filepath) => {
          // Normalize path for cross-platform compatibility
          const normalizedPath = filepath.replace(/\\/g, '/');

          // Only process files in node_modules (local or parent)
          if (!normalizedPath.includes('node_modules')) return false;

          // Check if this is one of our packages to transpile
          return shouldTranspileModule(filepath);
        },
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: false, // Disable cache for debugging
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-flow-strip-types',
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 100000, // inline files smaller than 100kb as base64
              name: '[name].[ext]',
              outputPath: 'assets/images/',
              publicPath: '/assets/images/',
              esModule: false, // Required for React Native Web compatibility
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/fonts/',
              esModule: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      filename: 'index.html',
      inject: true,
    }),
    // Copy vector icon fonts and assets to web build
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.dirname(resolveModule('react-native-vector-icons/package.json')) + '/Fonts',
          to: path.resolve(__dirname, 'web-build/assets/fonts'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'src/assets/images'),
          to: path.resolve(__dirname, 'web-build/assets/images'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'web/favicon.png'),
          to: path.resolve(__dirname, 'web-build/favicon.png'),
          noErrorOnMissing: true,
        },
      ],
    }),
    // Provide React Native globals expected by some libraries
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      DEV: JSON.stringify(process.env.NODE_ENV !== 'production'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web-build'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  devtool: 'source-map',
};


