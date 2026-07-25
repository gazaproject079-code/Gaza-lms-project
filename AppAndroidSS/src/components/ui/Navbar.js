import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Animated, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';

const LOGO = require('../../assets/images/gazarise_logo.png');
const GREEN = '#007A3D';
const RED = '#CE1126';
const NAVY = '#0F1923';

const Navbar = ({ navigation, isDark, isMobile, isDesktop, showBack }) => {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    closeMenu();
    logout();
    navigation.navigate('Landing');
  };

  const MobileDropdown = () => (
    <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
      <TouchableOpacity style={[styles.modalBackdrop, isWeb && { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }]} onPress={closeMenu} activeOpacity={1}>
        <Animated.View style={[
          styles.dropdownCard,
          {
            backgroundColor: isDark ? '#162032' : '#FFFFFF',
            borderColor: isDark ? 'rgba(0,122,61,0.25)' : 'rgba(0,122,61,0.2)',
            top: 70,
            opacity: menuAnim,
            transform: [
              { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
              { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            ],
          },
        ]}>
          <View style={styles.dropdownItem}>
            <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(124,111,205,0.15)' }]}>
              <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color="#7C6FCD" />
            </View>
            <Text style={[styles.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <ThemeToggle iconColor={isDark ? '#F5C842' : '#7C6FCD'} />
          </View>

          <View style={[styles.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

          <TouchableOpacity style={styles.dropdownItem} onPress={() => { closeMenu(); navigation.navigate('ExploreCourses'); }} activeOpacity={0.7}>
            <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(0,122,61,0.1)' }]}>
              <Icon name="compass-outline" size={18} color={GREEN} />
            </View>
            <Text style={[styles.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Explore Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownItem} onPress={() => { closeMenu(); navigation.navigate('GazaEducationSupport'); }} activeOpacity={0.7}>
            <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(0,122,61,0.1)' }]}>
              <Icon name="heart-outline" size={18} color={GREEN} />
            </View>
            <Text style={[styles.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Support Gaza</Text>
          </TouchableOpacity>

          {!user && (
            <>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { closeMenu(); navigation.navigate('Login'); }} activeOpacity={0.7}>
                <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(0,122,61,0.1)' }]}>
                  <Icon name="log-in-outline" size={18} color={GREEN} />
                </View>
                <Text style={[styles.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownItem, styles.getStartedRow]} onPress={() => { closeMenu(); navigation.navigate('Signup'); }} activeOpacity={0.7}>
                <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Icon name="rocket-outline" size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.dropdownItemLabel, { color: '#FFFFFF', fontWeight: '800' }]}>Get Started</Text>
              </TouchableOpacity>
            </>
          )}

          {user && (
            <>
              <View style={[styles.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />
              <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout} activeOpacity={0.7}>
                <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Icon name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.dropdownItemLabel, { color: isDark ? 'rgba(255,255,255,0.85)' : NAVY }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const stickyStyle = isWeb ? { position: 'sticky', top: 0, zIndex: 999 } : {};

  const Inner = () => (
    <View style={styles.content}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => navigation.navigate('Landing')}>
          <Image source={LOGO} style={styles.logoImg} resizeMode="cover" />
          <Text style={styles.logoText}>
            GAZA<Text style={{ color: RED }}>RISE</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        {!isMobile && (
          <>
            <ThemeToggle iconColor="#FFFFFF" />
            <TouchableOpacity style={styles.supportBtn} onPress={() => navigation.navigate('GazaEducationSupport')}>
              <Icon name="heart-outline" size={14} color="#FFFFFF" />
              <Text style={styles.supportText}>Support Gaza</Text>
            </TouchableOpacity>
            {!user ? (
              <>
                <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.getStartedBtn} onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.signInBtn} onPress={handleLogout}>
                <Text style={styles.signInText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {isMobile && (
          <TouchableOpacity onPress={menuOpen ? closeMenu : openMenu} style={[styles.menuTrigger, menuOpen && styles.menuTriggerOpen]} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ rotate: menuAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
              <Icon name={menuOpen ? 'close' : 'menu'} size={20} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isWeb) {
    return (
      <>
        <View style={[styles.container, { background: 'linear-gradient(135deg, #0F1923 0%, #007A3D 100%)' }, stickyStyle]}>
          <Inner />
        </View>
        {isMobile && <MobileDropdown />}
      </>
    );
  }

  const LG = require('react-native-linear-gradient').default;
  return (
    <>
      <LG colors={['#0F1923', '#007A3D']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Inner />
      </LG>
      {isMobile && <MobileDropdown />}
    </>
  );
};

const styles = StyleSheet.create({
  container: { height: 62, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 10 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 46, height: 46, borderRadius: 13 },
  logoText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 1.2 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(206,17,38,0.18)', borderWidth: 1, borderColor: 'rgba(206,17,38,0.4)' },
  supportText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  signInBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  signInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  getStartedBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: RED, borderWidth: 1, borderColor: '#9A1220', shadowColor: '#9A1220', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  getStartedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  menuTrigger: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,122,61,0.25)', borderWidth: 1.5, borderColor: 'rgba(0,200,83,0.5)' },
  menuTriggerOpen: { backgroundColor: 'rgba(0,122,61,0.45)', borderColor: GREEN },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(7,16,21,0.55)' },
  dropdownCard: { position: 'absolute', right: 12, width: 230, borderRadius: 20, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 6, marginVertical: 1, borderRadius: 12, gap: 12 },
  dropdownItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,122,61,0.12)' },
  dropdownItemLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  dropdownDivider: { height: 1, marginVertical: 4, marginHorizontal: 12 },
  getStartedRow: { backgroundColor: RED, marginHorizontal: 10, marginBottom: 6, borderWidth: 1, borderColor: '#9A1220', shadowColor: '#9A1220', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
});

export default Navbar;
