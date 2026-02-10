import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import PlantPickerModal from '../components/PlantPickerModal';

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

const LEGACY_FREQUENCY_MAP = {
  daily: 1, every2: 2, every3: 3, weekly: 7, biweekly: 14, monthly: 30,
};

const getFrequencyLabel = (frequency) => {
  if (frequency === 'once') return 'Once';
  if (frequency?.startsWith('every_')) {
    const days = frequency.replace('every_', '');
    return days === '1' ? 'Every day' : `Every ${days} days`;
  }
  // Legacy fallback
  const days = LEGACY_FREQUENCY_MAP[frequency];
  if (days === 1) return 'Every day';
  if (days) return `Every ${days} days`;
  return frequency;
};

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const createTimeDate = (hour = 8, minute = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

const formatTimeLabel = (date) => {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const RemindersScreen = () => {
  const { plants, areas, getPlantById } = useGarden();
  const [reminders, setReminders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Selection state: tracks selected areas and individual plants separately
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [selectedPlants, setSelectedPlants] = useState([]);

  // New reminder form state
  const [reminderTitle, setReminderTitle] = useState('');
  const [frequencyMode, setFrequencyMode] = useState(null); // 'once' | 'recurring'
  const [selectedDate, setSelectedDate] = useState(() => getTomorrowDate());
  const [intervalDays, setIntervalDays] = useState('');
  const [selectedTime, setSelectedTime] = useState(() => createTimeDate(8, 0));
  const [customNote, setCustomNote] = useState('');
  const [editingReminderId, setEditingReminderId] = useState(null);
  const modalScrollRef = useRef(null);

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
        plantIds: notif.content.data?.plantIds || null,
        areaId: notif.content.data?.areaId || null,
        areaIds: notif.content.data?.areaIds || null,
        frequency: notif.content.data?.frequency || 'daily',
        timeLabel: notif.content.data?.timeLabel || '8:00 AM',
        hour: notif.content.data?.hour ?? 8,
        minute: notif.content.data?.minute ?? 0,
        title: notif.content.title,
        body: notif.content.body,
      }));
      setReminders(parsed);
    } catch (err) {
      console.log('Error loading reminders:', err);
    }
  };

  const resetForm = () => {
    setReminderTitle('');
    setSelectedAll(false);
    setSelectedAreaIds([]);
    setSelectedPlants([]);
    setFrequencyMode(null);
    setSelectedDate(getTomorrowDate());
    setIntervalDays('');
    setSelectedTime(createTimeDate(8, 0));
    setCustomNote('');
    setEditingReminderId(null);
  };

  const toggleAll = () => {
    if (selectedAll) {
      setSelectedAll(false);
    } else {
      setSelectedAll(true);
      setSelectedAreaIds([]);
      setSelectedPlants([]);
    }
  };

  const toggleArea = (areaId) => {
    setSelectedAll(false);
    setSelectedAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const addPickedPlants = (plants) => {
    setSelectedAll(false);
    setSelectedPlants((prev) => {
      const existingIds = prev.map((p) => p._id);
      const newPlants = plants.filter((p) => !existingIds.includes(p._id));
      return [...prev, ...newPlants];
    });
  };

  const removePickedPlant = (plantId) => {
    setSelectedPlants((prev) => prev.filter((p) => p._id !== plantId));
  };

  const getScopeLabel = () => {
    const parts = [];
    if (selectedAll) return 'All plants';
    selectedAreaIds.forEach((id) => {
      const area = areas.find((a) => a._id === id);
      if (area) parts.push(area.name);
    });
    selectedPlants.forEach((p) => parts.push(p.name));
    return parts.length > 0 ? parts.join(', ') : 'None selected';
  };

  const getScopeDataForNotification = () => {
    if (selectedAll || (selectedAreaIds.length === 0 && selectedPlants.length === 0)) {
      return { plantName: 'General', plantId: null, plantIds: null, areaIds: null };
    }
    const names = [];
    selectedAreaIds.forEach((id) => {
      const area = areas.find((a) => a._id === id);
      if (area) names.push(area.name);
    });
    selectedPlants.forEach((p) => names.push(p.name));
    return {
      plantName: names.join(', '),
      plantId: selectedPlants.length > 0 ? selectedPlants[0]._id : null,
      plantIds: selectedPlants.length > 0 ? selectedPlants.map((p) => p._id) : null,
      areaIds: selectedAreaIds.length > 0 ? selectedAreaIds : null,
    };
  };

  const openForEdit = (reminder) => {
    setReminderTitle(
      (reminder.title || '').replace(/^🌱\s*/, '').trim()
    );
    let plantIds = reminder.plantIds ?? (reminder.plantId ? [reminder.plantId] : []);
    if (!Array.isArray(plantIds) && typeof plantIds === 'string') {
      try {
        plantIds = JSON.parse(plantIds || '[]');
      } catch {
        plantIds = [];
      }
    }
    if (!Array.isArray(plantIds)) plantIds = [];
    
    let areaIds = reminder.areaIds || (reminder.areaId ? [reminder.areaId] : []);
    if (!Array.isArray(areaIds)) areaIds = [];

    if (areaIds.length === 0 && plantIds.length === 0) {
      setSelectedAll(true);
      setSelectedAreaIds([]);
      setSelectedPlants([]);
    } else {
      setSelectedAll(false);
      setSelectedAreaIds(areaIds);
      const plist = plantIds.map((id) => getPlantById(id)).filter(Boolean);
      setSelectedPlants(plist);
    }
    // Restore frequency mode
    const freq = reminder.frequency;
    if (freq === 'once') {
      setFrequencyMode('once');
      setSelectedDate(getTomorrowDate());
      setIntervalDays('');
    } else if (freq?.startsWith('every_')) {
      setFrequencyMode('recurring');
      setIntervalDays(freq.replace('every_', ''));
      setSelectedDate(getTomorrowDate());
    } else {
      // Legacy frequencies (daily, weekly, etc.)
      const days = LEGACY_FREQUENCY_MAP[freq] || 1;
      setFrequencyMode('recurring');
      setIntervalDays(String(days));
      setSelectedDate(getTomorrowDate());
    }
    setSelectedTime(createTimeDate(reminder.hour ?? 8, reminder.minute ?? 0));
    setCustomNote(reminder.body || '');
    setEditingReminderId(reminder.id);
    setShowCreateModal(true);
  };

  const isFrequencyValid = () => {
    if (!frequencyMode) return false;
    if (frequencyMode === 'once') return !!selectedDate;
    if (frequencyMode === 'recurring') {
      const n = parseInt(intervalDays, 10);
      return !isNaN(n) && n >= 1;
    }
    return false;
  };

  const handleCreate = async () => {
    const titleText = reminderTitle.trim();
    if (!titleText) {
      Alert.alert('Enter a title', 'Choose a title for your reminder (e.g. Time to water, trim, fertilize).');
      return;
    }
    if (!frequencyMode) {
      Alert.alert('Select frequency', 'Choose how often to be reminded.');
      return;
    }
    if (frequencyMode === 'recurring') {
      const n = parseInt(intervalDays, 10);
      if (isNaN(n) || n < 1) {
        Alert.alert('Enter days', 'Please enter a valid number of days (1 or more).');
        return;
      }
    }

    const scopeData = getScopeDataForNotification();
    const title = titleText.startsWith('🌱') ? titleText : `🌱 ${titleText}`;
    const body = customNote.trim();

    try {
      if (editingReminderId) {
        await Notifications.cancelScheduledNotificationAsync(editingReminderId);
      }

      let trigger;
      let frequencyId;
      let alertMsg;

      if (frequencyMode === 'once') {
        // Combine selectedDate + selectedTime into one datetime
        const fireDate = new Date(selectedDate);
        fireDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate,
        };
        frequencyId = 'once';
        const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        alertMsg = `You'll be reminded on ${dateStr}.`;
      } else {
        const days = parseInt(intervalDays, 10);
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: days * 86400,
          repeats: true,
        };
        frequencyId = `every_${days}`;
        alertMsg = days === 1 ? "You'll be reminded every day." : `You'll be reminded every ${days} days.`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: {
            type: 'custom',
            plantName: scopeData.plantName,
            plantId: scopeData.plantId,
            plantIds: scopeData.plantIds,
            areaIds: scopeData.areaIds,
            frequency: frequencyId,
            timeLabel: formatTimeLabel(selectedTime),
            hour: selectedTime.getHours(),
            minute: selectedTime.getMinutes(),
          },
        },
        trigger,
      });

      setShowCreateModal(false);
      resetForm();
      loadReminders();
      Alert.alert(
        editingReminderId ? 'Reminder Updated 🌱' : 'Reminder Set! 🌱',
        alertMsg
      );
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
      presentationStyle={showPlantPicker ? 'fullScreen' : 'pageSheet'}
      onRequestClose={() => {
        if (showPlantPicker) {
          setShowPlantPicker(false);
          return;
        }
        setShowCreateModal(false);
        resetForm();
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContentWrap}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingReminderId ? 'Edit Reminder' : 'New Reminder'}
          </Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text
              style={[
                styles.modalSave,
                (!reminderTitle.trim() || !isFrequencyValid()) &&
                  styles.modalSaveDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
        >
        <ScrollView
          ref={modalScrollRef}
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Reminder Title */}
          <Text style={styles.formLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Choose title - e.g. Time to water, trim, fertilize"
            placeholderTextColor={COLORS.textLight}
            value={reminderTitle}
            onChangeText={setReminderTitle}
            autoCapitalize="sentences"
          />

          {/* Plant / Area Selector */}
          <Text style={styles.formLabel}>Which plant or area? (optional)</Text>
          <View style={styles.chipWrap}>
            {/* All Plants chip — toggle on/off */}
            <TouchableOpacity
              style={[
                styles.plantChip,
                selectedAll && styles.plantChipSelected,
              ]}
              onPress={toggleAll}
            >
              <Text
                style={[
                  styles.plantChipText,
                  selectedAll && styles.plantChipTextSelected,
                ]}
              >
                Whole garden
              </Text>
              {selectedAll && (
                <View style={styles.chipClose}>
                  <Ionicons name="close" size={10} color={COLORS.background} />
                </View>
              )}
            </TouchableOpacity>

            {/* Area chips — toggle on/off */}
            {areas.map((area) => {
              const isSelected = selectedAreaIds.includes(area._id);
              return (
                <TouchableOpacity
                  key={area._id}
                  style={[styles.plantChip, isSelected && styles.plantChipSelected]}
                  onPress={() => toggleArea(area._id)}
                >
                  <Text
                    style={[
                      styles.plantChipText,
                      isSelected && styles.plantChipTextSelected,
                    ]}
                  >
                    {area.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.chipClose}>
                      <Ionicons name="close" size={10} color={COLORS.background} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Individual plant chips with X to remove */}
            {selectedPlants.map((plant) => (
              <TouchableOpacity
                key={plant._id}
                style={[styles.plantChip, styles.plantChipSelected]}
                onPress={() => removePickedPlant(plant._id)}
              >
                <Text style={[styles.plantChipText, styles.plantChipTextSelected]}>
                  {plant.name}
                </Text>
                <View style={styles.chipClose}>
                  <Ionicons name="close" size={10} color={COLORS.background} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Choose plant(s) button — always visible */}
            <TouchableOpacity
              style={[styles.plantChip, styles.choosePlantBtn]}
              onPress={() => setShowPlantPicker(true)}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={[styles.plantChipText, { color: COLORS.primary }]}>
                Choose plant(s)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Frequency */}
          <Text style={styles.formLabel}>How often?</Text>
          <View style={styles.frequencyModeRow}>
            <TouchableOpacity
              style={[
                styles.frequencyModeCard,
                frequencyMode === 'once' && styles.frequencyModeCardSelected,
              ]}
              onPress={() => setFrequencyMode('once')}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={frequencyMode === 'once' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.frequencyModeText,
                  frequencyMode === 'once' && styles.frequencyModeTextSelected,
                ]}
              >
                Only Once
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.frequencyModeCard,
                frequencyMode === 'recurring' && styles.frequencyModeCardSelected,
              ]}
              onPress={() => setFrequencyMode('recurring')}
            >
              <Ionicons
                name="repeat"
                size={22}
                color={frequencyMode === 'recurring' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.frequencyModeText,
                  frequencyMode === 'recurring' && styles.frequencyModeTextSelected,
                ]}
              >
                Recurring
              </Text>
            </TouchableOpacity>
          </View>

          {frequencyMode === 'once' && (
            <View style={styles.calendarContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                themeVariant="light"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
                style={styles.calendarPicker}
              />
            </View>
          )}

          {frequencyMode === 'recurring' && (
            <View style={styles.intervalInputRow}>
              <Text style={styles.intervalLabel}>Every</Text>
              <TextInput
                style={styles.intervalInput}
                value={intervalDays}
                onChangeText={(text) => setIntervalDays(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={COLORS.textLight}
                maxLength={3}
              />
              <Text style={styles.intervalLabel}>day(s)</Text>
            </View>
          )}

          {/* Preferred time */}
          <Text style={styles.formLabel}>Preferred time</Text>
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="spinner"
              themeVariant="light"
              textColor={COLORS.textPrimary}
              onChange={(event, date) => {
                if (date) setSelectedTime(date);
              }}
              style={styles.timePicker}
            />
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
            scrollEnabled={false}
          />

          <View style={{ height: 20 }} />
        </ScrollView>
        </KeyboardAvoidingView>

        {showPlantPicker && (
          <View style={StyleSheet.absoluteFill}>
            <PlantPickerModal
              visible
              asOverlay
              onClose={() => setShowPlantPicker(false)}
              onDone={(picked) => {
                addPickedPlants(picked);
                setShowPlantPicker(false);
              }}
              multiSelect
            />
          </View>
        )}
        </View>
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
                          name={reminder.frequency === 'once' ? 'calendar-outline' : 'repeat'}
                          size={12}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.metaText}>
                          {getFrequencyLabel(reminder.frequency)}
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
                  <View style={styles.reminderActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openForEdit(reminder)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(reminder.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  </View>
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
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalContentWrap: {
    flex: 1,
    position: 'relative',
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  chipClose: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choosePlantBtn: {
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  frequencyModeRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  frequencyModeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SIZES.xs,
  },
  frequencyModeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  frequencyModeText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  frequencyModeTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  calendarContainer: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
  },
  calendarPicker: {
    width: '100%',
  },
  intervalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  intervalLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  intervalInput: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minWidth: 60,
  },
  timePickerContainer: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  timePicker: {
    height: 160,
    width: '100%',
  },
  titleInput: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteInput: {
    marginHorizontal: SIZES.lg,
    marginBottom: 50,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
  },
});

export default RemindersScreen;