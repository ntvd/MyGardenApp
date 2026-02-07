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

const HomeScreen = ({ navigation }) => {
  const { areas, getRecentGrowthLogs } = useGarden();
  const recentLogs = getRecentGrowthLogs().slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 🌱</Text>
            <Text style={styles.title}>My Garden</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{areas.length}</Text>
            <Text style={styles.statLabel}>Areas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Plants</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recentLogs.length}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>

        {/* Garden Areas */}
        <Text style={styles.sectionTitle}>Garden Areas</Text>
        <View style={styles.areasContainer}>
          {areas.map((area) => (
            <TouchableOpacity
              key={area._id}
              style={styles.areaCard}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Area', {
                  areaId: area._id,
                  areaName: area.name,
                })
              }
            >
              <View
                style={[
                  styles.areaEmojiContainer,
                  { backgroundColor: area.coverColor + '20' },
                ]}
              >
                <Text style={styles.areaEmoji}>{area.emoji}</Text>
              </View>
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaDescription}>{area.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="leaf-outline"
                size={40}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyText}>
                No activity yet. Start tracking your plants!
              </Text>
            </View>
          ) : (
            recentLogs.map((log, index) => (
              <TouchableOpacity
                key={log._id}
                style={[
                  styles.activityItem,
                  index < recentLogs.length - 1 && styles.activityBorder,
                ]}
                onPress={() =>
                  navigation.navigate('PlantDetail', {
                    plantId: log.plantId,
                    plantName: log.plantName,
                  })
                }
              >
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityPlant}>{log.plantName}</Text>
                  <Text style={styles.activityNote}>{log.note}</Text>
                  <Text style={styles.activityDate}>{log.date}</Text>
                </View>
                {log.photo && (
                  <View style={styles.activityThumb}>
                    <Ionicons
                      name="image"
                      size={16}
                      color={COLORS.primaryMuted}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  greeting: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: SIZES.fontDisplay,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    marginTop: SIZES.sm,
  },
  areasContainer: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  areaCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  areaEmojiContainer: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  areaEmoji: {
    fontSize: 26,
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  areaDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  activityContainer: {
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SIZES.sm,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginTop: 6,
    marginRight: SIZES.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityPlant: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activityNote: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    marginTop: 4,
  },
  activityThumb: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryMuted + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  emptyText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
});

export default HomeScreen;
