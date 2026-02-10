import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';
import PlantPickerModal from '../components/PlantPickerModal';

const EVENT_TYPES = [
  { id: 'water', label: 'Watered', icon: 'water', color: '#3498DB' },
  { id: 'fertilize', label: 'Fertilized', icon: 'leaf', color: '#27AE60' },
  { id: 'prune', label: 'Pruned', icon: 'cut', color: '#E67E22' },
  { id: 'harvest', label: 'Harvested', icon: 'basket', color: '#E74C3C' },
  { id: 'weed', label: 'Weeded', icon: 'leaf-outline', color: '#95A5A6' },
  { id: 'other', label: 'Other', icon: 'create', color: '#9B59B6' },
];

const formatEventTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActionsScreen = () => {
  const {
    areas,
    plants,
    getPlantById,
    getAllEvents,
    addEvent,
  } = useGarden();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  // null = nothing selected (saved as "all"); 'all' | { type: 'area', area } | { type: 'plants', plants: [] }
  const [plantScope, setPlantScope] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const toggleAll = () => {
    setPlantScope((prev) => (prev === 'all' ? null : 'all'));
  };
  const toggleArea = (area) => {
    setPlantScope((prev) =>
      prev?.type === 'area' && prev.area._id === area._id
        ? null
        : { type: 'area', area }
    );
  };
  const removePickedPlant = (plantId) => {
    setPlantScope((prev) => {
      if (prev?.type !== 'plants') return prev;
      const next = prev.plants.filter((p) => p._id !== plantId);
      return next.length > 0 ? { type: 'plants', plants: next } : null;
    });
  };

  const allEvents = getAllEvents();

  const handleSaveEvent = () => {
    if (!selectedType) return;
    const payload = {
      type: selectedType,
      title: eventTitle.trim() || undefined,
      description: eventDescription.trim() || undefined,
    };
    if (!plantScope || plantScope === 'all') {
      // nothing selected or "all" = event for all plants
    } else if (plantScope.type === 'area') {
      payload.areaId = plantScope.area._id;
    } else if (plantScope.type === 'plants' && plantScope.plants.length > 0) {
      payload.plantIds = plantScope.plants.map((p) => p._id);
    }
    addEvent(payload);
    setShowAddModal(false);
    setSelectedType(null);
    setPlantScope(null);
    setEventTitle('');
    setEventDescription('');
  };

  const getEventScopeLabel = (ev) => {
    if (ev.areaId) {
      const area = areas.find((a) => a._id === ev.areaId);
      return area?.name || 'Area';
    }
    if (ev.plantIds && ev.plantIds.length > 0) {
      const names = ev.plantIds
        .map((id) => getPlantById(id)?.name)
        .filter(Boolean);
      return names.length === 1 ? names[0] : `${names.length} plants`;
    }
    return 'All plants';
  };

  const getTypeInfo = (typeId) =>
    EVENT_TYPES.find((t) => t.id === typeId) || EVENT_TYPES[5];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Actions</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add event</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent events</Text>
        {allEvents.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add event" to log watering, fertilizing, and more.
            </Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {allEvents.map((ev) => {
              const typeInfo = getTypeInfo(ev.type);
              return (
                <View key={ev._id} style={styles.eventCard}>
                  <View
                    style={[
                      styles.eventIcon,
                      { backgroundColor: typeInfo.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={typeInfo.icon}
                      size={22}
                      color={typeInfo.color}
                    />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventLabel}>
                      {ev.title || typeInfo.label}
                    </Text>
                    {ev.description ? (
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {ev.description}
                      </Text>
                    ) : null}
                    <Text style={styles.eventScope}>
                      {getEventScopeLabel(ev)}
                    </Text>
                    <Text style={styles.eventTime}>
                      {formatEventTime(ev.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setSelectedType(null);
                setPlantScope(null);
                setEventTitle('');
                setEventDescription('');
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add event</Text>
            <TouchableOpacity
              onPress={handleSaveEvent}
              disabled={!selectedType}
            >
              <Text
                style={[
                  styles.modalSave,
                  !selectedType && styles.modalSaveDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBodyContent}
          >
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.modalTextInput}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Add a title"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.modalTextInput, styles.modalTextArea]}
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="e.g. fertilized with nitrogen"
              placeholderTextColor={COLORS.textLight}
              multiline
            />

            <Text style={styles.formLabel}>What did you do?</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeChip,
                    selectedType === type.id && {
                      backgroundColor: type.color + '20',
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={selectedType === type.id ? type.color : COLORS.textLight}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      selectedType === type.id && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Where?</Text>
            <View style={styles.scopeChipWrap}>
              <TouchableOpacity
                style={[
                  styles.scopeChip,
                  plantScope === 'all' && styles.scopeChipSelected,
                ]}
                onPress={toggleAll}
              >
                <Text
                  style={[
                    styles.scopeChipText,
                    plantScope === 'all' && styles.scopeChipTextSelected,
                  ]}
                >
                  All plants
                </Text>
                {plantScope === 'all' && (
                  <View style={styles.chipClose}>
                    <Ionicons name="close" size={10} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
              {areas.map((area) => {
                const selected =
                  plantScope?.type === 'area' &&
                  plantScope.area._id === area._id;
                return (
                  <TouchableOpacity
                    key={area._id}
                    style={[
                      styles.scopeChip,
                      selected && styles.scopeChipSelected,
                    ]}
                    onPress={() => toggleArea(area)}
                  >
                    <Text
                      style={[
                        styles.scopeChipText,
                        selected && styles.scopeChipTextSelected,
                      ]}
                    >
                      {area.name}
                    </Text>
                    {selected && (
                      <View style={styles.chipClose}>
                        <Ionicons name="close" size={10} color={COLORS.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {plantScope?.type === 'plants' &&
                plantScope.plants.map((plant) => (
                  <TouchableOpacity
                    key={plant._id}
                    style={[styles.scopeChip, styles.scopeChipSelected]}
                    onPress={() => removePickedPlant(plant._id)}
                  >
                    <Text
                      style={[
                        styles.scopeChipText,
                        styles.scopeChipTextSelected,
                      ]}
                    >
                      {plant.name}
                    </Text>
                    <View style={styles.chipClose}>
                      <Ionicons name="close" size={10} color={COLORS.white} />
                    </View>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                style={[styles.scopeChip, styles.choosePlantBtn]}
                onPress={() => setShowPlantPicker(true)}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={[styles.scopeChipText, { color: COLORS.primary }]}>
                  Choose plant(s)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {showPlantPicker && (
            <View style={StyleSheet.absoluteFill}>
              <PlantPickerModal
                visible
                asOverlay
                onClose={() => setShowPlantPicker(false)}
                onDone={(selected) => {
                  setPlantScope(
                    selected.length > 0
                      ? { type: 'plants', plants: selected }
                      : null
                  );
                  setShowPlantPicker(false);
                }}
                multiSelect
              />
            </View>
          )}
        </SafeAreaView>
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
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.sm,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  addButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
  },
  emptyTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  emptySubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SIZES.lg,
  },
  eventList: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  eventContent: {
    flex: 1,
  },
  eventLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  eventDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventScope: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalSave: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalSaveDisabled: {
    color: COLORS.textLight,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: SIZES.lg,
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
    marginTop: SIZES.sm,
  },
  modalTextInput: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
  },
  modalTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    gap: SIZES.xs,
  },
  typeChipText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  scopeChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  scopeChip: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingRight: 22,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  scopeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  scopeChipText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  scopeChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  chipClose: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choosePlantBtn: {
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
    paddingRight: SIZES.md,
  },
});

export default ActionsScreen;
