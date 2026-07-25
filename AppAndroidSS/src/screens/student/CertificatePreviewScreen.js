import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, ImageBackground, Image, useWindowDimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainLayout from '../../components/ui/MainLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { certificateAPI, certificateTemplateAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',      icon: 'grid-outline',    iconActive: 'grid',    route: 'Dashboard' },
  { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
  { label: 'My Learning',    icon: 'school-outline',  iconActive: 'school',  route: 'EnrolledCourses' },
  { label: 'AI Assistant',   icon: 'sparkles-outline',iconActive: 'sparkles',route: 'AITutor' },
  { label: 'Certificates',   icon: 'ribbon-outline',  iconActive: 'ribbon',  route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
];

// ── Certificate Card — mirrors the PDF design exactly ───────────────────────
const CertificateCard = ({ template, certificate, studentName, courseName, cardWidth }) => {
  const primary   = template?.primaryColor   || '#4F46E5';
  const secondary = template?.secondaryColor || '#22D3EE';
  const titleText    = template?.titleText    || 'Certificate of Completion';
  const subtitleText = template?.subtitleText || 'This is to certify that';
  const isPending    = !certificate;

  const bgUri  = template?.backgroundImage ? resolveFileUrl(template.backgroundImage)  : null;
  const sigUri = template?.adminSignature  ? resolveFileUrl(template.adminSignature)   : null;
  const logoUri = resolveFileUrl('/assets/gazarise_logo.png');

  // Mirror certificateService.js color logic exactly (dark bg = light text)
  const hasBg = !!bgUri;
  // Preview assumes dark background when bg image is present (matches PDF default)
  const titleColor   = hasBg ? '#FFFFFF'              : primary;
  const nameColor    = hasBg ? '#FFFFFF'              : primary;
  const brandColor   = hasBg ? '#FFFFFF'              : primary;
  const bodyColor    = hasBg ? '#E0E0E0'              : '#666666';
  const courseColor  = hasBg ? '#FFFFFF'              : '#333333';
  const detailColor  = hasBg ? '#CCCCCC'              : '#888888';
  const footerColor  = hasBg ? '#AAAAAA'              : '#999999';
  const sigLineColor = hasBg ? '#FFFFFF'              : '#333333';
  const borderColor  = hasBg ? secondary              : primary;
  const innerBorderColor = hasBg ? 'rgba(255,255,255,0.30)' : secondary;
  const bgColor      = hasBg ? 'transparent'          : '#ffffff';

  // Landscape A4 ratio 297:210 ≈ 1.414
  const cardHeight = Math.round(cardWidth / 1.414);

  const issueDate = certificate
    ? new Date(certificate.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const certNumber = certificate?.certificateNumber || null;
  const grade      = certificate?.grade || 'Pass';

  // Scale factor so fonts adapt to card width
  const s = cardWidth / 620;

  const content = (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Outer decorative border */}
      <View style={[cc.outerBorder, { borderColor, top: 10 * s, left: 10 * s, right: 10 * s, bottom: 10 * s }]} />
      {/* Inner decorative border */}
      <View style={[cc.outerBorder, { borderColor: innerBorderColor, borderWidth: 0.8, top: 16 * s, left: 16 * s, right: 16 * s, bottom: 16 * s }]} />

      {/* Watermark */}
      <Text style={[cc.watermark, { color: hasBg ? 'rgba(255,255,255,0.04)' : 'rgba(79,70,229,0.04)', fontSize: 52 * s }]}>
        GAZARISE
      </Text>

      {/* Main content */}
      <View style={[cc.content, { paddingHorizontal: 28 * s, paddingTop: 22 * s, paddingBottom: 44 * s }]}>

        {/* Logo + Brand */}
        <Image
          source={{ uri: logoUri }}
          style={{ width: 55 * s, height: 55 * s, borderRadius: 8 * s, marginBottom: 4 * s }}
          resizeMode="contain"
          onError={(e) => console.warn('[CertCard] logo load error:', e.nativeEvent?.error, logoUri)}
        />
        <Text style={[cc.brandName, { color: brandColor, fontSize: 9 * s, letterSpacing: 2 }]}>GAZARISE</Text>

        {/* Title */}
        <Text style={[cc.certTitle, { color: titleColor, fontSize: 14 * s, letterSpacing: 2 }]}>
          {titleText.toUpperCase()}
        </Text>
        <View style={[cc.titleUnderline, { backgroundColor: secondary, width: 40 * s, height: 2 * s }]} />

        {/* Subtitle */}
        <Text style={[cc.subtitle, { color: bodyColor, fontSize: 8 * s }]}>{subtitleText}</Text>

        {/* Student name */}
        <Text style={[cc.studentName, { color: nameColor, fontSize: 18 * s, borderBottomColor: secondary, borderBottomWidth: 1.5 * s, paddingBottom: 4 * s }]}>
          {studentName}
        </Text>

        {/* Completion text */}
        <Text style={[cc.completionText, { color: bodyColor, fontSize: 8 * s }]}>
          has successfully completed the course
        </Text>

        {/* Course name */}
        <Text style={[cc.courseName, { color: courseColor, fontSize: 11 * s }]} numberOfLines={2}>
          {courseName}
        </Text>

        {/* Details row */}
        <View style={[cc.detailsWrap, { marginTop: 6 * s }]}>
          <Text style={[cc.detailText, { color: detailColor, fontSize: 7 * s }]}>
            Issued on: {issueDate}
          </Text>
          {certNumber ? (
            <Text style={[cc.detailText, { color: detailColor, fontSize: 7 * s }]} numberOfLines={1}>
              Certificate ID: {certNumber}
            </Text>
          ) : (
            <Text style={[cc.detailText, { color: '#f59e0b', fontSize: 7 * s }]}>
              Status: Pending Payment
            </Text>
          )}
        </View>

        {/* Signature */}
        <View style={[cc.sigSection, { marginTop: 8 * s }]}>
          <View style={cc.sigBlock}>
            {sigUri ? (
              <Image
                source={{ uri: sigUri }}
                style={{ width: 70 * s, height: 28 * s, marginBottom: 3 * s }}
                resizeMode="contain"
                onError={(e) => console.warn('[CertCard] signature load error:', e.nativeEvent?.error, sigUri)}
              />
            ) : (
              <View style={{ height: 28 * s }} />
            )}
            <View style={[cc.sigLine, { borderTopColor: sigLineColor, borderTopWidth: 0.8, width: 80 * s, paddingTop: 3 * s }]}>
              <Text style={[cc.sigName, { color: bodyColor, fontSize: 7 * s }]}>Instructor</Text>
              <Text style={[cc.sigTitle, { color: detailColor, fontSize: 6 * s }]}>GazaRise</Text>
            </View>
          </View>
        </View>

      </View>

      {/* Footer — absolute bottom */}
      <View style={[cc.footer, { bottom: 13 * s, paddingHorizontal: 20 * s }]}>
        <Text style={[cc.footerText, { color: footerColor, fontSize: 6 * s }]}>
          Verify at: gazarise.com/verify/{certNumber || '---'}
        </Text>
        <Text style={[cc.footerText, { color: footerColor, fontSize: 6 * s }]}>
          {certNumber || 'Grade: ' + grade}
        </Text>
      </View>

      {/* "PREVIEW" diagonal stamp when pending */}
      {isPending && (
        <View style={cc.previewStamp} pointerEvents="none">
          <Text style={[cc.previewStampText, { fontSize: 28 * s }]}>PREVIEW</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[cc.cardOuter, { borderColor, width: cardWidth, height: cardHeight,
      shadowColor: primary, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }]}>
      {bgUri ? (
        <ImageBackground
          source={{ uri: bgUri }}
          style={{ flex: 1 }}
          imageStyle={{ borderRadius: 10 }}
          resizeMode="cover"
          onError={(e) => console.warn('[CertCard] background load error:', e.nativeEvent?.error, bgUri)}
        >
          {content}
        </ImageBackground>
      ) : (
        content
      )}
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
const CertificatePreviewScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { theme, isDark } = useTheme();
  const { user, logout }  = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const { courseId, courseName } = route.params || {};

  const [certificate, setCertificate] = useState(null);
  const [template,    setTemplate]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Card width: screen width minus padding, capped at 700
  const cardWidth = Math.min(windowWidth - 40, 700);

  useEffect(() => { loadData(); }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certRes, tplRes] = await Promise.allSettled([
        certificateAPI.getMyCertificates(),
        certificateTemplateAPI.getForCourse(courseId),
      ]);

      if (certRes.status === 'fulfilled' && certRes.value?.success) {
        const existing = certRes.value.certificates.find(
          c => String(c.courseId) === String(courseId)
        );
        setCertificate(existing || null);
      }

      if (tplRes.status === 'fulfilled' && tplRes.value?.template) {
        const tpl = tplRes.value.template;
        console.log('[CertPreview] template:', JSON.stringify({
          id: tpl.id, name: tpl.name,
          backgroundImage: tpl.backgroundImage,
          adminSignature: tpl.adminSignature,
          primaryColor: tpl.primaryColor,
        }));
        setTemplate(tpl);
      } else {
        try {
          const activeRes = await certificateTemplateAPI.getActive();
          if (activeRes?.template) {
            const tpl = activeRes.template;
            console.log('[CertPreview] fallback template:', JSON.stringify({
              id: tpl.id, name: tpl.name,
              backgroundImage: tpl.backgroundImage,
              adminSignature: tpl.adminSignature,
            }));
            setTemplate(tpl);
          }
        } catch (_) {}
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout showSidebar={true} sidebarItems={SIDEBAR_ITEMS} activeRoute="Certificates"
        onNavigate={r => navigation.navigate(r)}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }} onLogout={logout}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebar={true} sidebarItems={SIDEBAR_ITEMS} activeRoute="Certificates"
      onNavigate={r => navigation.navigate(r)}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }} onLogout={logout}>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { maxWidth: 740, alignSelf: 'center', width: '100%' }]}>

          {/* Page Header Banner */}
          <View style={[styles.pageHeaderBanner, {
            backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)',
            borderColor: 'rgba(16,185,129,0.15)',
          }]}>
            <View style={styles.bannerLeft}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <View style={[styles.bannerIconCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Icon name="ribbon" size={22} color="#10B981" />
              </View>
              <View style={styles.bannerTextGroup}>
                <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                  {certificate ? 'Your Certificate' : 'Certificate Preview'}
                </Text>
                <Text style={[styles.pageSub, { color: theme.colors.textSecondary }]}>
                  {certificate
                    ? 'Issued and sent to your email'
                    : 'Preview — complete payment to receive your official certificate'}
                </Text>
              </View>
            </View>
          </View>

          {/* Certificate visual — full design with background + signature */}
          <View style={styles.cardWrapper}>
            <CertificateCard
              template={template}
              certificate={certificate}
              studentName={user?.name || 'Student'}
              courseName={courseName || 'Course'}
              cardWidth={cardWidth}
            />
          </View>

          {/* Template info */}
          {template && (
            <View style={[styles.templateRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderColor: theme.colors.border }]}>
              <View style={[styles.templateDot, { backgroundColor: template.primaryColor || '#4F46E5' }]} />
              <Text style={[styles.templateName, { color: theme.colors.textSecondary }]}>
                Template: <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>{template.name || 'Default Template'}</Text>
              </Text>
              {template.backgroundImage && (
                <View style={styles.templateBadge}>
                  <Icon name="image-outline" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.templateBadgeText, { color: theme.colors.textTertiary }]}>Custom BG</Text>
                </View>
              )}
              {template.adminSignature && (
                <View style={styles.templateBadge}>
                  <Icon name="create-outline" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.templateBadgeText, { color: theme.colors.textTertiary }]}>Signed</Text>
                </View>
              )}
            </View>
          )}

          {/* Info note */}
          <View style={[styles.noteRow, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff', borderColor: '#c7d2fe' }]}>
            <Icon name="information-circle-outline" size={18} color="#6366f1" />
            <Text style={[styles.noteText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
              {certificate
                ? `The official PDF certificate has been sent to ${user?.email}.`
                : 'This preview uses your actual template design. Pay to receive the official signed PDF via email.'}
            </Text>
          </View>

          {certificate ? (
            <View style={styles.actionGroup}>
              <View style={[styles.successBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5' }]}>
                <Icon name="checkmark-circle" size={22} color="#10b981" />
                <Text style={[styles.successText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                  Certificate issued &amp; emailed successfully
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Certificates')}
              >
                <Icon name="ribbon-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>View All Certificates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionGroup}>
              <View style={[styles.feeCard, {
                backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#f0f0ff',
                borderColor: theme.colors.primary + '30',
              }]}>
                <MaterialIcon name="certificate-outline" size={30} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>Certificate Fee</Text>
                <Text style={[styles.feeAmount, { color: theme.colors.primary }]}>PKR 500</Text>
                <Text style={[styles.feeNote, { color: theme.colors.textTertiary }]}>
                  Official signed PDF delivered to your email
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Payment', { courseId, courseName, amount: 500 })}
                activeOpacity={0.85}
              >
                <MaterialIcon name="credit-card-outline" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Proceed to Pay</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </MainLayout>
  );
};

// ── Certificate Card Styles ──────────────────────────────────────────────────
const cc = StyleSheet.create({
  cardOuter: {
    borderRadius: 10,
    borderWidth: 2.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
  },
  outerBorder: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 6,
  },
  watermark: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    fontWeight: '800',
    letterSpacing: 8,
    transform: [{ rotate: '-30deg' }],
    zIndex: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  brandName: {
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  certTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 5,
  },
  titleUnderline: {
    borderRadius: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontStyle: 'italic',
    marginBottom: 7,
    textAlign: 'center',
  },
  studentName: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
    minWidth: 160,
  },
  completionText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  courseName: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
    maxWidth: '85%',
  },
  detailsWrap: {
    alignItems: 'center',
    gap: 2,
  },
  detailText: {
    textAlign: 'center',
  },
  sigSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sigBlock: {
    alignItems: 'center',
  },
  sigLine: {
    alignItems: 'center',
  },
  sigName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  sigTitle: {
    textAlign: 'center',
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {},
  previewStamp: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewStampText: {
    fontWeight: '900',
    color: 'rgba(100,100,100,0.10)',
    letterSpacing: 12,
    transform: [{ rotate: '-35deg' }],
  },
});

// ── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  inner: { gap: 16 },

  pageHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextGroup: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  pageSub: { fontSize: 12, marginTop: 2 },

  cardWrapper: { alignItems: 'center' },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
    borderLeftWidth: 3, borderLeftColor: '#F5C842',
  },
  templateDot: { width: 10, height: 10, borderRadius: 5 },
  templateName: { fontSize: 12, flex: 1 },
  templateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  templateBadgeText: { fontSize: 10 },

  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },

  actionGroup: { gap: 12 },
  feeCard: {
    borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 4,
    borderTopWidth: 3, borderTopColor: '#F5C842', overflow: 'hidden',
  },
  feeLabel: { fontSize: 13 },
  feeAmount: { fontSize: 36, fontWeight: '800', marginVertical: 4 },
  feeNote: { fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 260 },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12,
  },
  successText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
});

export default CertificatePreviewScreen;
