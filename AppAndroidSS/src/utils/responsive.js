import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

export const getScreenSize = (width) => {
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

export const isSmallScreen = (width) => width < breakpoints.md;
export const isMediumScreen = (width) => width >= breakpoints.md && width < breakpoints.lg;
export const isLargeScreen = (width) => width >= breakpoints.lg;

// Responsive value selector
export const responsive = (width, { xs, sm, md, lg, xl, xxl }) => {
  const size = getScreenSize(width);

  switch (size) {
    case 'xxl':
      return xxl ?? xl ?? lg ?? md ?? sm ?? xs;
    case 'xl':
      return xl ?? lg ?? md ?? sm ?? xs;
    case 'lg':
      return lg ?? md ?? sm ?? xs;
    case 'md':
      return md ?? sm ?? xs;
    case 'sm':
      return sm ?? xs;
    default:
      return xs;
  }
};

// Grid system helpers
export const getGridColumns = (width) => {
  if (width >= breakpoints.xl) return 4;
  if (width >= breakpoints.lg) return 3;
  if (width >= breakpoints.md) return 2;
  return 1;
};

export const getCardWidth = (width, gap = 16) => {
  const columns = getGridColumns(width);
  const totalGap = gap * (columns - 1);
  const availableWidth = Math.min(width - 40, 1200); // Max container width
  return (availableWidth - totalGap) / columns;
};

// Container max width
export const getContainerMaxWidth = (width) => {
  if (width >= breakpoints.xxl) return 1320;
  if (width >= breakpoints.xl) return 1140;
  if (width >= breakpoints.lg) return 960;
  if (width >= breakpoints.md) return 720;
  if (width >= breakpoints.sm) return 540;
  return width - 32;
};

// Font size scaling
export const scaleFontSize = (baseSize, width) => {
  if (width >= breakpoints.lg) return baseSize * 1.1;
  if (width >= breakpoints.md) return baseSize * 1.05;
  return baseSize;
};

// Spacing scaling
export const scaleSpacing = (baseSpacing, width) => {
  if (width >= breakpoints.lg) return baseSpacing * 1.5;
  if (width >= breakpoints.md) return baseSpacing * 1.25;
  return baseSpacing;
};

// Safe area padding
export const getSafeAreaPadding = () => ({
  paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 25 : 20,
  paddingBottom: Platform.OS === 'ios' ? 34 : 20,
});

export default {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isWeb,
  isAndroid,
  isIOS,
  breakpoints,
  getScreenSize,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  responsive,
  getGridColumns,
  getCardWidth,
  getContainerMaxWidth,
  scaleFontSize,
  scaleSpacing,
  getSafeAreaPadding,
};
