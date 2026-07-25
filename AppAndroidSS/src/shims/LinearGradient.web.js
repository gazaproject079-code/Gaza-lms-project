import React from 'react';
import { View } from 'react-native';

// Minimal web shim for react-native-linear-gradient
// Converts `colors` into a CSS linear-gradient background.
function LinearGradient({
  colors = ['transparent', 'transparent'],
  start,
  end,
  style,
  children,
  ...rest
}) {
  // Basic angle calculation if start/end provided (0deg = top)
  let gradientDirection = 'to bottom';
  try {
    if (start && end) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
      gradientDirection = `${angle}deg`;
    }
  } catch (e) {
    // ignore and use default
  }

  const colorStops = Array.isArray(colors) ? colors.join(', ') : String(colors);
  const backgroundImage = `linear-gradient(${gradientDirection}, ${colorStops})`;

  // Merge styles (native style objects are supported by react-native-web)
  const base = Array.isArray(style) ? Object.assign({}, ...style) : (style || {});
  // Ensure the gradient covers the viewport if used as a top-level container on web
  const mergedStyle = Object.assign({}, base, {
    backgroundImage,
    // Use flex layout so children that rely on flex behave as expected, but
    // do not force full-viewport width/height here — that caused nested
    // LinearGradient instances (e.g., signup card) to expand and overlay.
    display: base.display || 'flex',
    flexDirection: base.flexDirection || 'column',
    minHeight: base.minHeight || undefined,
    boxSizing: 'border-box',
  });

  return (
    <View style={mergedStyle} {...rest}>
      {children}
    </View>
  );
}

// Named export to match `import { LinearGradient } from 'react-native-linear-gradient'`
export { LinearGradient };

// Default export (most modules import default)
export default LinearGradient;
