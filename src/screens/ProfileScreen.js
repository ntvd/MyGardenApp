import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const ProfileScreen = ({ navigation }) => {
  const { plants, areas } = useGarden();
  const totalPhotos = plants.reduce(
    (acc, p) => acc + p.growthLog.filter((l) => l.photo).length,
    0
  );
  const totalEntries = plants.reduce(
    (acc, p) => acc + p.growthLog.length,
    0
  );

  const menuItems = [
    { icon: 'notifications-outline', label: 'Reminders', subtitle: 'Set watering & care alerts', screen: 'Reminders' },
    { icon: 'analytics-outline', label: 'Garden Stats', subtitle: 'View growth analytics', screen: null },
    { icon: 'cloud-upload-outline', label: 'Backup & Sync', subtitle: 'Connect to cloud storage', screen: null },
    { icon: 'share-outline', label: 'Share Garden', subtitle: 'Share with friends & family', screen: null },
    { icon: 'moon-outline', label: 'Appearance', subtitle: 'Theme & display settings', screen: null },
    { icon: 'help-circle-outline', label: 'Help & Tips', subtitle: 'Gardening guides & FAQ', screen: null },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={COLORS.primaryMuted} />
          </View>
          <Text style={styles.username}>Garden Lover</Text>
          <Text style={styles.memberSince}>Growing since March 2025</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{areas.length}</Text>
            <Text style={styles.statLabel}>Areas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plants</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
  },
  title: {
    fontSize: SIZES.fontDisplay,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SIZES.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryMuted + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  username: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  memberSince: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: SIZES.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  menuSection: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryMuted + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ProfileScreen;
