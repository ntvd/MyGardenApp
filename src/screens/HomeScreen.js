import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const HomeScreen = ({ navigation }) => {
  const {
    areas,
    plants,
    categories,
    getRecentGrowthLogs,
    getUniqueVarietyCount,
    addArea,
    updateArea,
    deleteArea,
    notificationCount,
    clearNotificationCount,
  } = useGarden();
  const recentLogs = getRecentGrowthLogs().slice(0, 3);
  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    emoji: '🌿',
    coverColor: '#7CB342',
    coverImage: '',
  });

  const openNewArea = () => {
    setEditingAreaId(null);
    setAreaForm({
      name: '',
      description: '',
      emoji: '🌿',
      coverColor: '#7CB342',
      coverImage: '',
    });
    setIsAreaModalVisible(true);
  };

  const openEditArea = (area) => {
    setEditingAreaId(area._id);
    setAreaForm({
      name: area.name || '',
      description: area.description || '',
      emoji: area.emoji || '🌿',
      coverColor: area.coverColor || '#7CB342',
      coverImage: area.coverImage || '',
    });
    setIsAreaModalVisible(true);
  };

  const closeAreaModal = () => {
    setIsAreaModalVisible(false);
  };

  const handleSaveArea = () => {
    const trimmedName = areaForm.name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter an area name.');
      return;
    }

    const payload = {
      ...areaForm,
      name: trimmedName,
      description: areaForm.description.trim(),
      coverImage: areaForm.coverImage.trim() || null,
    };

    if (editingAreaId) {
      updateArea(editingAreaId, payload);
    } else {
      addArea(payload);
    }

    setIsAreaModalVisible(false);
  };

  const confirmDeleteArea = (area) => {
    Alert.alert('Delete area', `Remove ${area.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteArea(area._id),
      },
    ]);
  };

  const pickAreaImage = async (source) => {
    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Camera access is required to take a photo.'
          : 'Photo library access is required to choose a photo.'
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });

    if (!result.canceled && result.assets?.length) {
      setAreaForm((prev) => ({
        ...prev,
        coverImage: result.assets[0].uri,
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {/* Removed the "Good morning 🌱" text */}
            <Text style={styles.title}>My Garden</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              clearNotificationCount();
              navigation.navigate('HomeNotifications');
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.textSecondary}
            />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{areas.length}</Text>
            <Text style={styles.statLabel}>Areas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getUniqueVarietyCount()}</Text>
            <Text style={styles.statLabel}>Varieties</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plants</Text>
          </View>
        </View>

        {/* Garden Areas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Garden Areas</Text>
          <TouchableOpacity
            style={styles.addAreaBtn}
            onPress={openNewArea}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.addAreaText}>New</Text>
          </TouchableOpacity>
        </View>
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
                {area.coverImage ? (
                  <Image
                    source={{ uri: area.coverImage }}
                    style={styles.areaImage}
                  />
                ) : (
                  <Text style={styles.areaEmoji}>{area.emoji}</Text>
                )}
              </View>
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaDescription}>{area.description}</Text>
              </View>
              <View style={styles.areaActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => openEditArea(area)}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => confirmDeleteArea(area)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
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

      <Modal
        visible={isAreaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAreaModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingAreaId ? 'Edit Area' : 'New Area'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={areaForm.name}
                onChangeText={(text) =>
                  setAreaForm((prev) => ({ ...prev, name: text }))
                }
                placeholder="e.g. Herb Corner"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={areaForm.description}
                onChangeText={(text) =>
                  setAreaForm((prev) => ({ ...prev, description: text }))
                }
                placeholder="Short description"
                placeholderTextColor={COLORS.textLight}
                multiline
              />

              <Text style={styles.inputLabel}>Emoji</Text>
              <TextInput
                style={styles.textInput}
                value={areaForm.emoji}
                onChangeText={(text) =>
                  setAreaForm((prev) => ({ ...prev, emoji: text }))
                }
                placeholder="🌿"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.inputLabel}>Cover Color</Text>
              <TextInput
                style={styles.textInput}
                value={areaForm.coverColor}
                onChangeText={(text) =>
                  setAreaForm((prev) => ({ ...prev, coverColor: text }))
                }
                placeholder="#7CB342"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.inputLabel}>Cover Image</Text>
              <View style={styles.imagePickerRow}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => pickAreaImage('camera')}
                >
                  <Ionicons name="camera" size={18} color={COLORS.primary} />
                  <Text style={styles.imagePickerText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => pickAreaImage('gallery')}
                >
                  <Ionicons name="images" size={18} color={COLORS.primary} />
                  <Text style={styles.imagePickerText}>Gallery</Text>
                </TouchableOpacity>
                {areaForm.coverImage ? (
                  <TouchableOpacity
                    style={[styles.imagePickerBtn, styles.removeImageBtn]}
                    onPress={() =>
                      setAreaForm((prev) => ({ ...prev, coverImage: '' }))
                    }
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={COLORS.error}
                    />
                    <Text
                      style={[styles.imagePickerText, styles.removeImageText]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>


              {areaForm.coverImage ? (
                <Image
                  source={{ uri: areaForm.coverImage }}
                  style={styles.imagePreview}
                />
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={closeAreaModal}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalPrimary]}
                onPress={handleSaveArea}
              >
                <Text style={[styles.modalBtnText, styles.modalPrimaryText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    alignItems: 'center',
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: '700',
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
    marginTop: SIZES.sm,
  },
  addAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primaryMuted + '25',
  },
  addAreaText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    fontWeight: '600',
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
    overflow: 'hidden',
  },
  areaEmoji: {
    fontSize: 26,
  },
  areaImage: {
    width: '100%',
    height: '100%',
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
  areaActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '12',
  },
  activityContainer: {
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
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
    maxHeight: '85%',
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
  imagePreview: {
    height: 120,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
    backgroundColor: COLORS.backgroundDark,
  },
  imagePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.sm,
    marginTop: SIZES.md,
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

export default HomeScreen;