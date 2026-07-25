module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    '@babel/preset-react',
  ],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  env: {
    web: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
      ],
      plugins: [
        'react-native-reanimated/plugin',
      ],
    },
  },
};
