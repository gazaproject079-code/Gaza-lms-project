import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

const renderBlock = (block) => {
  if (!block) return null;

  switch (block.type) {
    case 'title':
      return (
        <Text
          key={block.id}
          style={styles.boardTitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {block.text}
        </Text>
      );
    case 'paragraph':
      return (
        <View key={block.id} style={[styles.contentBlock, block.tone === 'focus' && styles.focusBlock]}>
          {block.title ? <Text style={styles.blockTitle} numberOfLines={1}>{block.title}</Text> : null}
          <Text style={styles.blockText}>{block.text}</Text>
        </View>
      );
    case 'bullet_list':
      return (
        <View key={block.id} style={styles.sectionStack}>
          {block.title ? <Text style={styles.sectionLabel} numberOfLines={1}>{block.title}</Text> : null}
          {(block.items || []).map((bullet, index) => (
            <View key={`${block.id}-${index}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      );
    case 'equation':
      return (
        <View key={block.id} style={[styles.contentBlock, styles.equationBlock]}>
          <Text style={styles.equationText}>{block.expression}</Text>
          {block.note ? <Text style={styles.equationNote}>{block.note}</Text> : null}
        </View>
      );
    case 'example':
      return (
        <View key={block.id} style={[styles.contentBlock, styles.exampleBlock]}>
          {block.title ? <Text style={styles.blockTitle} numberOfLines={1}>{block.title}</Text> : null}
          <Text style={block.format === 'code' ? styles.codeText : styles.blockText}>{block.content}</Text>
          {block.note ? <Text style={styles.helperText}>{block.note}</Text> : null}
        </View>
      );
    case 'flowchart':
      return (
        <View key={block.id} style={styles.diagramBlock}>
          {block.title ? <Text style={styles.sectionLabel} numberOfLines={1}>{block.title}</Text> : null}
          {(block.steps || []).map((step, index) => (
            <View key={`${block.id}-${index}`} style={styles.flowRow}>
              <View style={styles.flowBadge}><Text style={styles.flowBadgeText}>{index + 1}</Text></View>
              <Text style={styles.flowText}>{step.label || step}</Text>
            </View>
          ))}
        </View>
      );
    case 'comparison':
      return (
        <View key={block.id} style={styles.diagramBlock}>
          {block.title ? <Text style={styles.sectionLabel} numberOfLines={1}>{block.title}</Text> : null}
          {(block.rows || []).map((row, index) => (
            <View key={`${block.id}-${index}`} style={styles.compareRow}>
              <Text style={styles.compareTitle}>{row.left || row.label || `Item ${index + 1}`}</Text>
              <Text style={styles.compareBody}>{row.right || row.value || ''}</Text>
            </View>
          ))}
        </View>
      );
    case 'diagram_nodes':
      return (
        <View key={block.id} style={styles.diagramBlock}>
          {block.title ? <Text style={styles.sectionLabel} numberOfLines={1}>{block.title}</Text> : null}
          <View style={styles.nodeGrid}>
            {(block.nodes || []).map((node, index) => (
              <View key={`${block.id}-${index}`} style={styles.nodeCard}>
                <Text style={styles.nodeText}>{node.label || node.title || node}</Text>
              </View>
            ))}
          </View>
          {block.caption ? <Text style={styles.helperText}>{block.caption}</Text> : null}
        </View>
      );
    default:
      return null;
  }
};

const renderRows = (rows) => rows.map((row) => (
  <View
    key={row.id}
    style={[styles.layoutRow, row.blocks.length > 1 ? styles.layoutRowSplit : styles.layoutRowSingle]}
  >
    {row.blocks.map((block) => (
      <View
        key={block.id}
        style={[
          styles.layoutCell,
          row.blocks.length > 1 ? styles.layoutCellHalf : styles.layoutCellFull,
        ]}
      >
        {renderBlock(block)}
      </View>
    ))}
  </View>
));

const renderHighlightLayer = (items) => (
  <View style={styles.highlightRail}>
    {items.map((item) => (
      <View key={item.id} style={styles.highlightPill}>
        <Text style={styles.highlightText}>{item.label || item.region || 'Focus'}</Text>
      </View>
    ))}
  </View>
);

const renderTransitionLayer = (items) => (
  <View style={styles.transitionRail}>
    {items.slice(-1).map((item) => (
      <View key={item.id} style={styles.transitionBubble}>
        <Text style={styles.transitionText}>{item.text}</Text>
      </View>
    ))}
  </View>
);

const WhiteboardStage = ({ boardState, currentScene, objectiveText, status, modeLabel, boardWindowIndex = 0, boardWindowCount = 1 }) => {
  const layers = boardState?.layers || {};
  const windows = boardState?.layout?.windows || [{ id: 'window-1', rows: [] }];
  const safeWindowIndex = Math.max(0, Math.min(boardWindowIndex, windows.length - 1));
  const currentWindow = windows[safeWindowIndex] || windows[0];
  const previousWindow = safeWindowIndex > 0 ? windows[safeWindowIndex - 1] : null;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const incomingOpacity = useRef(new Animated.Value(1)).current;
  const exitingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(20);
    incomingOpacity.setValue(0.2);
    exitingOpacity.setValue(previousWindow ? 1 : 0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(incomingOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(exitingOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [safeWindowIndex, currentWindow?.id, previousWindow?.id, exitingOpacity, incomingOpacity, slideAnim]);

  const incomingStyle = useMemo(() => ({
    opacity: incomingOpacity,
    transform: [{ translateY: slideAnim }],
  }), [incomingOpacity, slideAnim]);

  const exitingStyle = useMemo(() => ({
    opacity: exitingOpacity,
    transform: [{
      translateY: slideAnim.interpolate({
        inputRange: [0, 20],
        outputRange: [-18, 0],
      }),
    }],
  }), [exitingOpacity, slideAnim]);

  return (
    <View style={styles.stageRoot}>
      <View style={styles.gridOverlay} pointerEvents="none" />
      <View style={styles.topRail}>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>AI Whiteboard</Text>
          <Text style={styles.sceneTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.74}>{currentScene?.title || 'Lesson board'}</Text>
          <Text style={styles.objectiveText} numberOfLines={2}>{objectiveText || 'Teaching content is being prepared.'}</Text>
        </View>
        <View style={styles.metaRail}>
          <View style={styles.metaPill}>
            <View style={[styles.statusDot, { backgroundColor: status?.tone || '#60a5fa' }]} />
            <Text style={styles.metaText}>{status?.label || 'Teaching'}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{modeLabel}</Text>
          </View>
          {boardWindowCount > 1 ? (
            <View style={styles.windowPill}>
              <Text style={styles.windowPillText}>{`${safeWindowIndex + 1}/${boardWindowCount}`}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.contentViewport}>
        {previousWindow && previousWindow.id !== currentWindow?.id ? (
          <Animated.View pointerEvents="none" style={[styles.windowSurface, styles.exitingWindow, exitingStyle]}>
            {renderRows(previousWindow.rows || [])}
          </Animated.View>
        ) : null}
        <Animated.View style={[styles.windowSurface, incomingStyle]}>
          {renderRows(currentWindow?.rows || [])}
        </Animated.View>
      </View>

      <View style={styles.highlightLayer} pointerEvents="none">{renderHighlightLayer(layers.highlight || [])}</View>
      <View style={styles.transitionLayer} pointerEvents="none">{renderTransitionLayer(layers.transition || [])}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  stageRoot: { flex: 1, padding: 16, backgroundColor: '#07111c', overflow: 'hidden' },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  topRail: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12, zIndex: 2 },
  titleCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#7dd3fc', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  sceneTitle: { color: '#f8fafc', fontSize: 22, lineHeight: 28, fontWeight: '800', marginBottom: 6, flexShrink: 1 },
  objectiveText: { color: '#a5b4c7', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  metaRail: { alignItems: 'flex-end', gap: 8, maxWidth: '38%' },
  metaPill: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)', backgroundColor: 'rgba(10,18,30,0.86)', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#dbeafe', fontSize: 11, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  windowPill: { borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.18)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.24)', paddingHorizontal: 10, paddingVertical: 5 },
  windowPillText: { color: '#bfdbfe', fontSize: 10, fontWeight: '800' },
  contentViewport: { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', borderRadius: 22 },
  windowSurface: { ...StyleSheet.absoluteFillObject, gap: 10 },
  exitingWindow: { pointerEvents: 'none' },
  layoutRow: { width: '100%', gap: 10, marginBottom: 10 },
  layoutRowSingle: { flexDirection: 'column' },
  layoutRowSplit: { flexDirection: 'row', alignItems: 'stretch' },
  layoutCell: { minWidth: 0 },
  layoutCellFull: { width: '100%' },
  layoutCellHalf: { flex: 1 },
  boardTitle: { color: '#f8fafc', fontSize: 26, lineHeight: 30, fontWeight: '800', flexShrink: 1 },
  contentBlock: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', backgroundColor: 'rgba(15,23,42,0.58)', padding: 12, gap: 6, flexShrink: 1 },
  focusBlock: { borderColor: 'rgba(96,165,250,0.4)', backgroundColor: 'rgba(29,78,216,0.14)' },
  blockTitle: { color: '#7dd3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  blockText: { color: '#e2e8f0', fontSize: 13, lineHeight: 18, fontWeight: '500', flexShrink: 1 },
  sectionStack: { gap: 8, flexShrink: 1 },
  sectionLabel: { color: '#7dd3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexShrink: 1 },
  bulletDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#38bdf8', marginTop: 6 },
  bulletText: { flex: 1, color: '#f8fafc', fontSize: 14, lineHeight: 19, fontWeight: '600' },
  equationBlock: { backgroundColor: 'rgba(30,64,175,0.18)', borderColor: 'rgba(96,165,250,0.3)' },
  equationText: { color: '#dbeafe', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  equationNote: { color: '#bfdbfe', fontSize: 12, lineHeight: 17 },
  exampleBlock: { backgroundColor: 'rgba(15,23,42,0.8)' },
  codeText: { color: '#e2e8f0', fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' },
  helperText: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  diagramBlock: { gap: 8, flexShrink: 1 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  flowBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  flowBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  flowText: { flex: 1, color: '#e2e8f0', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  compareRow: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', backgroundColor: 'rgba(15,23,42,0.56)', padding: 10, flexShrink: 1 },
  compareTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  compareBody: { color: '#cbd5e1', fontSize: 12, lineHeight: 17 },
  nodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nodeCard: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', backgroundColor: 'rgba(15,23,42,0.6)', minWidth: 0, flexGrow: 1, flexBasis: '47%' },
  nodeText: { color: '#f8fafc', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  highlightLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 18 },
  highlightRail: { gap: 8, alignItems: 'flex-end' },
  highlightPill: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(96,165,250,0.36)', backgroundColor: 'rgba(30,64,175,0.2)', paddingHorizontal: 10, paddingVertical: 6, maxWidth: 220 },
  highlightText: { color: '#dbeafe', fontSize: 11, fontWeight: '800' },
  transitionLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 18 },
  transitionRail: { gap: 8 },
  transitionBubble: { maxWidth: '74%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)', backgroundColor: 'rgba(7,12,22,0.92)', paddingHorizontal: 12, paddingVertical: 10 },
  transitionText: { color: '#dbeafe', fontSize: 12, lineHeight: 17, fontWeight: '700' },
});

export default WhiteboardStage;
