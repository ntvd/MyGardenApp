import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';

const getNextTriggerDate = (trigger) => {
  if (!trigger) return null;
  const now = new Date();

  if (trigger.type === 'timeInterval' || trigger.seconds) {
    const seconds = trigger.seconds || 0;
    return new Date(now.getTime() + seconds * 1000);
  }

  const hour = trigger.hour ?? 9;
  const minute = trigger.minute ?? 0;
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);

  if (trigger.weekday) {
    const currentWeekday = next.getDay() + 1;
    let diff = trigger.weekday - currentWeekday;
    if (diff < 0 || (diff === 0 && next <= now)) {
      diff += 7;
    }
    next.setDate(next.getDate() + diff);
    return next;
  }

  if (trigger.day) {
    if (next.getDate() > trigger.day || (next.getDate() === trigger.day && next <= now)) {
      next.setMonth(next.getMonth() + 1);
    }
    next.setDate(trigger.day);
    return next;
  }

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

const formatTime = (date) =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const HomeNotificationsScreen = () => {
  const { clearNotificationCount } = useGarden();
  const [items, setItems] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const mapped = scheduled
        .map((notif) => {
          const nextDate = getNextTriggerDate(notif.trigger);
          return {
            id: notif.identifier,
            title: notif.content.title,
            body: notif.content.body,
            type: notif.content.data?.type || 'custom',
            plantName: notif.content.data?.plantName || 'General',
            nextDate,
          };
        })
        .filter((item) => item.nextDate);

      setItems(mapped);
    } catch (error) {
      Alert.alert('Error', 'Could not load reminders.');
    }
  }, []);

  useEffect(() => {
    clearNotificationCount();
    loadNotifications();
  }, [clearNotificationCount, loadNotifications]);

  const sections = useMemo(() => {
    const today = [];
    const tomorrow = [];
    const upcoming = [];
    const now = new Date();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(now.getDate() + 1);

    items
      .sort((a, b) => a.nextDate - b.nextDate)
      .forEach((item) => {
        const date = item.nextDate;
        if (
          date.toDateString() === now.toDateString()
        ) {
          today.push(item);
        } else if (date.toDateString() === tomorrowDate.toDateString()) {
          tomorrow.push(item);
        } else {
          upcoming.push(item);
        }
      });

    return { today, tomorrow, upcoming };
  }, [items]);

  const renderRow = (item) => (
    <View key={item.id} style={styles.reminderRow}>
      <View style={styles.reminderIcon}>
        <Ionicons name="notifications" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.reminderInfo}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <Text style={styles.reminderSubtitle}>{item.body}</Text>
      </View>
      <Text style={styles.reminderTime}>{formatTime(item.nextDate)}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Notifications</Text>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No upcoming reminders.</Text>
        </View>
      ) : (
        <>
          {sections.today.length > 0 && (
            <View style={styles.section}> 
              <Text style={styles.sectionTitle}>Today</Text>
              {sections.today.map(renderRow)}
            </View>
          )}
          {sections.tomorrow.length > 0 && (
            <View style={styles.section}> 
              <Text style={styles.sectionTitle}>Tomorrow</Text>
              {sections.tomorrow.map(renderRow)}
            </View>
          )}
          {sections.upcoming.length > 0 && (
            <View style={styles.section}> 
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {sections.upcoming.map(renderRow)}
            </View>
          )}
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
  },
  screenTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  reminderTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reminderSubtitle: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reminderTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SIZES.xxl,
  },
  emptyText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
  },
});

export default HomeNotificationsScreen;
