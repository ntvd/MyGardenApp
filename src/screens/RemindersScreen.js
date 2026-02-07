import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const REMINDER_TYPES = [
  { id: 'water', label: 'Water', icon: 'water', color: '#3498DB' },
  { id: 'fertilize', label: 'Fertilize', icon: 'leaf', color: '#27AE60' },
  { id: 'prune', label: 'Prune', icon: 'cut', color: '#E67E22' },
  { id: 'photo', label: 'Take Photo', icon: 'camera', color: '#9B59B6' },
  { id: 'harvest', label: 'Harvest', icon: 'basket', color: '#E74C3C' },
  { id: 'custom', label: 'Custom', icon: 'create', color: '#95A5A6' },
];

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Every day', seconds: 86400 },
  { id: 'every2', label: 'Every 2 days', seconds: 172800 },
  { id: 'every3', label: 'Every 3 days', seconds: 259200 },
  { id: 'weekly', label: 'Every week', seconds: 604800 },
  { id: 'biweekly', label: 'Every 2 weeks', seconds: 1209600 },
  { id: 'monthly', label: 'Every month', seconds: 2592000 },
];

const TIME_OPTIONS = [
  { id: 'morning', label: 'Morning (8 AM)', hour: 8 },
  { id: 'noon', label: 'Noon (12 PM)', hour: 12 },
  { id: 'afternoon', label: 'Afternoon (3 PM)', hour: 15 },
  { id: 'evening', label: 'Evening (6 PM)', hour: 18 },
];

const RemindersScreen = () => {
  const { plants } = useGarden();
  const [reminders, setReminders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // New reminder form state
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    checkPermissions();
    loadReminders();
  }, []);

  const checkPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setHasPermission(finalStatus === 'granted');

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in your device settings to receive plant care reminders.'
      );
    }
  };

  const loadReminders = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const parsed = scheduled.map((notif) => ({
        id: notif.identifier,
        type: notif.content.data?.type || 'custom',
        plantName: notif.content.data?.plantName || 'General',
        plantId: notif.content.data?.plantId || null,
        frequency: notif.content.data?.frequency || 'daily',
        timeLabel: notif.content.data?.timeLabel || 'Morning',
        title: notif.content.title,
        body: notif.content.body,
      }));
      setReminders(parsed);
    } catch (err) {
      console.log('Error loading reminders:', err);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setSelectedPlant(null);
    setSelectedFrequency(null);
    setSelectedTime(TIME_OPTIONS[0]);
    setCustomNote('');
  };

  const handleCreate = async () => {
    if (!selectedType) {
      Alert.alert('Select a type', 'Choose what kind of reminder to set.');
      return;
    }
    if (!selectedFrequency) {
      Alert.alert('Select frequency', 'Choose how often to be reminded.');
      return;
    }

    const typeInfo = REMINDER_TYPES.find((t) => t.id === selectedType);
    const plantName = selectedPlant?.name || 'your garden';
    const title = `🌱 Time to ${typeInfo.label.toLowerCase()}!`;
    const body =
      customNote ||
      `Don't forget to ${typeInfo.label.toLowerCase()} ${plantName}.`;

    try {
      // Schedule a repeating notification
      const trigger =
        selectedFrequency.id === 'daily'
          ? {
              hour: selectedTime.hour,
              minute: 0,
              repeats: true,
            }
          : selectedFrequency.id === 'weekly'
          ? {
              weekday: new Date().getDay() + 1,
              hour: selectedTime.hour,
              minute: 0,
              repeats: true,
            }
          : selectedFrequency.id === 'monthly'
          ? {
              day: new Date().getDate(),
              hour: selectedTime.hour,
              minute: 0,
              repeats: true,
            }
          : {
              type: 'timeInterval',
              seconds: selectedFrequency.seconds,
              repeats: true,
            };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: {
            type: selectedType,
            plantName: selectedPlant?.name || 'General',
            plantId: selectedPlant?._id || null,
            frequency: selectedFrequency.id,
            timeLabel: selectedTime.label,
          },
        },
        trigger,
      });

      setShowCreateModal(false);
      resetForm();
      loadReminders();
      Alert.alert('Reminder Set! 🌱', `You'll be reminded to ${typeInfo.label.toLowerCase()} ${selectedFrequency.label.toLowerCase()}.`);
    } catch (err) {
      console.log('Error scheduling:', err);
      Alert.alert('Error', 'Could not schedule the reminder. Please try again.');
    }
  };

  const handleDelete = (reminderId) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Notifications.cancelScheduledNotificationAsync(reminderId);
          loadReminders();
        },
      },
    ]);
  };

  const handleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Test Reminder',
        body: 'Your garden reminders are working!',
        sound: true,
      },
      trigger: { type: 'timeInterval', seconds: 3 },
    });
    Alert.alert('Test Sent', 'You should see a notification in about 3 seconds.');
  };

  const getTypeInfo = (typeId) =>
    REMINDER_TYPES.find((t) => t.id === typeId) || REMINDER_TYPES[5];

  // ─── Create Modal ────────────────────────────────────
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowCreateModal(false);
        resetForm();
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Reminder</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text
              style={[
                styles.modalSave,
                (!selectedType || !selectedFrequency) && styles.modalSaveDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Reminder Type */}
          <Text style={styles.formLabel}>What do you need to do?</Text>
          <View style={styles.typeGrid}>
            {REMINDER_TYPES.map((type) => (
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

          {/* Plant Selector */}
          <Text style={styles.formLabel}>Which plant? (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plantScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.plantChip,
                !selectedPlant && styles.plantChipSelected,
              ]}
              onPress={() => setSelectedPlant(null)}
            >
              <Text
                style={[
                  styles.plantChipText,
                  !selectedPlant && styles.plantChipTextSelected,
                ]}
              >
                All Plants
              </Text>
            </TouchableOpacity>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant._id}
                style={[
                  styles.plantChip,
                  selectedPlant?._id === plant._id && styles.plantChipSelected,
                ]}
                onPress={() => setSelectedPlant(plant)}
              >
                <Text
                  style={[
                    styles.plantChipText,
                    selectedPlant?._id === plant._id &&
                      styles.plantChipTextSelected,
                  ]}
                >
                  {plant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Frequency */}
          <Text style={styles.formLabel}>How often?</Text>
          <View style={styles.frequencyList}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.frequencyItem,
                  selectedFrequency?.id === freq.id &&
                    styles.frequencyItemSelected,
                ]}
                onPress={() => setSelectedFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    selectedFrequency?.id === freq.id &&
                      styles.frequencyTextSelected,
                  ]}
                >
                  {freq.label}
                </Text>
                {selectedFrequency?.id === freq.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Time of Day */}
          <Text style={styles.formLabel}>Preferred time</Text>
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time.id}
                style={[
                  styles.timeChip,
                  selectedTime.id === time.id && styles.timeChipSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    selectedTime.id === time.id && styles.timeChipTextSelected,
                  ]}
                >
                  {time.id.charAt(0).toUpperCase() + time.id.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Note */}
          <Text style={styles.formLabel}>Custom message (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Use the organic fertilizer for the tomatoes"
            placeholderTextColor={COLORS.textLight}
            value={customNote}
            onChangeText={setCustomNote}
            multiline
          />

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ─── Main Screen ────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>
            Never forget to care for your plants
          </Text>
        </View>

        {/* Permission Warning */}
        {!hasPermission && (
          <TouchableOpacity style={styles.permWarning} onPress={checkPermissions}>
            <Ionicons name="warning" size={20} color="#E67E22" />
            <Text style={styles.permWarningText}>
              Notifications are disabled. Tap to enable.
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={22} color={COLORS.white} />
            <Text style={styles.createBtnText}>New Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications" size={18} color={COLORS.primary} />
            <Text style={styles.testBtnText}>Test</Text>
          </TouchableOpacity>
        </View>

        {/* Active Reminders */}
        <Text style={styles.sectionTitle}>
          Active Reminders ({reminders.length})
        </Text>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySubtitle}>
              Set up reminders to stay on top of watering, fertilizing, and
              more.
            </Text>
          </View>
        ) : (
          <View style={styles.remindersList}>
            {reminders.map((reminder) => {
              const typeInfo = getTypeInfo(reminder.type);
              return (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View
                    style={[
                      styles.reminderIcon,
                      { backgroundColor: typeInfo.color + '18' },
                    ]}
                  >
                    <Ionicons
                      name={typeInfo.icon}
                      size={22}
                      color={typeInfo.color}
                    />
                  </View>
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderBody} numberOfLines={1}>
                      {reminder.body}
                    </Text>
                    <View style={styles.reminderMeta}>
                      <View style={styles.metaTag}>
                        <Ionicons
                          name="repeat"
                          size={12}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.metaText}>
                          {FREQUENCY_OPTIONS.find(
                            (f) => f.id === reminder.frequency
                          )?.label || reminder.frequency}
                        </Text>
                      </View>
                      {reminder.plantName !== 'General' && (
                        <View style={styles.metaTag}>
                          <Ionicons
                            name="leaf"
                            size={12}
                            color={COLORS.textLight}
                          />
                          <Text style={styles.metaText}>
                            {reminder.plantName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(reminder.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderCreateModal()}
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
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  permWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    backgroundColor: '#FEF3E2',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 2,
    gap: SIZES.sm,
  },
  permWarningText: {
    fontSize: SIZES.fontSm,
    color: '#E67E22',
    fontWeight: '500',
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.sm + 4,
    gap: SIZES.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  createBtnText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  remindersList: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm + 2,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reminderBody: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reminderMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: SIZES.sm,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
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
    paddingHorizontal: SIZES.xl,
  },

  // ─── Modal Styles ──────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingTop: SIZES.lg,
  },
  formLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
    marginTop: SIZES.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  typeChipText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  plantScrollContent: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  plantChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  plantChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  plantChipText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  plantChipTextSelected: {
    color: COLORS.white,
  },
  frequencyList: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.xs,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  frequencyItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  frequencyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  frequencyTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  timeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  timeChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  timeChipText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  timeChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  noteInput: {
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default RemindersScreen;
