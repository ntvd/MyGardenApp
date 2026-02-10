import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  GARDEN_AREAS as initialAreas,
  CATEGORIES as initialCategories,
  PLANTS as initialPlants,
} from '../data/mockData';

const GardenContext = createContext();

function parsePlantIds(plantIds) {
  if (Array.isArray(plantIds)) return plantIds;
  if (typeof plantIds === 'string') {
    try {
      const parsed = JSON.parse(plantIds);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseAreaId(areaId, areaIds) {
  if (areaId) return areaId;
  if (Array.isArray(areaIds) && areaIds.length > 0) return areaIds[0];
  if (typeof areaIds === 'string') {
    try {
      const parsed = JSON.parse(areaIds);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
  }
  return null;
}

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
};

export const GardenProvider = ({ children }) => {
  const [areas, setAreas] = useState(initialAreas);
  const [categories, setCategories] = useState(initialCategories);
  const [plants, setPlants] = useState(initialPlants);
  const [events, setEvents] = useState([]);
  const [receivedNotifications, setReceivedNotifications] = useState([]);

  // Foreground: add each received notification (unique id per delivery)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const req = notification.request;
        const content = req?.content || {};
        const data = content.data || {};
        const identifier = req?.identifier || '';
        const uniqueId = `${identifier}-${Date.now()}`;
        const plantIds = parsePlantIds(data.plantIds);
        const areaId = parseAreaId(data.areaId, data.areaIds);
        setReceivedNotifications((prev) => [
          ...prev,
          {
            id: uniqueId,
            nativeIdentifier: identifier,
            title: content.title || 'Reminder',
            body: content.body || '',
            plantName: (data && data.plantName) || 'General',
            receivedAt: new Date().toISOString(),
            plantIds,
            areaId,
          },
        ]);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(subscription);
    };
  }, []);

  const dismissReceivedNotification = async (id, nativeIdentifier) => {
    if (nativeIdentifier) {
      try {
        await Notifications.dismissNotificationAsync(nativeIdentifier);
      } catch (e) {}
    }
    setReceivedNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Set list to current tray only (replace, no merge) so we never accumulate old items or duplicates
  const syncReceivedFromTray = async () => {
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      const dateToSec = (d) =>
        typeof d === 'number' ? (d < 1e12 ? d : Math.floor(d / 1000)) : 0;
      const mapped = (presented || []).map((notif) => {
        const req = notif.request;
        const content = req?.content || {};
        const data = content.data || {};
        const identifier = req?.identifier || '';
        const dateSec = dateToSec(notif.date != null ? notif.date : Date.now() / 1000);
        const ms = dateSec * 1000;
        const plantIds = parsePlantIds(data.plantIds);
        const areaId = parseAreaId(data.areaId, data.areaIds);
        return {
          id: `${identifier}-${dateSec}`,
          nativeIdentifier: identifier,
          title: content.title || 'Reminder',
          body: content.body || '',
          plantName: (data && data.plantName) || 'General',
          receivedAt: new Date(ms).toISOString(),
          plantIds,
          areaId,
        };
      });
      setReceivedNotifications(mapped);
    } catch (e) {}
  };

  // Sync from notification tray when app becomes active (notifications that fired in background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncReceivedFromTray();
    });
    syncReceivedFromTray(); // run once on mount
    return () => sub?.remove();
  }, []);

  const notificationCount = receivedNotifications.length;

  // ---- Future: replace these with API calls to Node.js backend ----

  const getPlantsForArea = (areaId) => {
    return plants.filter((p) => p.area === areaId);
  };

  const getPlantsForAreaAndCategory = (areaId, categoryId) => {
    return plants.filter((p) => p.area === areaId && p.category === categoryId);
  };

  const getPlantById = (plantId) => {
    return plants.find((p) => p._id === plantId);
  };

  const getCategoriesForArea = (areaId) => {
    const plantCatIds = plants
      .filter((p) => p.area === areaId)
      .map((p) => p.category);
    const uniqueCatIds = [...new Set(plantCatIds)];
    // Return all categories but mark which ones have plants
    return categories.map((cat) => ({
      ...cat,
      plantCount: plants.filter(
        (p) => p.area === areaId && p.category === cat._id
      ).length,
    }));
  };

  const addGrowthLog = (plantId, logEntry) => {
    // Future: POST /api/plants/:id/growth-log
    setPlants((prev) =>
      prev.map((p) =>
        p._id === plantId
          ? { ...p, growthLog: [...p.growthLog, logEntry] }
          : p
      )
    );
  };

  const deleteGrowthLog = (plantId, logId) => {
    setPlants((prev) =>
      prev.map((p) =>
        p._id === plantId
          ? {
              ...p,
              growthLog: p.growthLog.filter((log) => log._id !== logId),
            }
          : p
      )
    );
  };

  const addPlant = (newPlant) => {
    // Future: POST /api/plants
    const initialLog = newPlant.initialPhoto
      ? [
          {
            _id: `log_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            photo: newPlant.initialPhoto,
            note: newPlant.initialNote || 'Initial photo',
          },
        ]
      : [];
    const plant = {
      ...newPlant,
      _id: `plant_${Date.now()}`,
      growthLog: initialLog,
      datePlanted: new Date().toISOString().split('T')[0],
    };
    setPlants((prev) => [...prev, plant]);
    return plant;
  };

  const deletePlant = (plantId) => {
    setPlants((prev) => prev.filter((plant) => plant._id !== plantId));
  };

  const addCategory = (newCategory) => {
    const category = {
      _id: `cat_${Date.now()}`,
      name: newCategory.name,
      emoji: newCategory.emoji || '🌱',
    };
    setCategories((prev) => [category, ...prev]);
    return category;
  };

  const addArea = (newArea) => {
    const area = {
      _id: `area_${Date.now()}`,
      name: newArea.name,
      description: newArea.description,
      emoji: newArea.emoji || '🌿',
      coverColor: newArea.coverColor || '#7CB342',
      coverImage: newArea.coverImage || null,
    };
    setAreas((prev) => [area, ...prev]);
    return area;
  };

  const updateArea = (areaId, updates) => {
    setAreas((prev) =>
      prev.map((area) =>
        area._id === areaId ? { ...area, ...updates } : area
      )
    );
  };

  const deleteArea = (areaId) => {
    setAreas((prev) => prev.filter((area) => area._id !== areaId));
    setPlants((prev) => prev.filter((plant) => plant.area !== areaId));
  };

  const clearNotificationCount = () => {
    setReceivedNotifications([]);
  };

  // Count unique non-empty varieties across all plants
  const getUniqueVarietyCount = () => {
    const varieties = plants
      .map((p) => p.variety?.trim())
      .filter(Boolean);
    return new Set(varieties).size;
  };

  // ---- Garden events (water, fertilize, etc.) ----
  const addEvent = (eventPayload) => {
    const event = {
      _id: `event_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...eventPayload,
    };
    setEvents((prev) => [event, ...prev]);
    return event;
  };

  const deleteEvent = (eventId) => {
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
  };

  const getAllEvents = () => {
    return [...events].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  const getEventsForPlant = (plantId) => {
    const plant = plants.find((p) => p._id === plantId);
    if (!plant) return [];
    return events.filter((ev) => {
      if (ev.areaId) return plant.area === ev.areaId;
      if (ev.plantIds && ev.plantIds.length > 0)
        return ev.plantIds.includes(plantId);
      // No areaId and no plantIds = "All plants" → applies to every plant
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Get all recent growth logs across all plants (for the capture feed)
  const getRecentGrowthLogs = () => {
    const allLogs = [];
    plants.forEach((plant) => {
      plant.growthLog.forEach((log) => {
        allLogs.push({
          ...log,
          plantName: plant.name,
          plantId: plant._id,
        });
      });
    });
    return allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Combined recent activity: growth logs + events, sorted by date (newest first)
  const getRecentActivity = () => {
    const growthItems = getRecentGrowthLogs().map((log) => ({
      type: 'growth',
      sortDate: new Date(log.date),
      plantId: log.plantId,
      plantName: log.plantName,
      ...log,
    }));
    const eventTypeLabels = {
      water: 'Watered',
      fertilize: 'Fertilized',
      prune: 'Pruned',
      harvest: 'Harvested',
      weed: 'Weeded',
      other: 'Other',
    };
    const eventItems = getAllEvents().map((ev) => {
      let scopeLabel = 'All plants';
      if (ev.areaId) {
        const area = areas.find((a) => a._id === ev.areaId);
        scopeLabel = area?.name || 'Area';
      } else if (ev.plantIds && ev.plantIds.length > 0) {
        const names = ev.plantIds
          .map((id) => getPlantById(id)?.name)
          .filter(Boolean);
        scopeLabel = names.length === 1 ? names[0] : `${names.length} plants`;
      }
      return {
        type: 'event',
        sortDate: new Date(ev.createdAt),
        eventType: ev.type,
        eventLabel: ev.title || eventTypeLabels[ev.type] || 'Event',
        description: ev.description,
        scopeLabel,
        ...ev,
      };
    });
    return [...growthItems, ...eventItems].sort(
      (a, b) => b.sortDate - a.sortDate
    );
  };

  return (
    <GardenContext.Provider
      value={{
        areas,
        categories,
        plants,
        getPlantsForArea,
        getPlantsForAreaAndCategory,
        getPlantById,
        getCategoriesForArea,
        addGrowthLog,
        deleteGrowthLog,
        addPlant,
        deletePlant,
        addCategory,
        addArea,
        updateArea,
        deleteArea,
        notificationCount,
        receivedNotifications,
        dismissReceivedNotification,
        syncReceivedFromTray,
        clearNotificationCount,
        getRecentGrowthLogs,
        getRecentActivity,
        getUniqueVarietyCount,
        events,
        addEvent,
        deleteEvent,
        getAllEvents,
        getEventsForPlant,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};