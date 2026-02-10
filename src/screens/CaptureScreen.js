import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';
import PlantPickerModal from '../components/PlantPickerModal';

const CaptureScreen = () => {
  const { addGrowthLog, getRecentGrowthLogs } = useGarden();
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const recentLogs = getRecentGrowthLogs();

  const handleCapture = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Camera access is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Photo library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handleSave = () => {
    if (!selectedPlant) {
      Alert.alert('Select a plant', 'Please select which plant this photo is for.');
      return;
    }
    if (!capturedPhoto) {
      Alert.alert('Take a photo', 'Please capture or choose a photo first.');
      return;
    }

    const newLog = {
      _id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      photo: capturedPhoto,
      note: 'Daily growth capture',
    };

    addGrowthLog(selectedPlant._id, newLog);
    Alert.alert('Saved! 🌱', `Growth photo added to ${selectedPlant.name}`);
    setCapturedPhoto(null);
    setSelectedPlant(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Capture</Text>
        </View>

        {/* Capture Area */}
        <View style={styles.captureSection}>
          <Text style={styles.captureHeadline}>
            Add pictures of your plants to track their growth!
          </Text>
          {capturedPhoto ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: capturedPhoto }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setCapturedPhoto(null)}
              >
                <Ionicons name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.captureButtons}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={() => handleCapture('camera')}
              >
                <View style={styles.captureBtnInner}>
                  <Ionicons name="camera" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.captureBtnText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureBtn}
                onPress={() => handleCapture('library')}
              >
                <View style={styles.captureBtnInner}>
                  <Ionicons name="images" size={36} color={COLORS.accent} />
                </View>
                <Text style={styles.captureBtnText}>From Library</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Plant Selector */}
        <View style={styles.plantSelector}>
          <Text style={styles.sectionTitle}>Select Plant</Text>
          <TouchableOpacity
            style={[
              styles.selectPlantButton,
              selectedPlant && styles.selectPlantButtonSelected,
            ]}
            onPress={() => setShowPlantPicker(true)}
          >
            <Ionicons
              name="leaf"
              size={20}
              color={selectedPlant ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.selectPlantButtonText,
                selectedPlant && styles.selectPlantButtonTextSelected,
              ]}
            >
              {selectedPlant ? selectedPlant.name : 'Choose plant(s)'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={selectedPlant ? COLORS.white : COLORS.textLight}
            />
          </TouchableOpacity>
        </View>

        <PlantPickerModal
          visible={showPlantPicker}
          onClose={() => setShowPlantPicker(false)}
          onDone={(selected) => {
            if (selected.length > 0) setSelectedPlant(selected[0]);
            setShowPlantPicker(false);
          }}
          multiSelect={false}
        />

        {/* Save Button */}
        {capturedPhoto && selectedPlant && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={22} color={COLORS.white} />
            <Text style={styles.saveButtonText}>
              Save to {selectedPlant.name}
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent Captures Feed */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>Recent Captures</Text>
          {recentLogs.filter((l) => l.photo).length === 0 ? (
            <View style={styles.emptyFeed}>
              <Ionicons
                name="images-outline"
                size={40}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyText}>
                No photos yet. Start capturing your garden's growth!
              </Text>
            </View>
          ) : (
            recentLogs
              .filter((l) => l.photo)
              .slice(0, 10)
              .map((log) => (
                <View key={log._id} style={styles.feedItem}>
                  <View style={styles.feedHeader}>
                    <View style={styles.feedAvatar}>
                      <Ionicons
                        name="leaf"
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.feedPlantName}>
                        {log.plantName}
                      </Text>
                      <Text style={styles.feedDate}>{log.date}</Text>
                    </View>
                  </View>
                  <Image
                    source={{ uri: log.photo }}
                    style={styles.feedImage}
                  />
                  <Text style={styles.feedNote}>{log.note}</Text>
                </View>
              ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontDisplay,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  captureHeadline: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  captureSection: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  captureBtn: {
    flex: 1,
    alignItems: 'center',
  },
  captureBtnInner: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  captureBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: SIZES.radiusXl,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  retakeBtn: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantSelector: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  selectPlantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SIZES.sm,
  },
  selectPlantButtonSelected: {
    backgroundColor: COLORS.primaryMuted + '25',
    borderColor: COLORS.primary,
  },
  selectPlantButtonText: {
    flex: 1,
    fontSize: SIZES.fontMd,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  selectPlantButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
  feedSection: {
    marginTop: SIZES.md,
  },
  feedItem: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    gap: SIZES.sm,
  },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryMuted + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedPlantName: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  feedDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
  },
  feedImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  feedNote: {
    padding: SIZES.sm,
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
  },
  emptyText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.xl,
  },
});

export default CaptureScreen;
