import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { Svg, Path, G } from 'react-native-svg';

// Palestine flag colours — more saturated/darker for visible background use
const BLACK = 'rgba(5,5,15,0.78)';
const WHITE = 'rgba(210,225,250,0.38)';
const GREEN = 'rgba(0,115,55,0.72)';
const RED   = 'rgba(195,14,36,0.72)';

const VW = 900, VH = 600;   // SVG viewBox dimensions
const SAMPLES    = 24;       // points sampled across flag width
const AMPLITUDE  = 28;       // max wave height at free edge (px in viewBox)
const WAVELENGTH = 380;      // px per full wave cycle
const SPEED      = 0.52;     // wave cycles per second — slow, steady breeze

// Compute sine-wave y-offsets for each sample point at time t
// Constant speed and amplitude — perfectly smooth, no perceived stops or changes
function computeWave(t) {
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * VW;
    const taper = Math.pow(x / VW, 0.65);
    const y = AMPLITUDE * taper * Math.sin(2 * Math.PI * (x / WAVELENGTH - SPEED * t));
    pts.push({ x, y });
  }
  return pts;
}

// Build a closed stripe path between two baseline y positions
function buildStripe(y1, y2, pts) {
  let d = `M 0,${y1}`;
  for (let i = 1; i <= SAMPLES; i++) {
    d += ` L ${pts[i].x.toFixed(1)},${(y1 + pts[i].y).toFixed(1)}`;
  }
  d += ` L ${VW},${(y2 + pts[SAMPLES].y).toFixed(1)}`;
  for (let i = SAMPLES - 1; i >= 0; i--) {
    d += ` L ${pts[i].x.toFixed(1)},${(y2 + pts[i].y).toFixed(1)}`;
  }
  return d + ' Z';
}

// Build the red triangle path (pole=fixed, tip waves with flag)
function buildTriangle(pts) {
  const tipIdx = Math.round((320 / VW) * SAMPLES);
  const tipWave = pts[tipIdx] ? pts[tipIdx].y * 0.8 : 0;
  return `M 0,0 L 320,${(300 + tipWave).toFixed(1)} L 0,${VH} Z`;
}

// ─── Web: JS-driven 60fps sine wave on real SVG elements ──────────────────────
const WebFlag = ({ style, opacity }) => {
  const flat     = StyleSheet.flatten(style) || {};
  const bRef     = useRef(null);   // black stripe
  const wRef     = useRef(null);   // white stripe
  const gRef     = useRef(null);   // green stripe
  const rRef     = useRef(null);   // red triangle
  const sheenRef = useRef(null);   // light sheen gradient element

  useEffect(() => {
    let raf;
    const t0 = performance.now();

    const frame = () => {
      const t   = (performance.now() - t0) / 1000;
      const pts = computeWave(t);

      if (bRef.current) bRef.current.setAttribute('d', buildStripe(0,   200, pts));
      if (wRef.current) wRef.current.setAttribute('d', buildStripe(200, 400, pts));
      if (gRef.current) gRef.current.setAttribute('d', buildStripe(400, 600, pts));
      if (rRef.current) rRef.current.setAttribute('d', buildTriangle(pts));

      // Sheen: light reflection travels with the wave, loops 0→1
      if (sheenRef.current) {
        const pos = (SPEED * t) % 1.2 - 0.1;   // slight over-travel for smooth loop
        sheenRef.current.setAttribute('x1', pos.toFixed(3));
        sheenRef.current.setAttribute('x2', (pos + 0.38).toFixed(3));
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const divStyle = {
    position:      flat.position  || 'absolute',
    top:           flat.top       ?? 0,
    left:          flat.left      ?? 0,
    right:         flat.right     ?? 0,
    bottom:        flat.bottom    ?? 0,
    width:         flat.width,
    height:        flat.height,
    zIndex:        flat.zIndex    || 0,
    opacity,
    overflow:      'hidden',
    pointerEvents: 'none',
  };

  return (
    <div style={divStyle}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Light sheen that sweeps across the cloth with the wave */}
          <linearGradient id="pl-sheen" ref={sheenRef} x1="0" y1="0" x2="0.38" y2="0"
            gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="white" stopOpacity="0"    />
            <stop offset="40%"  stopColor="white" stopOpacity="0.13" />
            <stop offset="60%"  stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </linearGradient>
        </defs>

        <path ref={bRef} fill={BLACK} />
        <path ref={wRef} fill={WHITE} />
        <path ref={gRef} fill={GREEN} />
        <path ref={rRef} fill={RED}   />

        {/* Sheen overlay — covers the entire flag area */}
        <rect x="0" y="0" width={VW} height={VH} fill="url(#pl-sheen)" />
      </svg>
    </div>
  );
};

// ─── Native: Animated rotateY wave (react-native-svg static flag) ─────────────
const NativeFlag = ({ style, opacity }) => {
  const flat     = StyleSheet.flatten(style) || {};
  const W        = flat.width  || 240;
  const H        = flat.height || W / 2;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(opacity * 0.7)).current;

  useEffect(() => {
    const wave = () => {
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1,    duration: 1100, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0.35, duration: 650,  useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 1.2,  duration: 950,  useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0,    duration: 1300, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) wave(); });
    };
    wave();
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: opacity,       duration: 3800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: opacity * 0.6, duration: 3200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotateY = waveAnim.interpolate({
    inputRange: [0, 1, 1.2], outputRange: ['0deg', '13deg', '17deg'],
  });

  // Compute static stripe paths for native
  const sw = VW, sh = VH;
  const triPt = `0,0 320,300 0,${sh}`;

  return (
    <Animated.View pointerEvents="none" style={[style, { opacity: fadeAnim, overflow: 'hidden' }]}>
      <Animated.View style={{ width: W, height: H, transform: [{ perspective: 700 }, { rotateY }] }}>
        <Svg width={W} height={H} viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="xMidYMid slice">
          <Path d={`M0,0 L${sw},0 L${sw},200 L0,200 Z`}   fill={BLACK} />
          <Path d={`M0,200 L${sw},200 L${sw},400 L0,400 Z`} fill={WHITE} />
          <Path d={`M0,400 L${sw},400 L${sw},${sh} L0,${sh} Z`} fill={GREEN} />
          <Path d={`M${triPt}`} fill={RED} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Export ───────────────────────────────────────────────────────────────────
const PalestineFlagBlob = (props) => Platform.OS === 'web'
  ? <WebFlag   {...props} />
  : <NativeFlag {...props} />;

export default PalestineFlagBlob;
