/**
 * Profile Manager Module
 * Handles saving, loading, and managing detection configuration profiles
 * @module ProfileManager
 */

class ProfileManager {
  constructor() {
    this.storageKey = 'videoAnalytics_profiles';
    this.presets = this.getPresetProfiles();
  }

  getPresetProfiles() {
    return {
      traffic: {
        name: '🚦 Traffic Monitoring',
        config: {
          detectPeople: true,
          detectVehicles: true,
          detectAnimals: false,
          detectSports: false,
          detectFurniture: false,
          detectObjects: false,
          confidenceThreshold: 0.6,
          detectionFPS: 10
        }
      },
      wildlife: {
        name: '🦁 Wildlife Detection',
        config: {
          detectPeople: false,
          detectVehicles: false,
          detectAnimals: true,
          detectSports: false,
          detectFurniture: false,
          detectObjects: false,
          confidenceThreshold: 0.5,
          detectionFPS: 5
        }
      },
      indoor: {
        name: '🏠 Indoor Surveillance',
        config: {
          detectPeople: true,
          detectVehicles: false,
          detectAnimals: false,
          detectSports: false,
          detectFurniture: true,
          detectObjects: true,
          confidenceThreshold: 0.55,
          detectionFPS: 8
        }
      },
      sports: {
        name: '⚽ Sports Analysis',
        config: {
          detectPeople: true,
          detectVehicles: false,
          detectAnimals: false,
          detectSports: true,
          detectFurniture: false,
          detectObjects: false,
          confidenceThreshold: 0.65,
          detectionFPS: 15
        }
      }
    };
  }

  getPreset(presetId) {
    return this.presets[presetId] || null;
  }

  saveProfile(profileName, config) {
    if (!profileName || !config) {
      throw new Error('Profile name and configuration are required');
    }
    if (profileName.trim().length === 0) {
      throw new Error('Profile name cannot be empty');
    }
    if (profileName.length > 50) {
      throw new Error('Profile name too long (max 50 characters)');
    }

    const profiles = this.loadAllProfiles();
    const profileId = this.generateProfileId(profileName);
    profiles[profileId] = {
      name: profileName,
      config: { ...config },
      created: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
    return true;
  }

  loadAllProfiles() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading profiles:', error);
      return {};
    }
  }

  loadProfile(profileId) {
    if (this.presets[profileId]) {
      return this.presets[profileId];
    }
    const profiles = this.loadAllProfiles();
    return profiles[profileId] || null;
  }

  deleteProfile(profileId) {
    if (this.presets[profileId]) {
      throw new Error('Cannot delete preset profiles');
    }
    const profiles = this.loadAllProfiles();
    if (!profiles[profileId]) {
      throw new Error('Profile not found');
    }
    delete profiles[profileId];
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
    return true;
  }

  getAllProfilesList() {
    const list = [];
    Object.keys(this.presets).forEach((id) => {
      list.push({
        id: id,
        name: this.presets[id].name,
        isPreset: true
      });
    });
    const customProfiles = this.loadAllProfiles();
    Object.keys(customProfiles).forEach((id) => {
      list.push({
        id: id,
        name: customProfiles[id].name,
        isPreset: false,
        created: customProfiles[id].created
      });
    });
    return list;
  }

  generateProfileId(name) {
    return (
      'custom_' +
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 30) +
      '_' +
      Date.now()
    );
  }

  clearAllProfiles() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing profiles:', error);
      return false;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileManager;
}
