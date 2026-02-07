import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const AreaScreen = ({ route, navigation }) => {
  const { areaId, areaName } = route.params;
  const { getCategoriesForArea, areas } = useGarden();
  const categories = getCategoriesForArea(areaId);
  const area = areas.find((a) => a._id === areaId);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Area Header */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: (area?.coverColor || COLORS.primary) + '15' },
        ]}
      >
        <Text style={styles.heroEmoji}>{area?.emoji || '🌱'}</Text>
        <Text style={styles.heroDescription}>
          {area?.description || 'Your garden area'}
        </Text>
      </View>

      {/* Categories (Folders) */}
      <Text style={styles.sectionTitle}>Plant Categories</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={styles.categoryCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Category', {
                areaId,
                categoryId: cat._id,
                categoryName: cat.name,
                areaName,
              })
            }
          >
            <View style={styles.folderIcon}>
              <Ionicons
                name="folder"
                size={36}
                color={
                  cat.plantCount > 0
                    ? COLORS.accent
                    : COLORS.textLight
                }
              />
              {cat.plantCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cat.plantCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
            <Text style={styles.categoryCount}>
              {cat.plantCount} {cat.plantCount === 1 ? 'plant' : 'plants'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add New Category button */}
        <TouchableOpacity style={styles.addCard} activeOpacity={0.7}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={28} color={COLORS.textLight} />
          </View>
          <Text style={styles.addText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroCard: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: SIZES.sm,
  },
  heroDescription: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  folderIcon: {
    marginBottom: SIZES.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: SIZES.xs,
  },
  categoryName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  addCard: {
    width: '47%',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    minHeight: 140,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  addText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});

export default AreaScreen;
