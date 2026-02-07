import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const { getPlantsForAreaAndCategory, categories, addPlant } = useGarden();
  const plants = getPlantsForAreaAndCategory(areaId, categoryId);
  const category = categories.find((c) => c._id === categoryId);
  const [isPlantModalVisible, setIsPlantModalVisible] = useState(false);
  const [plantForm, setPlantForm] = useState({ name: '', description: '' });
  const [plantPhoto, setPlantPhoto] = useState(null);

  const openNewPlant = () => {
    setPlantForm({ name: '', description: '' });
    setPlantPhoto(null);
    setIsPlantModalVisible(true);
  };

  const closePlantModal = () => {
    setIsPlantModalVisible(false);
  };

  const handleSavePlant = () => {
    const trimmedName = plantForm.name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a plant name.');
      return;
    }

    addPlant({
      name: trimmedName,
      description: plantForm.description.trim(),
      area: areaId,
      category: categoryId,
      initialPhoto: plantPhoto,
    });

    setIsPlantModalVisible(false);
  };

  const pickPlantImage = async (source) => {
    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Camera access is required to take plant photos.'
          : 'Photo library access is required to choose photos.'
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

    if (!result.canceled && result.assets?.length) {
      setPlantPhoto(result.assets[0].uri);
    }
  };

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
          <TouchableOpacity style={styles.addButton} onPress={openNewPlant}>
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
          <TouchableOpacity
            style={styles.addPlantCard}
            activeOpacity={0.7}
            onPress={openNewPlant}
          >
            <Ionicons name="add-circle" size={36} color={COLORS.textLight} />
            <Text style={styles.addPlantText}>Add Plant</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />

      <Modal
        visible={isPlantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePlantModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Plant</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={plantForm.name}
              onChangeText={(text) =>
                setPlantForm((prev) => ({ ...prev, name: text }))
              }
              placeholder="e.g. Rosemary"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={plantForm.description}
              onChangeText={(text) =>
                setPlantForm((prev) => ({ ...prev, description: text }))
              }
              placeholder="Short description"
              placeholderTextColor={COLORS.textLight}
              multiline
            />

            <Text style={styles.inputLabel}>Photo</Text>
            <View style={styles.imagePickerRow}>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={() => pickPlantImage('camera')}
              >
                <Ionicons name="camera" size={18} color={COLORS.primary} />
                <Text style={styles.imagePickerText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={() => pickPlantImage('gallery')}
              >
                <Ionicons name="images" size={18} color={COLORS.primary} />
                <Text style={styles.imagePickerText}>Gallery</Text>
              </TouchableOpacity>
              {plantPhoto ? (
                <TouchableOpacity
                  style={[styles.imagePickerBtn, styles.removeImageBtn]}
                  onPress={() => setPlantPhoto(null)}
                >
                  <Ionicons name="close" size={18} color={COLORS.error} />
                  <Text
                    style={[styles.imagePickerText, styles.removeImageText]}
                  >
                    Remove
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {plantPhoto ? (
              <Image source={{ uri: plantPhoto }} style={styles.photoPreview} />
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={closePlantModal}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalPrimary]}
                onPress={handleSavePlant}
              >
                <Text style={[styles.modalBtnText, styles.modalPrimaryText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: SIZES.sm,
  },
  textInput: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  imagePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginTop: SIZES.xs,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryMuted + '25',
  },
  imagePickerText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  removeImageBtn: {
    backgroundColor: COLORS.error + '12',
  },
  removeImageText: {
    color: COLORS.error,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
  },
  modalBtn: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundCard,
  },
  modalBtnText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalPrimaryText: {
    color: COLORS.white,
  },
});

export default CategoryScreen;
