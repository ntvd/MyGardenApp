import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const PlantCard = ({ plant, onPress }) => {
  const latestLog = plant.growthLog[plant.growthLog.length - 1];
  const hasPhoto = latestLog?.photo;

  return (
    <TouchableOpacity
      style={styles.plantCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.plantImageContainer}>
        {hasPhoto ? (
          <Image source={{ uri: latestLog.photo }} style={styles.plantImage} />
        ) : (
          <View style={styles.plantPlaceholder}>
            <Ionicons name="leaf" size={32} color={COLORS.primaryMuted} />
          </View>
        )}
        <View style={styles.logCountBadge}>
          <Ionicons name="camera" size={10} color={COLORS.white} />
          <Text style={styles.logCountText}>{plant.growthLog.length}</Text>
        </View>
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName} numberOfLines={1}>
          {plant.name}
        </Text>
        <Text style={styles.plantDate}>
          Planted {plant.datePlanted}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const CategoryScreen = ({ route, navigation }) => {
  const { areaId, categoryId, categoryName } = route.params;
  const { getPlantsForAreaAndCategory, categories } = useGarden();
  const plants = getPlantsForAreaAndCategory(areaId, categoryId);
  const category = categories.find((c) => c._id === categoryId);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Category header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerEmoji}>{category?.emoji || '🌱'}</Text>
        <Text style={styles.headerSubtitle}>
          {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
        </Text>
      </View>

      {/* Plants Grid */}
      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="flower-outline"
            size={48}
            color={COLORS.textLight}
          />
          <Text style={styles.emptyTitle}>No plants yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first {categoryName?.toLowerCase()} to start tracking!
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Plant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.plantsGrid}>
          {plants.map((plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onPress={() =>
                navigation.navigate('PlantDetail', {
                  plantId: plant._id,
                  plantName: plant.name,
                })
              }
            />
          ))}

          {/* Add plant card */}
          <TouchableOpacity style={styles.addPlantCard} activeOpacity={0.7}>
            <Ionicons name="add-circle" size={36} color={COLORS.textLight} />
            <Text style={styles.addPlantText}>Add Plant</Text>
          </TouchableOpacity>
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
  headerRow: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  headerEmoji: {
    fontSize: 36,
    marginBottom: SIZES.xs,
  },
  headerSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  plantCard: {
    width: '47%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  plantImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  plantPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryMuted + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCountBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  logCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  plantInfo: {
    padding: SIZES.sm,
  },
  plantName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  plantDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addPlantCard: {
    width: '47%',
    height: 175,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addPlantText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: SIZES.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xs,
    marginBottom: SIZES.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm + 2,
    gap: SIZES.xs,
  },
  addButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CategoryScreen;
