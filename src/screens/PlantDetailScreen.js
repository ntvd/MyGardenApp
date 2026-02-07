import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const PlantDetailScreen = ({ route }) => {
  const { plantId } = route.params;
  const { getPlantById, addGrowthLog } = useGarden();
  const [plant, setPlantState] = useState(getPlantById(plantId));

  // Refresh plant data from context
  const refreshPlant = () => {
    setPlantState(getPlantById(plantId));
  };

  const handleAddPhoto = async () => {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert(
        'Permission needed',
        'Camera access is required to take plant photos.'
      );
      return;
    }

    Alert.alert('Add Growth Entry', 'Choose photo source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            saveGrowthEntry(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            saveGrowthEntry(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveGrowthEntry = (photoUri) => {
    const newLog = {
      _id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      photo: photoUri,
      note: 'New growth photo',
    };
    addGrowthLog(plantId, newLog);
    refreshPlant();
  };

  if (!plant) {
    return (
      <View style={styles.container}>
        <Text>Plant not found</Text>
      </View>
    );
  }

  const daysSincePlanted = Math.floor(
    (new Date() - new Date(plant.datePlanted)) / (1000 * 60 * 60 * 24)
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero section */}
      <View style={styles.heroSection}>
        {plant.growthLog.some((l) => l.photo) ? (
          <Image
            source={{
              uri: [...plant.growthLog]
                .reverse()
                .find((l) => l.photo)?.photo,
            }}
            style={styles.heroImage}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="leaf" size={56} color={COLORS.primaryMuted} />
            <Text style={styles.heroPlaceholderText}>
              Add your first photo!
            </Text>
          </View>
        )}
      </View>

      {/* Plant Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <View style={styles.infoHeaderLeft}>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantMeta}>
              Planted {plant.datePlanted} · {daysSincePlanted} days ago
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addPhotoBtn}
            onPress={handleAddPhoto}
          >
            <Ionicons name="camera" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{plant.description}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={18} color={COLORS.primary} />
          <Text style={styles.statValue}>{daysSincePlanted}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="camera" size={18} color={COLORS.accent} />
          <Text style={styles.statValue}>
            {plant.growthLog.filter((l) => l.photo).length}
          </Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={18} color={COLORS.success} />
          <Text style={styles.statValue}>{plant.growthLog.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
      </View>

      {/* Growth Timeline */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>Growth Timeline</Text>

        {plant.growthLog.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyText}>
              No growth entries yet. Tap the camera to add one!
            </Text>
          </View>
        ) : (
          [...plant.growthLog].reverse().map((log, index) => (
            <View key={log._id} style={styles.timelineItem}>
              {/* Timeline line */}
              <View style={styles.timelineLineContainer}>
                <View
                  style={[
                    styles.timelineDot,
                    index === 0 && styles.timelineDotActive,
                  ]}
                />
                {index < plant.growthLog.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              {/* Content */}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{log.date}</Text>
                {log.photo && (
                  <Image
                    source={{ uri: log.photo }}
                    style={styles.timelinePhoto}
                  />
                )}
                <Text style={styles.timelineNote}>{log.note}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Photo Grid (if there are photos) */}
      {plant.growthLog.some((l) => l.photo) && (
        <View style={styles.photoGridSection}>
          <Text style={styles.sectionTitle}>All Photos</Text>
          <View style={styles.photoGrid}>
            {plant.growthLog
              .filter((l) => l.photo)
              .map((log) => (
                <View key={log._id} style={styles.photoGridItem}>
                  <Image
                    source={{ uri: log.photo }}
                    style={styles.photoGridImage}
                  />
                  <Text style={styles.photoGridDate}>{log.date}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    height: 220,
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusXl,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryMuted + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginTop: SIZES.sm,
  },
  infoSection: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  infoHeaderLeft: {
    flex: 1,
  },
  plantName: {
    fontSize: SIZES.fontXxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  plantMeta: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addPhotoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  timelineSection: {
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SIZES.xs,
  },
  timelineLineContainer: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: SIZES.md,
    paddingLeft: SIZES.sm,
  },
  timelineDate: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  timelinePhoto: {
    width: '100%',
    height: 160,
    borderRadius: SIZES.radiusMd,
    resizeMode: 'cover',
    marginBottom: SIZES.xs,
  },
  timelineNote: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyTimeline: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  photoGridSection: {
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
  },
  photoGridItem: {
    width: '31.5%',
  },
  photoGridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: SIZES.radiusSm,
  },
  photoGridDate: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default PlantDetailScreen;
