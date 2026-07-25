import React from 'react';
import { View, Text, ScrollView, FlatList, Animated as RNAnimated } from 'react-native';

const noop = () => {};
const noopValue = (v) => ({ value: v, addListener: noop, removeListener: noop });
const noopStyle = () => ({});
const noopTransition = (v) => v;

const noopAnimBuilder = {
  duration: () => noopAnimBuilder,
  delay: () => noopAnimBuilder,
  easing: () => noopAnimBuilder,
  springify: () => noopAnimBuilder,
  damping: () => noopAnimBuilder,
  stiffness: () => noopAnimBuilder,
};

const SafeAnimatedView = ({ entering, exiting, layout, style, children, ...rest }) =>
  React.createElement(View, { style, ...rest }, children);

const SafeAnimatedText = ({ entering, exiting, layout, style, children, ...rest }) =>
  React.createElement(Text, { style, ...rest }, children);

const SafeAnimatedScrollView = ({ entering, exiting, layout, style, children, ...rest }) =>
  React.createElement(ScrollView, { style, ...rest }, children);

const SafeAnimatedFlatList = ({ entering, exiting, layout, style, ...rest }) =>
  React.createElement(FlatList, { style, ...rest });

const Animated = {
  View: SafeAnimatedView,
  Text: SafeAnimatedText,
  ScrollView: SafeAnimatedScrollView,
  FlatList: SafeAnimatedFlatList,
  createAnimatedComponent: (Component) => Component,
};

export default Animated;

export const useSharedValue = (init) => ({ value: init });
export const useAnimatedStyle = (fn) => fn();
export const useAnimatedProps = (fn) => fn();
export const useAnimatedScrollHandler = () => noop;
export const useAnimatedRef = () => React.createRef();
export const useDerivedValue = (fn) => ({ value: fn() });
export const useAnimatedReaction = noop;
export const useAnimatedGestureHandler = () => ({});

export const withTiming = noopTransition;
export const withSpring = noopTransition;
export const withDecay = noopTransition;
export const withDelay = (_, v) => v;
export const withSequence = (...vals) => vals[vals.length - 1];
export const withRepeat = (v) => v;
export const cancelAnimation = noop;
export const runOnJS = (fn) => fn;
export const runOnUI = (fn) => fn;

export const FadeIn = noopAnimBuilder;
export const FadeOut = noopAnimBuilder;
export const FadeInDown = noopAnimBuilder;
export const FadeInUp = noopAnimBuilder;
export const FadeInLeft = noopAnimBuilder;
export const FadeInRight = noopAnimBuilder;
export const FadeOutDown = noopAnimBuilder;
export const FadeOutUp = noopAnimBuilder;
export const SlideInLeft = noopAnimBuilder;
export const SlideInRight = noopAnimBuilder;
export const SlideOutLeft = noopAnimBuilder;
export const SlideOutRight = noopAnimBuilder;
export const ZoomIn = noopAnimBuilder;
export const ZoomOut = noopAnimBuilder;
export const BounceIn = noopAnimBuilder;
export const BounceOut = noopAnimBuilder;
export const LightSpeedInRight = noopAnimBuilder;
export const FlipInEasyX = noopAnimBuilder;
export const Layout = noopAnimBuilder;
export const LinearTransition = noopAnimBuilder;

export const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t,
  cubic: (t) => t,
  bezier: () => (t) => t,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

export const interpolate = (value, inputRange, outputRange) => {
  if (!inputRange || !outputRange) return 0;
  const index = inputRange.findIndex((v) => v >= value);
  if (index <= 0) return outputRange[0];
  if (index >= outputRange.length) return outputRange[outputRange.length - 1];
  const t = (value - inputRange[index - 1]) / (inputRange[index] - inputRange[index - 1]);
  return outputRange[index - 1] + t * (outputRange[index] - outputRange[index - 1]);
};

export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export const interpolateColor = () => 'transparent';
