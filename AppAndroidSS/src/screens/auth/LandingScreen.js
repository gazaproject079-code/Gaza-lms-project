import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  useWindowDimensions,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import PalestineFlagBlob from '../../components/PalestineFlagBlob';
import { courseAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';

const LOGO   = require('../../assets/images/gazarise_logo.png');
const GREEN  = '#007A3D';
const RED    = '#CE1126';
const NAVY   = '#0F1923';
const NAVY2  = '#162032';

// ─── Section title ────────────────────────────────────────────────────────────
const SectionTitle = ({ tag, title, subtitle, center = true, theme, isMobile }) => (
  <View style={{ alignItems: center ? 'center' : 'flex-start', marginBottom: isMobile ? 28 : 40 }}>
    {tag ? (
      <View style={{
        backgroundColor: GREEN + '20', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10,
      }}>
        <Text style={{ color: GREEN, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
          {tag.toUpperCase()}
        </Text>
      </View>
    ) : null}
    <Text style={{
      fontSize: isMobile ? 22 : 30, fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: center ? 'center' : 'left',
      lineHeight: isMobile ? 30 : 38, marginBottom: 10,
    }}>
      {title}
    </Text>
    {subtitle ? (
      <Text style={{
        fontSize: isMobile ? 14 : 16, color: theme.colors.textSecondary,
        textAlign: center ? 'center' : 'left',
        lineHeight: isMobile ? 22 : 26, maxWidth: 560,
      }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'support',  label: 'Support Gaza', icon: 'heart-outline',       iconActive: 'heart' },
  { id: 'features', label: 'Features',     icon: 'grid-outline',        iconActive: 'grid' },
  { id: 'how',      label: 'How It Works', icon: 'git-branch-outline',  iconActive: 'git-branch' },
  { id: 'courses',  label: 'Courses',      icon: 'library-outline',     iconActive: 'library' },
  { id: 'faq',      label: 'FAQ',          icon: 'help-circle-outline', iconActive: 'help-circle' },
  { id: 'contact',  label: 'Contact',      icon: 'mail-outline',        iconActive: 'mail' },
];

// ─── 1. NAVBAR ────────────────────────────────────────────────────────────────
const Navbar = ({ navigation, isDark, isMobile, isDesktop, scrollToSection, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const isWeb = Platform.OS === 'web';

  const openMenu = () => {
    setMenuOpen(true);
    Animated.spring(menuAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => setMenuOpen(false));
  };
  const handleLink = (id) => { closeMenu(); setTimeout(() => scrollToSection(id), 120); };

  const MobileDropdown = () => (
    <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
      <TouchableOpacity
        style={[
          ns.modalBackdrop,
          isWeb && { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
        ]}
        onPress={closeMenu} activeOpacity={1}
      >
        <Animated.View style={[
          ns.dropdownCard,
          {
            backgroundColor: isDark ? '#162032' : '#FFFFFF',
            borderColor: isDark ? 'rgba(0,122,61,0.25)' : 'rgba(0,122,61,0.2)',
            top: 70,
            opacity: menuAnim,
            transform: [
              { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [-12,0] }) },
              { scale:      menuAnim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) },
            ],
          },
        ]}>
          {NAV_LINKS.map(link => {
            const isActive = activeSection === link.id;
            return (
              <TouchableOpacity key={link.id}
                style={[ns.dropdownItem, isActive && ns.dropdownItemActive]}
                onPress={() => handleLink(link.id)} activeOpacity={0.7}
              >
                <View style={[ns.dropdownItemIcon, isActive && ns.dropdownItemIconActive]}>
                  <Icon name={isActive ? link.iconActive : link.icon} size={18}
                    color={isActive ? '#FFFFFF' : GREEN} />
                </View>
                <Text style={[ns.dropdownItemLabel,
                  { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY },
                  isActive && ns.dropdownItemLabelActive]}>
                  {link.label}
                </Text>
                {isActive && <View style={ns.dropdownActiveDot} />}
              </TouchableOpacity>
            );
          })}

          <View style={[ns.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

          <View style={ns.dropdownItem}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(124,111,205,0.15)' }]}>
              <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color="#7C6FCD" />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <ThemeToggle iconColor={isDark ? '#F5C842' : '#7C6FCD'} />
          </View>

          <View style={[ns.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

          <TouchableOpacity style={ns.dropdownItem}
            onPress={() => { closeMenu(); navigation.navigate('GazaEducationSupport'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(0,122,61,0.1)' }]}>
              <Icon name="heart-outline" size={18} color={GREEN} />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Support Gaza</Text>
          </TouchableOpacity>

          <TouchableOpacity style={ns.dropdownItem}
            onPress={() => { closeMenu(); navigation.navigate('Login'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(0,122,61,0.1)' }]}>
              <Icon name="log-in-outline" size={18} color={GREEN} />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[ns.dropdownItem, ns.getStartedRow]}
            onPress={() => { closeMenu(); navigation.navigate('Signup'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="rocket-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: '#FFFFFF', fontWeight: '800' }]}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const stickyStyle = isWeb ? { position: 'sticky', top: 0, zIndex: 999 } : {};

  const Inner = () => (
    <View style={ns.content}>
      <View style={ns.leftSection}>
        <Image source={LOGO} style={ns.logoImg} resizeMode="cover" />
        <Text style={ns.logoText}>
          GAZA<Text style={{ color: RED }}>RISE</Text>
        </Text>
      </View>

      {!isMobile && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={ns.navPillsScroll} contentContainerStyle={ns.navPillsWrap}>
          {NAV_LINKS.map(link => {
            const isActive = activeSection === link.id;
            return (
              <TouchableOpacity key={link.id}
                style={ns.navPill}
                onPress={() => scrollToSection(link.id)} activeOpacity={0.7}>
                <View style={[ns.navOrb, isActive ? ns.navOrbActive : ns.navOrbInactive]}>
                  <Icon
                    name={isActive ? link.iconActive : link.icon}
                    size={isDesktop ? 14 : 13}
                    color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
                  />
                </View>
                {isActive && (
                  <Text style={ns.navPillTextActive}>{link.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={ns.rightSection}>
        {!isMobile && (
          <>
            <ThemeToggle iconColor="#FFFFFF" />
            <TouchableOpacity style={ns.supportBtn} onPress={() => navigation.navigate('GazaEducationSupport')}>
              <Icon name="heart-outline" size={14} color="#FFFFFF" />
              <Text style={ns.supportText}>Support Gaza</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ns.signInBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={ns.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ns.getStartedBtn} onPress={() => navigation.navigate('Signup')}>
              <Text style={ns.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
        {isMobile && (
          <TouchableOpacity onPress={menuOpen ? closeMenu : openMenu}
            style={[ns.menuTrigger, menuOpen && ns.menuTriggerOpen]} activeOpacity={0.8}>
            <Animated.View style={{
              transform: [{ rotate: menuAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','90deg'] }) }],
            }}>
              <Icon name={menuOpen ? 'close' : 'apps'} size={20} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isWeb) {
    return (
      <>
        <View style={[ns.container, { background: 'linear-gradient(135deg, #0F1923 0%, #007A3D 100%)' }, stickyStyle]}>
          <Inner />
        </View>
        {isMobile && <MobileDropdown />}
      </>
    );
  }
  const LG = require('react-native-linear-gradient').default;
  return (
    <>
      <LG colors={['#0F1923','#007A3D']} style={ns.container} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Inner />
      </LG>
      {isMobile && <MobileDropdown />}
    </>
  );
};

const ns = StyleSheet.create({
  container: { height: 62, paddingHorizontal: 20, shadowColor: '#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.35, shadowRadius:10, elevation:10 },
  content: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  leftSection: { flexDirection:'row', alignItems:'center', gap:8, flexShrink:0 },
  logoImg: { width:46, height:46, borderRadius:13 },
  logoText: { color:'#FFFFFF', fontWeight:'800', fontSize:16, letterSpacing:1.2 },
  navPillsScroll: { flex:1, marginHorizontal:8 },
  navPillsWrap: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, flexGrow:1 },
  navPill: { flexDirection:'row', alignItems:'center', gap:6 },
  navOrb: { width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center' },
  navOrbActive: { backgroundColor:GREEN, borderWidth:2, borderColor:'#CE1126' },
  navOrbInactive: { backgroundColor:'rgba(255,255,255,0.08)', borderWidth:1, borderColor:'rgba(255,255,255,0.15)' },
  navPillTextActive: { color:'#FFFFFF', fontSize:11, fontWeight:'700', letterSpacing:0.2 },
  rightSection: { flexDirection:'row', alignItems:'center', gap:10, flexShrink:0 },
  supportBtn: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, borderRadius:10, backgroundColor:'rgba(206,17,38,0.18)', borderWidth:1, borderColor:'rgba(206,17,38,0.4)' },
  supportText: { color:'#FFFFFF', fontSize:13, fontWeight:'700' },
  signInBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, borderWidth:1.5, borderColor:'rgba(255,255,255,0.25)' },
  signInText: { color:'#FFFFFF', fontSize:13, fontWeight:'600' },
  getStartedBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, backgroundColor:RED, borderWidth:1, borderColor:'#9A1220', shadowColor:'#9A1220', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:3 },
  getStartedText: { color:'#FFFFFF', fontSize:13, fontWeight:'700' },
  menuTrigger: { width:38, height:38, borderRadius:19, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,122,61,0.25)', borderWidth:1.5, borderColor:'rgba(0,200,83,0.5)' },
  menuTriggerOpen: { backgroundColor:'rgba(0,122,61,0.45)', borderColor:GREEN },
  modalBackdrop: { flex:1, backgroundColor:'rgba(10,10,30,0.5)' },
  dropdownCard: { position:'absolute', right:12, width:230, borderRadius:20, paddingVertical:8, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:20, elevation:20, borderWidth:1, overflow:'hidden' },
  dropdownItem: { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, marginHorizontal:6, marginVertical:1, borderRadius:12, gap:12 },
  dropdownItemActive: { backgroundColor:'rgba(0,122,61,0.1)' },
  dropdownItemIcon: { width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,122,61,0.1)' },
  dropdownItemIconActive: { backgroundColor:GREEN },
  dropdownItemLabel: { flex:1, fontSize:14, fontWeight:'600' },
  dropdownItemLabelActive: { color:GREEN, fontWeight:'700', letterSpacing:0.1 },
  dropdownActiveDot: { width:7, height:7, borderRadius:4, backgroundColor:GREEN },
  dropdownDivider: { height:1, marginVertical:4, marginHorizontal:12 },
  getStartedRow: { backgroundColor:RED, marginHorizontal:10, marginBottom:6, borderWidth:1, borderColor:'#9A1220', shadowColor:'#9A1220', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:3 },
});

// ─── 2. HERO ──────────────────────────────────────────────────────────────────
const HeroSection = ({ navigation, theme, isDark, isMobile }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue:1, duration:800, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:700, useNativeDriver:true }),
    ]).start();
  }, []);

  const stats = [
    { value:'10K+', label:'Students' },
    { value:'200+', label:'Courses' },
    { value:'50+',  label:'Scholars' },
    { value:'95%',  label:'Success' },
  ];

  return (
    <View style={[styles.hero, { backgroundColor: isDark ? NAVY : '#F8F9FF' }]}>
      <PalestineFlagBlob style={styles.heroFlag} opacity={isDark ? 0.13 : 0.09} isMobile={isMobile} />

      <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], alignItems:'center', zIndex:2, width:'100%' }}>
        <Text style={[
          styles.heroHeadline, { color: theme.colors.textPrimary },
          isMobile && { fontSize:28, lineHeight:36, marginBottom:14 },
        ]}>
          Learn Today,{'\n'}
          <Text style={{ color:GREEN }}>Rise Tomorrow</Text>
        </Text>

        <Text style={[
          styles.heroSub, { color: theme.colors.textSecondary },
          isMobile && { fontSize:14, lineHeight:22, paddingHorizontal:8, marginBottom:24 },
        ]}>
          Learn Medicine and Islamic Education from qualified scholars,{'\n'}
          and earn globally recognized certificates.
        </Text>

        <View style={[styles.heroCTAs, isMobile && { flexDirection:'column', width:'100%', paddingHorizontal:20, gap:10 }]}>
          <TouchableOpacity
            style={[styles.heroCtaPrimary, isMobile && { width:'100%', justifyContent:'center' }]}
            onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.heroCtaPrimaryText}>Start Learning Free</Text>
            <Icon name="arrow-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroCtaSecondary, {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.2)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.04)',
            }, isMobile && { width:'100%', justifyContent:'center' }]}
            onPress={() => navigation.navigate('ExploreCourses')}>
            <Icon name="compass-outline" size={17} color={GREEN} />
            <Text style={[styles.heroCtaSecondaryText, { color: theme.colors.textPrimary }]}>Explore Courses</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip – 2×2 grid on mobile, single row on desktop */}
        {isMobile ? (
          <View style={[styles.heroStatsMobile, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)',
          }]}>
            {stats.map(s => (
              <View key={s.label} style={styles.statItemMobile}>
                <Text style={[styles.statValue, { color:GREEN }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.heroStats, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)',
          }]}>
            {stats.map((s,i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.statsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)' }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color:GREEN }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.supportRibbon, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(0,122,61,0.22)' : 'rgba(0,122,61,0.18)',
          }, isMobile && { flexDirection:'column', alignItems:'flex-start', gap:14, padding:16 }]}
          onPress={() => navigation.navigate('GazaEducationSupport')}
          activeOpacity={0.92}
        >
          <View style={styles.supportRibbonLeft}>
            <View style={styles.supportRibbonIcon}>
              <Icon name="heart" size={18} color={GREEN} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[styles.supportRibbonTitle, { color: theme.colors.textPrimary }]}>Support education in Gaza</Text>
              <Text style={[styles.supportRibbonText, { color: theme.colors.textSecondary }]}>
                Sponsor learners, devices, and teacher support through our dedicated education campaign.
              </Text>
            </View>
          </View>
          <View style={styles.supportRibbonAction}>
            <Text style={styles.supportRibbonActionText}>Open Support Portal</Text>
            <Icon name="arrow-forward" size={15} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const GazaSupportSection = ({ navigation, theme, isDark, isMobile, onLayout }) => {
  const priorities = [
    { icon: 'school-outline', title: 'Sponsor Learners', text: 'Keep students enrolled in structured digital learning paths and mentorship.' },
    { icon: 'tablet-portrait-outline', title: 'Fund Devices', text: 'Provide device access and connectivity for students facing interrupted learning.' },
    { icon: 'people-outline', title: 'Back Teachers', text: 'Support mentors and educators delivering continuity under severe constraints.' },
  ];

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY : '#FFF9F3', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle
        tag="Support Gaza"
        title="A fundraising portal built around educational impact"
        subtitle="Help sustain access to learning for the people of Gaza through scholarships, devices, teacher support, and safe study continuity."
        theme={theme}
        isMobile={isMobile}
      />

      <View style={[styles.supportCampaignCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
      }, isMobile && { padding:20 }]}>
        <View style={[styles.supportCampaignTop, isMobile && { flexDirection:'column', gap:18 }]}>
          <View style={{ flex:1 }}>
            <Text style={styles.supportCampaignEyebrow}>Education continuity campaign</Text>
            <Text style={[styles.supportCampaignTitle, { color: isDark ? '#FFFFFF' : NAVY }, isMobile && { fontSize:24, lineHeight:30 }]}>
              Fund the future of learning in Gaza
            </Text>
            <Text style={[styles.supportCampaignBody, { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(26,26,46,0.7)' }]}>
              Our support portal turns solidarity into measurable educational outcomes with transparent giving levels and partnership pathways.
            </Text>
          </View>
          <View style={styles.supportCampaignStats}>
            <View style={styles.supportMiniStat}>
              <Text style={styles.supportMiniValue}>59%</Text>
              <Text style={styles.supportMiniLabel}>goal funded</Text>
            </View>
            <View style={styles.supportMiniStat}>
              <Text style={styles.supportMiniValue}>1,240</Text>
              <Text style={styles.supportMiniLabel}>learners supported</Text>
            </View>
            <View style={styles.supportMiniStat}>
              <Text style={styles.supportMiniValue}>320</Text>
              <Text style={styles.supportMiniLabel}>device kits</Text>
            </View>
          </View>
        </View>

        <View style={[styles.supportPriorityGrid, isMobile && { flexDirection:'column' }]}>
          {priorities.map(item => (
            <View key={item.title} style={[styles.supportPriorityCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFF9F3',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,122,61,0.10)',
              width: isMobile ? '100%' : '31%',
            }]}>
              <View style={styles.supportPriorityIcon}>
                <Icon name={item.icon} size={20} color={GREEN} />
              </View>
              <Text style={[styles.supportPriorityTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.supportPriorityText, { color: theme.colors.textSecondary }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.supportCampaignActions, isMobile && { flexDirection:'column', alignItems:'stretch' }]}>
          <TouchableOpacity style={styles.supportPrimaryBtn} onPress={() => navigation.navigate('GazaEducationSupport')}>
            <Text style={styles.supportPrimaryBtnText}>Open Fundraising Portal</Text>
            <Icon name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.supportSecondaryBtn, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(26,26,46,0.14)' }]} onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.supportSecondaryBtnText, { color: theme.colors.textPrimary }]}>Join as a learner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── 4. FEATURES ──────────────────────────────────────────────────────────────
const FeaturesSection = ({ theme, isDark, isMobile, onLayout }) => {
  const features = [
    { icon:'school-outline',     title:'Qualified Instructors', desc:'Learn from qualified medical professionals and Islamic scholars.' },
    { icon:'time-outline',       title:'Flexible Learning',  desc:'Study at your own pace with lifetime access to all course materials.' },
    { icon:'ribbon-outline',     title:'Certificates',       desc:'Earn industry-recognised certificates that boost your career prospects.' },
    { icon:'construct-outline',  title:'Live Projects',      desc:'Apply knowledge with hands-on projects that build your portfolio.' },
    { icon:'chatbubbles-outline',title:'AI Assistant',       desc:'Get instant help from our integrated AI assistant, available 24/7.' },
    { icon:'bar-chart-outline',  title:'Track Progress',     desc:'Monitor your learning journey with detailed analytics and insights.' },
  ];

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="Why Us" title="Everything You Need to Succeed"
        subtitle="We combine cutting-edge technology with qualified instruction to deliver an unparalleled learning experience."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.featuresGrid, isMobile && { flexDirection:'column', gap:12 }]}>
        {features.map(f => (
          <View key={f.title} style={[
            styles.featureCard,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
              width: isMobile ? '100%' : '31%',
            },
          ]}>
            <View style={[styles.featureIconBox, { backgroundColor: GREEN+'18' }]}>
              <Icon name={f.icon} size={24} color={GREEN} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }, isMobile && { fontSize:15 }]}>{f.title}</Text>
            <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{f.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── 5. HOW IT WORKS ──────────────────────────────────────────────────────────
const HowItWorksSection = ({ theme, isDark, isMobile, onLayout }) => {
  const steps = [
    { icon:'search-outline',     num:'01', title:'Browse Courses',  desc:'Explore our library of specialized courses in Medicine and Islamic Education.' },
    { icon:'person-add-outline', num:'02', title:'Enroll & Learn',  desc:'Enroll and learn with video lessons, hands-on projects, and quizzes.' },
    { icon:'medal-outline',      num:'03', title:'Earn Certificate',desc:'Complete the course, pass the assessment, and download your certificate.' },
  ];

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY : '#F8F9FF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="The Process" title="How It Works"
        subtitle="Get started on your learning journey in three simple steps."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.stepsRow, isMobile && { flexDirection:'column', gap:16 }]}>
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <View style={[
              styles.stepCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
                flex: isMobile ? undefined : 1,
                width: isMobile ? '100%' : undefined,
                padding: isMobile ? 20 : 28,
              },
            ]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <View style={[styles.stepIconCircle, { backgroundColor: GREEN+'1A' }]}>
                <Icon name={step.icon} size={isMobile ? 26 : 30} color={GREEN} />
              </View>
              <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }, isMobile && { fontSize:16 }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{step.desc}</Text>
            </View>
            {!isMobile && i < steps.length-1 && (
              <View style={styles.stepArrow}>
                <Icon name="chevron-forward" size={26} color={GREEN+'60'} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

// ─── 6. COURSES CAROUSEL ──────────────────────────────────────────────────────
const CAT_COLORS = {
  Medicine: '#EF4444', 'Islamic Education': '#10B981',
};

const CoursesCarousel = ({ navigation, theme, isDark, isMobile, onLayout }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    courseAPI.getTopCourses(3)
      .then(res => setCourses(res.courses || []))
      .catch(() => { setCourses([]); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const cardBg     = isDark ? 'rgba(255,255,255,0.06)' : '#F8F9FF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)';
  const CARD_W     = isMobile ? 220 : 240;

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: isMobile ? 20 : 32, width:'100%' }}>
        <View>
          <View style={{ backgroundColor: GREEN+'20', borderRadius:20, paddingHorizontal:12, paddingVertical:4, alignSelf:'flex-start', marginBottom:8 }}>
            <Text style={{ color:GREEN, fontSize:11, fontWeight:'700', letterSpacing:1.2 }}>LEARN NOW</Text>
          </View>
          <Text style={{ fontSize: isMobile ? 20 : 26, fontWeight:'800', color: theme.colors.textPrimary }}>Top Courses</Text>
        </View>
        <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', gap:4 }}
          onPress={() => navigation.navigate('ExploreCourses')}>
          <Text style={{ color:GREEN, fontSize:13, fontWeight:'600' }}>View All</Text>
          <Icon name="arrow-forward" size={13} color={GREEN} />
        </TouchableOpacity>
      </View>

      {loading && (
        isMobile ? (
          <View style={{ gap:12 }}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.courseCard, { width:'100%', backgroundColor:cardBg, borderColor:cardBorder, flexDirection:'row', height:100 }]}>
                <View style={{ width:100, backgroundColor: isDark ? 'rgba(255,255,255,0.04)':'#ECECEC', borderTopLeftRadius:14, borderBottomLeftRadius:14 }} />
                <View style={{ flex:1, padding:14, gap:10, justifyContent:'center' }}>
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'40%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'90%' }} />
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)':'#EBEBEB', width:'55%' }} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:14, paddingBottom:8 }}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.courseCard, { width:CARD_W, backgroundColor:cardBg, borderColor:cardBorder }]}>
                <View style={[styles.courseThumb, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)':'#ECECEC' }]} />
                <View style={{ padding:14, gap:10 }}>
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'40%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'90%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)':'#EBEBEB', width:'65%' }} />
                </View>
              </View>
            ))}
          </ScrollView>
        )
      )}

      {!loading && error && (
        <View style={{ alignItems:'center', paddingVertical:28 }}>
          <Icon name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop:10, fontSize:13 }}>
            Could not load courses. Check your connection.
          </Text>
        </View>
      )}

      {!loading && !error && courses.length === 0 && (
        <View style={{ alignItems:'center', paddingVertical:28 }}>
          <Icon name="book-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop:10, fontSize:13 }}>
            No published courses yet.
          </Text>
        </View>
      )}

      {!loading && !error && courses.length > 0 && (() => {
        const renderCard = (course, horizontal) => {
          const catName = course.category?.name || 'General';
          const catColor = CAT_COLORS[catName] || GREEN;
          const thumb = course.thumbnailImage ? resolveFileUrl(course.thumbnailImage) : null;
          const instructor = course.user?.name || null;

          if (horizontal) {
            // Desktop/tablet: vertical card (image on top)
            return (
              <TouchableOpacity key={course.id}
                style={[styles.courseCard, { width:CARD_W, backgroundColor:cardBg, borderColor:cardBorder }]}
                onPress={() => navigation.navigate('ExploreCourseDetail', { courseId:course.id })}
                activeOpacity={0.85}>
                <View style={[styles.courseThumb, { backgroundColor: catColor+'20' }]}>
                  {thumb ? (
                    <Image source={{ uri:thumb }}
                      style={{ width:'100%', height:'100%', borderTopLeftRadius:14, borderTopRightRadius:14 }}
                      resizeMode="cover" />
                  ) : (
                    <Icon name="book-outline" size={38} color={catColor} />
                  )}
                </View>
                <View style={[styles.courseCatBadge, { backgroundColor: catColor+'20' }]}>
                  <Text style={[styles.courseCatText, { color:catColor }]}>{catName}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>{course.name}</Text>
                  {instructor && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:5 }}>
                      <Icon name="person-circle-outline" size={13} color={theme.colors.textSecondary} />
                      <Text style={[styles.courseInstructor, { color: theme.colors.textSecondary }]}>{instructor}</Text>
                    </View>
                  )}
                  <View style={styles.courseFooter}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                      <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.courseEnroll, { color: theme.colors.textSecondary }]}>
                        {(course.enrollmentCount||0).toLocaleString()} enrolled
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.enrollBtn} onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.enrollBtnText}>Enroll</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // Mobile: horizontal card (image on left, info on right)
          return (
            <TouchableOpacity key={course.id}
              style={[styles.courseCard, { width:'100%', backgroundColor:cardBg, borderColor:cardBorder, flexDirection:'row', overflow:'hidden' }]}
              onPress={() => navigation.navigate('ExploreCourseDetail', { courseId:course.id })}
              activeOpacity={0.85}>
              <View style={{ width:110, height:110, backgroundColor: catColor+'20', justifyContent:'center', alignItems:'center', flexShrink:0 }}>
                {thumb ? (
                  <Image source={{ uri:thumb }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                ) : (
                  <Icon name="book-outline" size={34} color={catColor} />
                )}
              </View>
              <View style={{ flex:1, padding:12, justifyContent:'space-between' }}>
                <View>
                  <View style={{ backgroundColor: catColor+'20', borderRadius:8, paddingHorizontal:8, paddingVertical:3, alignSelf:'flex-start', marginBottom:6 }}>
                    <Text style={{ color:catColor, fontSize:10, fontWeight:'700' }}>{catName}</Text>
                  </View>
                  <Text style={{ fontSize:14, fontWeight:'700', color: theme.colors.textPrimary, lineHeight:20 }} numberOfLines={2}>
                    {course.name}
                  </Text>
                  {instructor && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:4 }}>
                      <Icon name="person-circle-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={{ fontSize:11, color: theme.colors.textSecondary }}>{instructor}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                    <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={{ fontSize:11, color: theme.colors.textSecondary }}>
                      {(course.enrollmentCount||0).toLocaleString()} enrolled
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.enrollBtn, { paddingHorizontal:14, paddingVertical:6 }]}
                    onPress={() => navigation.navigate('Signup')}>
                    <Text style={styles.enrollBtnText}>Enroll</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        };

        return isMobile ? (
          <View style={{ gap:12 }}>
            {courses.map(c => renderCard(c, false))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap:14, paddingBottom:8, paddingHorizontal:2 }}>
            {courses.map(c => renderCard(c, true))}
          </ScrollView>
        );
      })()}
    </View>
  );
};

// ─── 7. STATISTICS ────────────────────────────────────────────────────────────
const StatisticsSection = ({ isMobile }) => {
  const stats = [
    { icon:'people',  value:'10,000+', label:'Active Students' },
    { icon:'library', value:'200+',    label:'Courses Available' },
    { icon:'school',  value:'50+',     label:'Instructors' },
    { icon:'trophy',  value:'95%',     label:'Completion Rate' },
  ];
  return (
    <View style={[styles.statsSection, { paddingVertical: isMobile ? 40 : 60 }]}>
      <View style={[styles.statsGrid, isMobile && { flexWrap:'wrap', justifyContent:'center' }]}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statBlock, isMobile && { width:'50%', marginBottom:24 }]}>
            <View style={[styles.statIconCircle, { backgroundColor: GREEN+'25' }]}>
              <Icon name={s.icon} size={isMobile ? 22 : 26} color={GREEN} />
            </View>
            <Text style={[styles.statBigValue, isMobile && { fontSize:26 }]}>{s.value}</Text>
            <Text style={[styles.statBigLabel, isMobile && { fontSize:12 }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── 10. FAQ ──────────────────────────────────────────────────────────────────
const FAQSection = ({ theme, isDark, isMobile, onLayout }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q:'Is GazaRise free to use?', a:'GazaRise is completely FREE for learners located in war zones. For everyone else, there is a compulsory donation/payment which directly supports educational infrastructure in affected countries.' },
    { q:'Is my payment information secure?', a:'Yes. We use industry-standard encryption and trusted payment processors to ensure your donations and payments are completely secure.' },
    { q:'How do I get a certificate?', a:"After completing all topics and passing the final quiz with 70%+, you'll automatically receive a personalized certificate to download as a PDF." },
    { q:'How do sponsors work?', a:'Sponsors can create an account to fund students. Sponsors get access to track their student\'s progress, attendance, and results, and can communicate securely without sharing phone numbers.' },
    { q:'What is the AI Assistant feature?', a:'Our AI Assistant is powered by an advanced language model inside each course. Ask questions about lesson content, get explanations, or request practice exercises.' },
    { q:'What can I study on GazaRise?', a:'We focus on two core areas of study: Medicine and Islamic Education. Course content is curated and published by our administrators and qualified scholars.' },
  ];
  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY : '#F8F9FF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="FAQ" title="Frequently Asked Questions"
        subtitle="Have questions? We've got answers." theme={theme} isMobile={isMobile} />
      <View style={{ maxWidth:720, width:'100%', alignSelf:'center' }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <TouchableOpacity key={i}
              style={[styles.faqItem, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isOpen ? GREEN : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)'),
                marginBottom:10,
              }]}
              onPress={() => setOpenIndex(isOpen ? null : i)} activeOpacity={0.85}>
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary }, isMobile && { fontSize:14 }]}>{faq.q}</Text>
                <View style={[styles.faqChevron, { backgroundColor: isOpen ? GREEN+'18' : (isDark ? 'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)') }]}>
                  <Icon name={isOpen ? 'chevron-up':'chevron-down'} size={15} color={isOpen ? GREEN : theme.colors.textSecondary} />
                </View>
              </View>
              {isOpen && (
                <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── 11. CTA BANNER ───────────────────────────────────────────────────────────
const CTABanner = ({ navigation, isMobile }) => {
  const { isDark } = useTheme();
  return (
  <View style={[styles.ctaBanner, { paddingVertical: isMobile ? 52 : 72 }]}>
    <Text style={[styles.ctaTitle, isMobile && { fontSize:24, lineHeight:32 }]}>
      Ready to Start Learning?
    </Text>
    <Text style={[styles.ctaSub, isMobile && { fontSize:14 }]}>
      Join over 10,000 students already learning on GazaRise
    </Text>
    <View style={[styles.ctaButtons, isMobile && { flexDirection:'column', width:'100%', paddingHorizontal:24, gap:10 }]}>
      <TouchableOpacity
        style={[styles.ctaPrimary, isMobile && { width:'100%', justifyContent:'center' }]}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.ctaPrimaryText}>Create Account / Support</Text>
        <Icon name="rocket-outline" size={17} color={NAVY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ctaSecondary, isMobile && { width:'100%', justifyContent:'center' }]}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.ctaSecondaryText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

// ─── 12. CONTACT FORM ─────────────────────────────────────────────────────────
const ContactForm = ({ theme, isDark, isMobile, onLayout }) => {
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setForm({ name:'', email:'', message:'' }); }, 1200);
  };

  const inputStyle = [styles.contactInput, {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8F9FF',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.12)',
    color: theme.colors.textPrimary,
  }];
  const placeholderColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.35)';

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="Contact" title="Get In Touch"
        subtitle="Have a question or feedback? We'd love to hear from you."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.contactCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FF',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
        width: isMobile ? '100%' : 560,
        padding: isMobile ? 20 : 28,
      }]}>
        {sent ? (
          <View style={{ alignItems:'center', paddingVertical:20 }}>
            <View style={{ width:60, height:60, borderRadius:30, backgroundColor: GREEN+'20', justifyContent:'center', alignItems:'center', marginBottom:14 }}>
              <Icon name="checkmark-circle" size={34} color={GREEN} />
            </View>
            <Text style={{ fontSize:18, fontWeight:'700', color: theme.colors.textPrimary, marginBottom:8 }}>Message Sent!</Text>
            <Text style={{ color: theme.colors.textSecondary, textAlign:'center', fontSize:13 }}>
              Thank you for reaching out. We'll get back to you within 24 hours.
            </Text>
            <TouchableOpacity style={[styles.sendBtn, { marginTop:18, width:150 }]} onPress={() => setSent(false)}>
              <Text style={styles.sendBtnText}>Send Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.contactRow, isMobile && { flexDirection:'column', gap:0 }]}>
              <View style={{ flex:1 }}>
                <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Your Name</Text>
                <TextInput style={inputStyle} placeholder="John Doe"
                  placeholderTextColor={placeholderColor} value={form.name}
                  onChangeText={v => setForm(p => ({...p, name:v}))} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Email Address</Text>
                <TextInput style={inputStyle} placeholder="john@example.com"
                  placeholderTextColor={placeholderColor} keyboardType="email-address"
                  value={form.email} onChangeText={v => setForm(p => ({...p, email:v}))} />
              </View>
            </View>
            <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Message</Text>
            <TextInput style={[inputStyle, styles.contactTextarea]}
              placeholder="Tell us how we can help..."
              placeholderTextColor={placeholderColor} multiline numberOfLines={4}
              value={form.message} onChangeText={v => setForm(p => ({...p, message:v}))}
              textAlignVertical="top" />
            <TouchableOpacity style={[styles.sendBtn, { opacity: sending ? 0.7 : 1 }]}
              onPress={handleSend} disabled={sending}>
              {sending ? (
                <Text style={styles.sendBtnText}>Sending...</Text>
              ) : (
                <>
                  <Text style={styles.sendBtnText}>Send Message</Text>
                  <Icon name="send" size={15} color={NAVY} />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

// ─── 13. FOOTER ───────────────────────────────────────────────────────────────
const Footer = ({ navigation, theme, isDark, isMobile }) => {
  const cols = [
    { title:'Courses',  links:[{ name:'Explore Courses', nav:'ExploreCourses' }] },
    { title:'Company',  links:[{ name:'About Us', nav:'StaticPage', param:'about' }] },
    { title:'Support',  links:[{ name:'Donate to Gaza', nav:'GazaEducationSupport' }] },
    { title:'Legal',    links:[{ name:'Privacy Policy', nav:'StaticPage', param:'privacy' }, { name:'Terms of Service', nav:'StaticPage', param:'terms' }] },
  ];
  const socials = [
    { icon:'logo-twitter', label:'Twitter' },
    { icon:'logo-linkedin', label:'LinkedIn' },
    { icon:'logo-instagram', label:'Instagram' },
    { icon:'logo-youtube', label:'YouTube' },
  ];

  const handleLinkPress = (link) => {
    if (link.param) {
      navigation.navigate(link.nav, { pageId: link.param });
    } else if (link.nav) {
      navigation.navigate(link.nav);
    }
  };

  return (
    <View style={[styles.footer, { paddingHorizontal: isMobile ? 20 : 32 }]}>
      <View style={[styles.footerGrid, isMobile && { flexDirection:'column', gap:28 }]}>
        <View style={[styles.footerBrand, isMobile && { marginBottom:4 }]}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
            <Image source={LOGO} style={styles.footerLogoImg} resizeMode="contain" />
            <Text style={styles.footerLogoName}>Gaza<Text style={{ color:RED }}>Rise</Text></Text>
          </View>
          <Text style={[styles.footerTagline, isMobile && { fontSize:13 }]}>
            Empowering learners worldwide with quality knowledge, AI assistance, and recognised certifications.
          </Text>
          <View style={styles.footerSocials}>
            {socials.map(s => (
              <TouchableOpacity key={s.label} style={styles.socialBtn}>
                <Icon name={s.icon} size={17} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.footerCols, isMobile && { flexWrap:'wrap', gap:0 }]}>
          {cols.map(col => (
            <View key={col.title} style={[styles.footerCol, isMobile && { width:'50%', marginBottom:24 }]}>
              <Text style={styles.footerColTitle}>{col.title}</Text>
              {col.links.map(link => (
                <TouchableOpacity key={link.name} style={{ marginBottom:9 }} onPress={() => handleLinkPress(link)}>
                  <Text style={[styles.footerLink, isMobile && { fontSize:12 }]}>{link.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footerBottom, { borderTopColor:'rgba(255,255,255,0.1)' }, isMobile && { flexDirection:'column', alignItems:'center', gap:10 }]}>
        <Text style={styles.footerCopy}>© {new Date().getFullYear()} GazaRise. All rights reserved.</Text>
        <View style={{ flexDirection:'row', gap:20 }}>
          <TouchableOpacity onPress={() => navigation.navigate('StaticPage', { pageId: 'privacy' })}><Text style={styles.footerBottomLink}>Privacy</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StaticPage', { pageId: 'terms' })}><Text style={styles.footerBottomLink}>Terms</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const LandingScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;
  const isDesktop = width >= 1024;

  const scrollViewRef    = useRef(null);
  const sectionOffsets   = useRef({});
  const [activeSection, setActiveSection] = useState(null);

  const registerSection = useCallback((id) => (event) => {
    sectionOffsets.current[id] = event.nativeEvent.layout.y;
  }, []);

  // On web: IntersectionObserver tracks which section is visible while scrolling
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const ids = ['support', 'features', 'how', 'courses', 'faq', 'contact'];
    const observers = [];
    const timer = setTimeout(() => {
      ids.forEach(id => {
        const el = document.getElementById('landing-' + id);
        if (!el) return;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
          { threshold: 0.25 }
        );
        obs.observe(el);
        observers.push(obs);
      });
    }, 400);
    return () => { clearTimeout(timer); observers.forEach(o => o.disconnect()); };
  }, []);

  const scrollToSection = useCallback((id) => {
    setActiveSection(id); // immediate highlight on click
    if (Platform.OS === 'web') {
      const el = document.getElementById('landing-' + id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    const offset = sectionOffsets.current[id];
    if (offset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: offset, animated: true });
    }
  }, []);

  // Native scroll tracking
  const handleScroll = useCallback((event) => {
    if (Platform.OS === 'web') return;
    const scrollY = event.nativeEvent.contentOffset.y;
    const offsets = sectionOffsets.current;
    let active = null;
    for (const id of ['support','features','how','courses','faq','contact']) {
      if (offsets[id] !== undefined && scrollY >= offsets[id] - 100) active = id;
    }
    setActiveSection(active);
  }, []);

  return (
    <View style={{ flex:1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <Navbar
        navigation={navigation} isDark={isDark}
        isMobile={isMobile} isDesktop={isDesktop}
        scrollToSection={scrollToSection} activeSection={activeSection}
      />
      <ScrollView
        ref={scrollViewRef}
        style={{ flex:1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <HeroSection navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} />
        <View nativeID="landing-support" onLayout={registerSection('support')}>
          <GazaSupportSection navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <View nativeID="landing-features" onLayout={registerSection('features')}>
          <FeaturesSection   theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <View nativeID="landing-how" onLayout={registerSection('how')}>
          <HowItWorksSection theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <View nativeID="landing-courses" onLayout={registerSection('courses')}>
          <CoursesCarousel   navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <StatisticsSection isMobile={isMobile} />
        <View nativeID="landing-faq" onLayout={registerSection('faq')}>
          <FAQSection        theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <CTABanner         navigation={navigation} isMobile={isMobile} />
        <View nativeID="landing-contact" onLayout={registerSection('contact')}>
          <ContactForm       theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <Footer            navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} />
      </ScrollView>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hero
  hero: { paddingTop:72, paddingBottom:56, paddingHorizontal:20, alignItems:'center', overflow:'hidden', minHeight:520, justifyContent:'center' },
  heroFlag: { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:0 },
  heroBadge: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:GREEN+'18', borderRadius:20, paddingHorizontal:14, paddingVertical:6, marginBottom:20 },
  heroBadgeText: { color:GREEN, fontSize:12, fontWeight:'600', letterSpacing:0.3 },
  heroHeadline: { fontSize:48, fontWeight:'900', textAlign:'center', lineHeight:58, marginBottom:18, letterSpacing:-1 },
  heroSub: { fontSize:16, textAlign:'center', lineHeight:26, maxWidth:500, marginBottom:32 },
  heroCTAs: { flexDirection:'row', gap:12, marginBottom:40, alignItems:'center', width:'100%', justifyContent:'center' },
  heroCtaPrimary: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:RED, paddingHorizontal:26, paddingVertical:14, borderRadius:14, borderWidth:1, borderColor:'#9A1220', shadowColor:'#9A1220', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:3 },
  heroCtaPrimaryText: { color:'#FFFFFF', fontSize:15, fontWeight:'700', letterSpacing:0.12 },
  heroCtaSecondary: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:22, paddingVertical:13, borderRadius:14, borderWidth:1.5 },
  heroCtaSecondaryText: { fontSize:15, fontWeight:'600' },
  // Desktop stats row
  heroStats: { flexDirection:'row', alignItems:'center', borderRadius:16, paddingVertical:16, paddingHorizontal:24, borderWidth:1 },
  statItem: { alignItems:'center', paddingHorizontal:18 },
  statsDivider: { width:1, height:32 },
  // Mobile stats 2x2 grid
  heroStatsMobile: { flexDirection:'row', flexWrap:'wrap', borderRadius:16, paddingVertical:12, paddingHorizontal:8, borderWidth:1, width:'100%' },
  statItemMobile: { width:'50%', alignItems:'center', paddingVertical:12 },
  statValue: { fontSize:20, fontWeight:'800', marginBottom:2 },
  statLabel: { fontSize:11, fontWeight:'500' },
  supportRibbon: { marginTop:22, width:'100%', maxWidth:860, borderRadius:18, borderWidth:1, padding:18, flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:16 },
  supportRibbonLeft: { flexDirection:'row', alignItems:'center', gap:14, flex:1 },
  supportRibbonIcon: { width:42, height:42, borderRadius:14, backgroundColor:GREEN+'14', justifyContent:'center', alignItems:'center' },
  supportRibbonTitle: { fontSize:16, fontWeight:'800', marginBottom:4 },
  supportRibbonText: { fontSize:13, lineHeight:20 },
  supportRibbonAction: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:RED, borderRadius:12, paddingHorizontal:16, paddingVertical:11, borderWidth:1, borderColor:'#9A1220' },
  supportRibbonActionText: { color:'#FFFFFF', fontSize:13, fontWeight:'800' },

  // Sections
  section: { paddingVertical:72, paddingHorizontal:20, alignItems:'center' },

  // Gaza support campaign
  supportCampaignCard: { width:'100%', maxWidth:1100, borderRadius:24, borderWidth:1, padding:28 },
  supportCampaignTop: { flexDirection:'row', gap:20, justifyContent:'space-between', marginBottom:20 },
  supportCampaignEyebrow: { color:GREEN, fontSize:11, fontWeight:'800', letterSpacing:1.2, textTransform:'uppercase', marginBottom:10 },
  supportCampaignTitle: { fontSize: 34, fontWeight:'900', lineHeight: 42, marginBottom:10 },
  supportCampaignBody: { fontSize:14, lineHeight:24, maxWidth:560 },
  supportCampaignStats: { flexDirection:'row', gap:10, flexWrap:'wrap', justifyContent:'flex-end' },
  supportMiniStat: { minWidth:112, backgroundColor:GREEN+'12', borderRadius:16, paddingHorizontal:14, paddingVertical:14, alignItems:'flex-start' },
  supportMiniValue: { color:GREEN, fontSize:22, fontWeight:'900', marginBottom:4 },
  supportMiniLabel: { color:'#8A5A2B', fontSize:11, fontWeight:'600' },
  supportPriorityGrid: { flexDirection:'row', justifyContent:'space-between', gap:14, marginBottom:22 },
  supportPriorityCard: { borderWidth:1, borderRadius:18, padding:18 },
  supportPriorityIcon: { width:44, height:44, borderRadius:14, justifyContent:'center', alignItems:'center', backgroundColor:GREEN+'14', marginBottom:12 },
  supportPriorityTitle: { fontSize:15, fontWeight:'800', marginBottom:8 },
  supportPriorityText: { fontSize:13, lineHeight:21 },
  supportCampaignActions: { flexDirection:'row', gap:12, alignItems:'center' },
  supportPrimaryBtn: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:RED, paddingHorizontal:22, paddingVertical:13, borderRadius:13, borderWidth:1, borderColor:'#9A1220' },
  supportPrimaryBtnText: { color:'#FFFFFF', fontSize:14, fontWeight:'800' },
  supportSecondaryBtn: { alignItems:'center', justifyContent:'center', paddingHorizontal:22, paddingVertical:13, borderRadius:13, borderWidth:1.5 },
  supportSecondaryBtnText: { fontSize:14, fontWeight:'700' },

  // Features
  featuresGrid: { flexDirection:'row', flexWrap:'wrap', gap:16, justifyContent:'center', maxWidth:1100, width:'100%' },
  featureCard: { borderRadius:16, padding:24, borderWidth:1, alignItems:'flex-start', minWidth:220 },
  featureIconBox: { width:48, height:48, borderRadius:13, justifyContent:'center', alignItems:'center', marginBottom:14 },
  featureTitle: { fontSize:16, fontWeight:'700', marginBottom:7 },
  featureDesc: { fontSize:13, lineHeight:21 },

  // How It Works
  stepsRow: { flexDirection:'row', alignItems:'stretch', gap:0, maxWidth:960, width:'100%' },
  stepCard: { borderRadius:18, padding:28, borderWidth:1, alignItems:'center', position:'relative' },
  stepNumBadge: { position:'absolute', top:14, right:14, backgroundColor:GREEN+'15', borderRadius:7, paddingHorizontal:7, paddingVertical:2 },
  stepNum: { color:GREEN, fontSize:11, fontWeight:'800', letterSpacing:0.5 },
  stepIconCircle: { width:64, height:64, borderRadius:32, justifyContent:'center', alignItems:'center', marginBottom:16, marginTop:6 },
  stepTitle: { fontSize:17, fontWeight:'700', marginBottom:9, textAlign:'center' },
  stepDesc: { fontSize:13, lineHeight:21, textAlign:'center' },
  stepArrow: { alignSelf:'center', paddingHorizontal:6, paddingTop:10 },

  // Courses
  courseCard: { borderRadius:14, borderWidth:1, overflow:'hidden' },
  courseThumb: { width:'100%', height:120, justifyContent:'center', alignItems:'center' },
  courseCatBadge: { alignSelf:'flex-start', marginHorizontal:12, marginTop:10, paddingHorizontal:9, paddingVertical:3, borderRadius:7 },
  courseCatText: { fontSize:10, fontWeight:'700', letterSpacing:0.4 },
  courseInfo: { padding:12, paddingTop:7 },
  courseTitle: { fontSize:13, fontWeight:'700', lineHeight:19, marginTop:4 },
  courseInstructor: { fontSize:11 },
  courseFooter: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10 },
  courseEnroll: { fontSize:11 },
  enrollBtn: { backgroundColor:RED, paddingHorizontal:11, paddingVertical:5, borderRadius:7, borderWidth:1, borderColor:'#9A1220' },
  enrollBtnText: { color:'#FFFFFF', fontSize:11, fontWeight:'700', letterSpacing:0.1 },

  // Statistics
  statsSection: { paddingHorizontal:20, alignItems:'center', backgroundColor:NAVY },
  statsGrid: { flexDirection:'row', justifyContent:'center', maxWidth:860, width:'100%' },
  statBlock: { flex:1, alignItems:'center', paddingVertical:16, paddingHorizontal:12 },
  statIconCircle: { width:52, height:52, borderRadius:26, justifyContent:'center', alignItems:'center', marginBottom:12 },
  statBigValue: { fontSize:30, fontWeight:'900', color:'#FFFFFF', marginBottom:4, letterSpacing:-0.5 },
  statBigLabel: { fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:'500', textAlign:'center' },

  // FAQ
  faqItem: { borderRadius:13, borderWidth:1, padding:16, overflow:'hidden' },
  faqHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:10 },
  faqQuestion: { flex:1, fontSize:14, fontWeight:'600', lineHeight:21 },
  faqChevron: { width:28, height:28, borderRadius:7, justifyContent:'center', alignItems:'center' },
  faqAnswer: { fontSize:13, lineHeight:22, marginTop:10 },

  // CTA Banner
  ctaBanner: { paddingHorizontal:24, alignItems:'center', overflow:'hidden', backgroundColor:NAVY },
  ctaBlobLeft:  { position:'absolute', width:240, height:120, top:30,  left:-12 },
  ctaBlobRight: { position:'absolute', width:200, height:100, bottom:30, right:-12 },
  ctaTitle: { fontSize:34, fontWeight:'900', color:'#FFFFFF', textAlign:'center', marginBottom:12, letterSpacing:-0.5 },
  ctaSub: { fontSize:15, color:'rgba(255,255,255,0.7)', textAlign:'center', marginBottom:32 },
  ctaButtons: { flexDirection:'row', gap:12, alignItems:'center' },
  ctaPrimary: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:RED, paddingHorizontal:26, paddingVertical:14, borderRadius:13, borderWidth:1, borderColor:'#9A1220', shadowColor:'#9A1220', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:3 },
  ctaPrimaryText: { color:NAVY, fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaSecondary: { alignItems:'center', justifyContent:'center', paddingHorizontal:26, paddingVertical:13, borderRadius:13, borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)' },
  ctaSecondaryText: { color:'#FFFFFF', fontSize:15, fontWeight:'600' },

  // Contact
  contactCard: { borderRadius:18, borderWidth:1, alignSelf:'center' },
  contactRow: { flexDirection:'row', gap:14, marginBottom:2 },
  contactLabel: { fontSize:12, fontWeight:'600', marginBottom:6, marginTop:10, letterSpacing:0.2 },
  contactInput: { borderRadius:11, borderWidth:1.5, paddingHorizontal:13, paddingVertical:11, fontSize:13, marginBottom:2 },
  contactTextarea: { minHeight:110, paddingTop:11, marginBottom:16 },
  sendBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:RED, paddingVertical:13, borderRadius:11, borderWidth:1, borderColor:'#9A1220', shadowColor:'#9A1220', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:3 },
  sendBtnText: { color:NAVY, fontSize:14, fontWeight:'800', letterSpacing:0.1 },

  // Footer
  footer: { paddingTop:48, backgroundColor:NAVY },
  footerGrid: { flexDirection:'row', gap:36, marginBottom:36 },
  footerBrand: { flex:1.4, minWidth:200 },
  footerLogoImg: { width:36, height:36, borderRadius:8 },
  footerLogoName: { color:'#FFFFFF', fontSize:19, fontWeight:'800' },
  footerTagline: { color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:21, marginBottom:18 },
  footerSocials: { flexDirection:'row', gap:9 },
  socialBtn: { width:36, height:36, borderRadius:9, backgroundColor:'rgba(255,255,255,0.08)', justifyContent:'center', alignItems:'center' },
  footerCols: { flex:3, flexDirection:'row', gap:16, justifyContent:'space-between' },
  footerCol: { flex:1, minWidth:90 },
  footerColTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'700', marginBottom:14, letterSpacing:0.3 },
  footerLink: { color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:17 },
  footerBottom: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:18, borderTopWidth:1, flexWrap:'wrap', gap:10 },
  footerCopy: { color:'rgba(255,255,255,0.4)', fontSize:12 },
  footerBottomLink: { color:'rgba(255,255,255,0.45)', fontSize:12 },
});

export default LandingScreen;
