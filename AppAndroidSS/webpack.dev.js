const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const resolveModule = (request) =>
  require.resolve(request, {
    paths: [__dirname, path.resolve(__dirname, '../node_modules')],
  });

const shouldTranspileModule = (filepath) => {
  const packagesToTranspile = [
    'react-native-toast-message',
    'react-native-linear-gradient',
    'react-native-vector-icons',
    '@expo/vector-icons',
    'react-native-paper',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-screens',
    'react-native-safe-area-context',
    'react-native-svg',
  ];

  const normalizedPath = filepath.replace(/\\/g, '/');
  return packagesToTranspile.some(pkg => normalizedPath.includes(pkg.replace(/\\/g, '/')));
};

module.exports = {
  mode: 'development',
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
      react: path.dirname(resolveModule('react/package.json')),
      'react-dom': path.dirname(resolveModule('react-dom/package.json')),
    },
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
  module: {
    rules: [
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
            cacheDirectory: false,
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-flow-strip-types',
              'react-native-reanimated/plugin',
            ],
          },
        },
      },
      {
        test: /\.(js|jsx)$/,
        include: (filepath) => {
          const normalizedPath = filepath.replace(/\\/g, '/');
          if (!normalizedPath.includes('node_modules')) return false;
          return shouldTranspileModule(filepath);
        },
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: false,
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
              limit: 100000,
              name: '[name].[ext]',
              outputPath: 'assets/images/',
              publicPath: '/assets/images/',
              esModule: false,
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
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      DEV: JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || ''),
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
  devtool: 'eval-source-map',
};
