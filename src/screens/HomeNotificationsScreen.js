import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const getNextTriggerDate = (trigger, dataHour, dataMinute) => {
  if (!trigger) return null;
  const now = new Date();

  if (trigger.type === 'timeInterval' || trigger.seconds) {
    const seconds = trigger.seconds || 0;
    if (seconds >= 86400) {
      const hour = dataHour ?? 8;
      const minute = dataMinute ?? 0;
      const next = new Date(now);
      next.setSeconds(0, 0);
      next.setHours(hour, minute, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next;
    }
    return new Date(now.getTime() + seconds * 1000);
  }

  if (trigger.date) {
    const d = new Date(trigger.date);
    return d > now ? d : null;
  }

  const hour = dataHour ?? trigger.hour ?? 9;
  const minute = dataMinute ?? trigger.minute ?? 0;
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
};

const formatTime = (date) =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const formatDayLabel = (date) => {
  const now = new Date();
  const today = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const HomeNotificationsScreen = () => {
  const {
    receivedNotifications,
    dismissReceivedNotification,
    syncReceivedFromTray,
    addEvent,
  } = useGarden();
  const [scheduledReminders, setScheduledReminders] = useState([]);

  const loadScheduled = useCallback(async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const mapped = scheduled.map((notif) => {
        const hour = notif.content.data?.hour ?? 8;
        const minute = notif.content.data?.minute ?? 0;
        const nextDate = getNextTriggerDate(
          notif.trigger,
          hour,
          minute
        );
        return {
          id: notif.identifier,
          title: notif.content.title,
          body: notif.content.body,
          type: notif.content.data?.type || 'custom',
          plantName: notif.content.data?.plantName || 'General',
          hour,
          minute,
          trigger: notif.trigger,
          nextDate,
        };
      });
      setScheduledReminders(mapped);
    } catch (error) {
      Alert.alert('Error', 'Could not load reminders.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScheduled();
      syncReceivedFromTray(); // pick up notifications that fired in background or while on another tab
    }, [loadScheduled, syncReceivedFromTray])
  );

  const handleDismissReceived = useCallback(
    (id, nativeIdentifier) => {
      dismissReceivedNotification(id, nativeIdentifier);
    },
    [dismissReceivedNotification]
  );

  const handleDismissAndAddToEvent = useCallback(
    (item) => {
      const title = (item.title || '').replace(/^🌱\s*/, '').trim() || 'Reminder';
      addEvent({
        type: 'other',
        title,
        description: item.body || undefined,
        areaId: item.areaId || undefined,
        plantIds: item.plantIds?.length ? item.plantIds : undefined,
      });
      dismissReceivedNotification(item.id, item.nativeIdentifier);
    },
    [addEvent, dismissReceivedNotification]
  );

  const feedByDay = useMemo(() => {
    const now = new Date();
    const days = [];
    const dayCount = 14;
    const remindersByDay = {};

    scheduledReminders.forEach((r) => {
      const trigger = r.trigger;
      const seconds = trigger?.seconds;
      const isDaily = seconds === 86400;
      const isDate = trigger?.date != null;

      if (isDate) {
        const d = new Date(trigger.date);
        if (d >= now) {
          const key = d.toDateString();
          if (!remindersByDay[key]) remindersByDay[key] = [];
          remindersByDay[key].push({ ...r, occurrence: d });
        }
        return;
      }

      if (isDaily) {
        for (let i = 0; i < dayCount; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() + i);
          d.setHours(r.hour, r.minute, 0, 0);
          if (d <= now && i === 0) continue;
          const key = d.toDateString();
          if (!remindersByDay[key]) remindersByDay[key] = [];
          remindersByDay[key].push({ ...r, occurrence: new Date(d) });
        }
        return;
      }

      if (r.nextDate) {
        const key = r.nextDate.toDateString();
        if (!remindersByDay[key]) remindersByDay[key] = [];
        remindersByDay[key].push({ ...r, occurrence: r.nextDate });
      }
    });

    for (let i = 0; i < dayCount; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      const items = remindersByDay[key] || [];
      items.sort((a, b) => (a.occurrence || a.nextDate) - (b.occurrence || b.nextDate));
      days.push({
        date: d,
        dateLabel: formatDayLabel(d),
        items,
      });
    }

    return days.filter((day) => day.items.length > 0);
  }, [scheduledReminders]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Received notifications — dismiss only clears this occurrence; recurring reminders stay scheduled */}
        <Text style={styles.sectionTitle}>Received</Text>
        {receivedNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={32} color={COLORS.textLight} />
            <Text style={styles.emptyCardText}>No notifications to dismiss</Text>
          </View>
        ) : (
          <View style={styles.activeList}>
            {receivedNotifications.map((item) => (
              <View key={item.id} style={styles.activeRow}>
                <View style={styles.activeRowContent}>
                  <View style={styles.reminderIcon}>
                    <Ionicons name="notifications" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.body ? (
                      <Text style={styles.reminderSubtitle} numberOfLines={2}>
                        {item.body}
                      </Text>
                    ) : null}
                    <Text style={styles.reminderMeta}>{item.plantName}</Text>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => handleDismissReceived(item.id, item.nativeIdentifier)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={18} color={COLORS.danger} />
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dismissAndEventBtn}
                    onPress={() => handleDismissAndAddToEvent(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="list" size={18} color={COLORS.white} />
                    <Text style={styles.dismissAndEventBtnText}>Dismiss and add to events</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Feed by upcoming day */}
        <Text style={[styles.sectionTitle, styles.feedSectionTitle]}>Upcoming by day</Text>
        {feedByDay.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No upcoming reminders in the next two weeks</Text>
          </View>
        ) : (
          feedByDay.map((day) => (
            <View key={day.date.toISOString()} style={styles.daySection}>
              <Text style={styles.dayLabel}>{day.dateLabel}</Text>
              {day.items.map((item) => (
                <View key={`${day.date.toISOString()}-${item.id}-${item.occurrence?.getTime()}`} style={styles.feedRow}>
                  <View style={styles.reminderIcon}>
                    <Ionicons name="notifications" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.body ? (
                      <Text style={styles.reminderSubtitle} numberOfLines={1}>
                        {item.body}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.feedTime}>
                    {formatTime(item.occurrence || item.nextDate)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  feedSectionTitle: {
    marginTop: SIZES.lg,
  },
  emptyCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  emptyCardText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginTop: SIZES.sm,
  },
  activeList: {
    marginBottom: SIZES.sm,
  },
  activeRow: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activeRowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  reminderInfo: {
    flex: 1,
    minWidth: 0,
  },
  reminderTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reminderSubtitle: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reminderMeta: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.xs,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger + '22',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    gap: 4,
    minWidth: 88,
  },
  dismissBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.danger,
  },
  dismissAndEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    gap: 4,
    minWidth: 88,
  },
  dismissAndEventBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.white,
  },
  daySection: {
    marginBottom: SIZES.lg,
  },
  dayLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  feedTime: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    marginLeft: SIZES.sm,
  },
});

export default HomeNotificationsScreen;
