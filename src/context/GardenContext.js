import React, { createContext, useContext, useState } from 'react';
import {
  GARDEN_AREAS as initialAreas,
  CATEGORIES as initialCategories,
  PLANTS as initialPlants,
} from '../data/mockData';

const GardenContext = createContext();

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
    const plant = {
      ...newPlant,
      _id: `plant_${Date.now()}`,
      growthLog: [],
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
        getRecentGrowthLogs,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};
