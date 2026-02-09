import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const EVENT_TYPE_INFO = {
  water: { label: 'Watered', icon: 'water', color: '#3498DB' },
  fertilize: { label: 'Fertilized', icon: 'leaf', color: '#27AE60' },
  prune: { label: 'Pruned', icon: 'cut', color: '#E67E22' },
  harvest: { label: 'Harvested', icon: 'basket', color: '#E74C3C' },
  weed: { label: 'Weeded', icon: 'leaf-outline', color: '#95A5A6' },
  other: { label: 'Other', icon: 'create', color: '#9B59B6' },
};

const PlantDetailScreen = ({ route, navigation }) => {
  const { plantId } = route.params;
  const { getPlantById, addGrowthLog, deleteGrowthLog, deletePlant, getEventsForPlant } =
    useGarden();
  const [plant, setPlantState] = useState(getPlantById(plantId));
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [entryNote, setEntryNote] = useState('');
  const [entryPhoto, setEntryPhoto] = useState(null);
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const photoItems = plant?.growthLog.filter((log) => log.photo) || [];
  const screenWidth = Dimensions.get('window').width;
  const plantEvents = getEventsForPlant(plantId);

  const formatEventDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Refresh plant data from context
  const refreshPlant = () => {
    setPlantState(getPlantById(plantId));
  };

  const openEntryModal = () => {
    setEntryNote('');
    setEntryPhoto(null);
    setIsEntryModalVisible(true);
  };

  const closeEntryModal = () => {
    setIsEntryModalVisible(false);
  };

  const pickEntryImage = async (source) => {
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
      setEntryPhoto(result.assets[0].uri);
    }
  };

  const saveGrowthEntry = () => {
    if (!entryNote.trim() && !entryPhoto) {
      Alert.alert('Add details', 'Write a note or add a photo.');
      return;
    }

    const newLog = {
      _id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      photo: entryPhoto,
      note: entryNote.trim() || 'New growth entry',
    };
    addGrowthLog(plantId, newLog);
    refreshPlant();
    setIsEntryModalVisible(false);
  };

  const confirmDeleteLog = (logId) => {
    Alert.alert('Delete entry', 'Remove this growth entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGrowthLog(plantId, logId);
          refreshPlant();
        },
      },
    ]);
  };

  const confirmDeletePlant = () => {
    Alert.alert('Delete plant', `Remove ${plant.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlant(plantId);
          navigation.goBack();
        },
      },
    ]);
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={openEntryModal}
            >
              <Ionicons name="create" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addPhotoBtn, styles.deleteBtn]}
              onPress={confirmDeletePlant}
            >
              <Ionicons name="trash" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
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
                <View style={styles.timelineHeaderRow}>
                  <Text style={styles.timelineDate}>{log.date}</Text>
                  <TouchableOpacity
                    style={styles.entryDeleteBtn}
                    onPress={() => confirmDeleteLog(log._id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>
                {log.photo && (
                  <TouchableOpacity
                    onPress={() => {
                      const index = photoItems.findIndex(
                        (item) => item._id === log._id
                      );
                      setSelectedPhotoIndex(Math.max(index, 0));
                      setIsPhotoViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: log.photo }}
                      style={styles.timelinePhoto}
                    />
                  </TouchableOpacity>
                )}
                <Text style={styles.timelineNote}>{log.note}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Event feed (actions that apply to this plant) */}
      <View style={styles.eventFeedSection}>
        <Text style={styles.sectionTitle}>Event feed</Text>
        {plantEvents.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyText}>
              No events for this plant yet. Add events from the Actions tab.
            </Text>
          </View>
        ) : (
          plantEvents.map((ev) => {
            const typeInfo = EVENT_TYPE_INFO[ev.type] || EVENT_TYPE_INFO.other;
            return (
              <View key={ev._id} style={styles.eventFeedItem}>
                <View
                  style={[
                    styles.eventFeedIcon,
                    { backgroundColor: typeInfo.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={typeInfo.icon}
                    size={18}
                    color={typeInfo.color}
                  />
                </View>
                <View style={styles.eventFeedContent}>
                  <Text style={styles.eventFeedLabel}>
                    {ev.title || typeInfo.label}
                  </Text>
                  {ev.description ? (
                    <Text style={styles.eventFeedDescription} numberOfLines={2}>
                      {ev.description}
                    </Text>
                  ) : null}
                  <Text style={styles.eventFeedTime}>
                    {formatEventDateTime(ev.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
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
                <TouchableOpacity
                  key={log._id}
                  style={styles.photoGridItem}
                  onPress={() => {
                    const index = photoItems.findIndex(
                      (item) => item._id === log._id
                    );
                    setSelectedPhotoIndex(Math.max(index, 0));
                    setIsPhotoViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: log.photo }}
                    style={styles.photoGridImage}
                  />
                  <Text style={styles.photoGridDate}>{log.date}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />

      <Modal
        visible={isEntryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEntryModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Growth Entry</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={entryNote}
              onChangeText={setEntryNote}
              placeholder="Add a note about growth"
              placeholderTextColor={COLORS.textLight}
              multiline
            />

            <View style={styles.imagePickerRow}>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={() => pickEntryImage('camera')}
              >
                <Ionicons name="camera" size={18} color={COLORS.primary} />
                <Text style={styles.imagePickerText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={() => pickEntryImage('gallery')}
              >
                <Ionicons name="images" size={18} color={COLORS.primary} />
                <Text style={styles.imagePickerText}>Gallery</Text>
              </TouchableOpacity>
              {entryPhoto ? (
                <TouchableOpacity
                  style={[styles.imagePickerBtn, styles.removeImageBtn]}
                  onPress={() => setEntryPhoto(null)}
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

            {entryPhoto ? (
              <Image
                source={{ uri: entryPhoto }}
                style={styles.entryPreview}
              />
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={closeEntryModal}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalPrimary]}
                onPress={saveGrowthEntry}
              >
                <Text style={[styles.modalBtnText, styles.modalPrimaryText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isPhotoViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoViewerVisible(false)}
      >
        <View style={styles.photoViewerBackdrop}>
          <FlatList
            data={photoItems}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedPhotoIndex}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.photoViewerPage, { width: screenWidth }]}
                onPress={() => setIsPhotoViewerVisible(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {}}
                  style={styles.photoFrame}
                >
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.photoViewerImage}
                  />
                </TouchableOpacity>
              </Pressable>
            )}
          />
          <TouchableOpacity
            style={styles.photoViewerClose}
            onPress={() => setIsPhotoViewerVisible(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
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
  deleteBtn: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
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
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineDate: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  entryDeleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
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
  eventFeedSection: {
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
  },
  eventFeedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventFeedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  eventFeedContent: {
    flex: 1,
  },
  eventFeedLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  eventFeedDescription: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventFeedTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    marginTop: 2,
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
  textInput: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginTop: SIZES.md,
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
  entryPreview: {
    height: 140,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
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
  photoViewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoViewerPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFrame: {
    width: '90%',
    height: '70%',
  },
  photoViewerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PlantDetailScreen;
