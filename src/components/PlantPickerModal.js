import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const STEP_AREAS = 'areas';
const STEP_CATEGORIES = 'categories';
const STEP_PLANTS = 'plants';

const PlantPickerModal = ({
  visible,
  onClose,
  onDone,
  multiSelect = false,
  asOverlay = false,
}) => {
  const { areas, getCategoriesForArea, getPlantsForAreaAndCategory } =
    useGarden();
  const [step, setStep] = useState(STEP_AREAS);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedPlants, setSelectedPlants] = useState([]);

  const categories = useMemo(
    () => (selectedAreaId ? getCategoriesForArea(selectedAreaId) : []),
    [selectedAreaId, getCategoriesForArea]
  );
  const plants = useMemo(
    () =>
      selectedAreaId && selectedCategoryId
        ? getPlantsForAreaAndCategory(selectedAreaId, selectedCategoryId)
        : [],
    [selectedAreaId, selectedCategoryId, getPlantsForAreaAndCategory]
  );

  const selectedArea = areas.find((a) => a._id === selectedAreaId);
  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  const resetAndClose = () => {
    setStep(STEP_AREAS);
    setSelectedAreaId(null);
    setSelectedCategoryId(null);
    setSelectedPlants([]);
    onClose();
  };

  const handleBack = () => {
    if (step === STEP_CATEGORIES) {
      setStep(STEP_AREAS);
      setSelectedAreaId(null);
    } else if (step === STEP_PLANTS) {
      setStep(STEP_CATEGORIES);
      setSelectedCategoryId(null);
    }
  };

  const handleDone = () => {
    onDone(multiSelect ? selectedPlants : selectedPlants.slice(0, 1));
    resetAndClose();
  };

  const handleAreaPress = (areaId) => {
    setSelectedAreaId(areaId);
    setStep(STEP_CATEGORIES);
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setStep(STEP_PLANTS);
  };

  const togglePlant = (plant) => {
    const exists = selectedPlants.some((p) => p._id === plant._id);
    if (exists) {
      setSelectedPlants((prev) => prev.filter((p) => p._id !== plant._id));
    } else {
      if (multiSelect) {
        setSelectedPlants((prev) => [...prev, plant]);
      } else {
        onDone([plant]);
        resetAndClose();
      }
    }
  };

  const isPlantSelected = (plant) =>
    selectedPlants.some((p) => p._id === plant._id);

  if (!visible) return null;

  const stepTitle =
    step === STEP_AREAS
      ? 'Choose area'
      : step === STEP_CATEGORIES
      ? selectedArea?.name || 'Choose folder'
      : selectedCategory?.name || 'Choose plant';

  const content = (
    <SafeAreaView style={[styles.container, asOverlay && styles.overlay]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={step === STEP_AREAS ? resetAndClose : handleBack}
            style={styles.headerBtn}
          >
            <Ionicons
              name={step === STEP_AREAS ? 'close' : 'arrow-back'}
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {stepTitle}
          </Text>
          {step === STEP_PLANTS && multiSelect && selectedPlants.length > 0 ? (
            <TouchableOpacity onPress={handleDone} style={styles.headerBtn}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {step === STEP_AREAS && (
            <View style={styles.list}>
              {areas.map((area) => (
                <TouchableOpacity
                  key={area._id}
                  style={styles.itemCard}
                  onPress={() => handleAreaPress(area._id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.itemEmoji}>{area.emoji || '🌿'}</Text>
                  <Text style={styles.itemName}>{area.name}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === STEP_CATEGORIES && (
            <View style={styles.list}>
              {categories
                .filter((cat) => cat.plantCount > 0)
                .map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.itemCard}
                    onPress={() => handleCategoryPress(cat._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.itemEmoji}>{cat.emoji || '📁'}</Text>
                    <View style={styles.itemNameBlock}>
                      <Text style={styles.itemName}>{cat.name}</Text>
                      <Text style={styles.itemSub}>
                        {cat.plantCount} plant{cat.plantCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {step === STEP_PLANTS && (
            <View style={styles.list}>
              {plants.map((plant) => {
                const selected = isPlantSelected(plant);
                return (
                  <TouchableOpacity
                    key={plant._id}
                    style={[styles.itemCard, selected && styles.itemCardSelected]}
                    onPress={() => togglePlant(plant)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.plantIcon,
                        selected && styles.plantIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="leaf"
                        size={22}
                        color={selected ? COLORS.white : COLORS.primary}
                      />
                    </View>
                    <Text style={styles.itemName}>{plant.name}</Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {step === STEP_PLANTS && multiSelect && selectedPlants.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>
                Done ({selectedPlants.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
  );

  if (asOverlay) return content;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  doneText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: 100,
  },
  list: {
    gap: SIZES.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  itemCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted + '15',
  },
  itemEmoji: {
    fontSize: 28,
    marginRight: SIZES.md,
  },
  itemNameBlock: {
    flex: 1,
  },
  itemName: {
    flex: 1,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemSub: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  plantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMuted + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  plantIconSelected: {
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default PlantPickerModal;
