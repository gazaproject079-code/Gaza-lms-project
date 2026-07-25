import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * Brand logo: displays the PNG logo from assets.
 */
const BrandLogo = ({ size = 80, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/gazarise_logo.png')}
        style={[
          styles.logo,
          {
            width: size,
            height: size,
            borderRadius: size * 0.15, // 15% of size for rounded corners
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Image styles are applied via inline style with size prop
  },
});

export default BrandLogo;

