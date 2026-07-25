import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';

// Section 12 - Cards (Course Cards)
// Shows: name, image, category, level, duration, rating, progress

const ORANGE = '#FF8C42';

const CourseCard = ({
  title,
  description,
  image,
  category,
  level,
  duration,
  progress,
  rating,
  studentsCount,
  lessonsCount,
  price,
  isFree = false,
  status, // 'in-progress', 'completed', 'new', 'popular'
  onPress,
  variant = 'default', // default, compact, horizontal
  style,
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const getStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      'in-progress': { label: 'In Progress', variant: 'info' },
      'completed': { label: 'Completed', variant: 'success' },
      'new': { label: 'New', variant: 'primary' },
      'popular': { label: 'Popular', variant: 'warning' },
      'draft': { label: 'Draft', variant: 'warning' },
      'published': { label: 'Published', variant: 'success' },
    };

    const config = statusConfig[status];
    return config ? <StatusBadge label={config.label} variant={config.variant} /> : null;
  };

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,26,46,0.08)',
            ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 0.2s ease', cursor: 'pointer' } : {}),
          },
          theme.shadows.sm,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View style={styles.horizontalImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.horizontalImage} />
          ) : (
            <View style={[styles.horizontalImagePlaceholder, { backgroundColor: 'rgba(255,140,66,0.12)' }]}>
              <Icon name="book-outline" size={32} color={ORANGE} />
            </View>
          )}
          {getStatusBadge() && (
            <View style={styles.horizontalBadge}>
              {getStatusBadge()}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.horizontalContent}>
          {category && (
            <Text style={[styles.category, { color: ORANGE }]}>
              {category}
            </Text>
          )}
          <Text
            style={[
              styles.horizontalTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Level */}
          {level && (
            <View style={styles.levelContainer}>
              <Icon name="school-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.levelText, { color: theme.colors.textSecondary }]}>
                {level}
              </Text>
            </View>
          )}

          {/* Progress */}
          {progress !== undefined && (
            <View style={styles.progressSection}>
              <ProgressBar progress={progress} size="sm" showLabel />
            </View>
          )}

          {/* Meta */}
          <View style={styles.meta}>
            {duration && (
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {duration}
                </Text>
              </View>
            )}
            {rating && (
              <View style={styles.metaItem}>
                <Icon name="star" size={14} color="#F59E0B" />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {rating}
                </Text>
              </View>
            )}
            {lessonsCount && (
              <View style={styles.metaItem}>
                <Icon name="play-circle-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {lessonsCount} lessons
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,26,46,0.08)',
            ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 0.2s ease', cursor: 'pointer' } : {}),
          },
          theme.shadows.sm,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImagePlaceholder, { backgroundColor: 'rgba(255,140,66,0.12)' }]}>
              <Icon name="book-outline" size={24} color={ORANGE} />
            </View>
          )}
        </View>
        <View style={styles.compactContent}>
          <Text
            style={[
              styles.compactTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {progress !== undefined && (
            <ProgressBar progress={progress} size="sm" style={styles.compactProgress} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Default card variant
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,26,46,0.08)',
          ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 0.2s ease', cursor: 'pointer' } : {}),
        },
        theme.shadows.sm,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: 'rgba(255,140,66,0.12)' }]}>
            <Icon name="book-outline" size={48} color={ORANGE} />
          </View>
        )}
        {getStatusBadge() && (
          <View style={styles.badge}>
            {getStatusBadge()}
          </View>
        )}
        {(price || isFree) && (
          <View style={[styles.priceTag, { backgroundColor: isFree ? theme.colors.success : ORANGE }]}>
            <Text style={styles.priceText}>
              {isFree ? 'Free' : price}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {category && (
          <Text style={[styles.category, { color: ORANGE }]}>
            {category}
          </Text>
        )}
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.semiBold,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        {/* Level */}
        {level && (
          <View style={styles.levelContainer}>
            <Icon name="school-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.levelText, { color: theme.colors.textSecondary }]}>
              {level}
            </Text>
          </View>
        )}

        {/* Progress */}
        {progress !== undefined && (
          <View style={styles.progressSection}>
            <ProgressBar progress={progress} size="sm" showLabel />
          </View>
        )}

        {/* Footer Meta */}
        <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)' }]}>
          <View style={styles.meta}>
            {duration && (
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {duration}
                </Text>
              </View>
            )}
            {rating && (
              <View style={styles.metaItem}>
                <Icon name="star" size={14} color="#F59E0B" />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {rating}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.meta}>
            {lessonsCount && (
              <View style={styles.metaItem}>
                <Icon name="play-circle-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {lessonsCount} lessons
                </Text>
              </View>
            )}
            {studentsCount && (
              <View style={styles.metaItem}>
                <Icon name="people-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {studentsCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 13,
  },
  progressSection: {
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  compactImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compactImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  compactProgress: {
    marginTop: 4,
  },

  // Horizontal variant
  horizontalContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  horizontalImageContainer: {
    width: 140,
    position: 'relative',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    minHeight: 140,
    resizeMode: 'cover',
  },
  horizontalImagePlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  horizontalContent: {
    flex: 1,
    padding: 16,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default CourseCard;
