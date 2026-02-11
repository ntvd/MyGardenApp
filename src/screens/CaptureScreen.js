import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGarden } from '../context/GardenContext';
import { COLORS, SIZES } from '../theme';
import PlantPickerModal from '../components/PlantPickerModal';
import { identifyPlant, identifyDisease } from '../services/plantnet';

const MODE_DAILY = 'daily';
const MODE_IDENTIFIER = 'identifier';
const ID_TYPE_PLANT = 'plant';
const ID_TYPE_DISEASE = 'disease';
const ID_HISTORY_KEY_PLANT = '@MyGardenApp/identification_history_plant';
const ID_HISTORY_KEY_DISEASE = '@MyGardenApp/identification_history_disease';
const ID_HISTORY_MAX = 50;

const CaptureScreen = () => {
  const { addGrowthLog, getRecentGrowthLogs } = useGarden();
  const [mode, setMode] = useState(MODE_DAILY);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [identifierPhoto, setIdentifierPhoto] = useState(null);
  const [identifierType, setIdentifierType] = useState(ID_TYPE_PLANT);
  const [identifying, setIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [identificationError, setIdentificationError] = useState(null);
  const [plantHistory, setPlantHistory] = useState([]);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const recentLogs = getRecentGrowthLogs();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rawPlant, rawDisease] = await Promise.all([
          AsyncStorage.getItem(ID_HISTORY_KEY_PLANT),
          AsyncStorage.getItem(ID_HISTORY_KEY_DISEASE),
        ]);
        const listPlant = rawPlant ? JSON.parse(rawPlant) : [];
        const listDisease = rawDisease ? JSON.parse(rawDisease) : [];
        if (mounted) {
          if (Array.isArray(listPlant)) setPlantHistory(listPlant);
          if (Array.isArray(listDisease)) setDiseaseHistory(listDisease);
        }
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  const saveIdentificationToHistory = useCallback((item) => {
    const entry = { ...item, id: `id_${Date.now()}`, timestamp: new Date().toISOString() };
    const isPlant = item.type === ID_TYPE_PLANT;
    if (isPlant) {
      setPlantHistory((prev) => {
        const list = [entry, ...prev].slice(0, ID_HISTORY_MAX);
        AsyncStorage.setItem(ID_HISTORY_KEY_PLANT, JSON.stringify(list)).catch(() => {});
        return list;
      });
    } else {
      setDiseaseHistory((prev) => {
        const list = [entry, ...prev].slice(0, ID_HISTORY_MAX);
        AsyncStorage.setItem(ID_HISTORY_KEY_DISEASE, JSON.stringify(list)).catch(() => {});
        return list;
      });
    }
  }, []);

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

  const handleIdentifierCapture = async (source) => {
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
        setIdentifierPhoto(result.assets[0].uri);
        setIdentificationResult(null);
        setIdentificationError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handleIdentify = useCallback(async () => {
    if (!identifierPhoto || identifying) return;
    setIdentifying(true);
    setIdentificationError(null);
    setIdentificationResult(null);
    const isPlant = identifierType === ID_TYPE_PLANT;
    const response = isPlant
      ? await identifyPlant(identifierPhoto)
      : await identifyDisease(identifierPhoto);
    setIdentifying(false);
    if (response.success) {
      setIdentificationResult(response);
      setIdentificationError(null);
      saveIdentificationToHistory({
        type: isPlant ? ID_TYPE_PLANT : ID_TYPE_DISEASE,
        imageUri: identifierPhoto,
        results: response,
      });
    } else {
      setIdentificationError(response.error ?? 'Identification failed.');
      setIdentificationResult(null);
    }
  }, [identifierPhoto, identifying, identifierType, saveIdentificationToHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Capture</Text>
        </View>

        {/* Mode Segmented Control */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === MODE_DAILY && styles.segmentBtnActive]}
            onPress={() => setMode(MODE_DAILY)}
          >
            <Ionicons
              name="images"
              size={18}
              color={mode === MODE_DAILY ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentBtnText,
                mode === MODE_DAILY && styles.segmentBtnTextActive,
              ]}
            >
              Daily Capture
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === MODE_IDENTIFIER && styles.segmentBtnActive]}
            onPress={() => setMode(MODE_IDENTIFIER)}
          >
            <Ionicons
              name="search"
              size={18}
              color={mode === MODE_IDENTIFIER ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentBtnText,
                mode === MODE_IDENTIFIER && styles.segmentBtnTextActive,
              ]}
            >
              Plant & Pest ID
            </Text>
          </TouchableOpacity>
        </View>

        {mode === MODE_DAILY && (
          <>
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
          </>
        )}

        {mode === MODE_IDENTIFIER && (
          <>
            <View style={styles.identifierSection}>
              <Text style={styles.identifierHeadline}>
                Take or use a picture of a plant, weed, disease or pest and we will help identify it.
              </Text>
              <View style={styles.subSegmentWrap}>
                <TouchableOpacity
                  style={[styles.subSegmentBtn, identifierType === ID_TYPE_PLANT && styles.subSegmentBtnActive]}
                  onPress={() => { setIdentifierType(ID_TYPE_PLANT); setIdentificationResult(null); setIdentificationError(null); }}
                >
                  <Ionicons name="leaf" size={16} color={identifierType === ID_TYPE_PLANT ? COLORS.white : COLORS.textSecondary} />
                  <Text style={[styles.subSegmentBtnText, identifierType === ID_TYPE_PLANT && styles.subSegmentBtnTextActive]}>Plant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subSegmentBtn, identifierType === ID_TYPE_DISEASE && styles.subSegmentBtnActive]}
                  onPress={() => { setIdentifierType(ID_TYPE_DISEASE); setIdentificationResult(null); setIdentificationError(null); }}
                >
                  <Ionicons name="bug" size={16} color={identifierType === ID_TYPE_DISEASE ? COLORS.white : COLORS.textSecondary} />
                  <Text style={[styles.subSegmentBtnText, identifierType === ID_TYPE_DISEASE && styles.subSegmentBtnTextActive]}>Disease & Pest</Text>
                </TouchableOpacity>
              </View>
              {identifierPhoto ? (
                <>
                  <View style={styles.identifierPreviewWrap}>
                    <Image
                      source={{ uri: identifierPhoto }}
                      style={styles.identifierPreview}
                    />
                    <TouchableOpacity
                      style={styles.retakeBtn}
                      onPress={() => {
                        setIdentifierPhoto(null);
                        setIdentificationResult(null);
                        setIdentificationError(null);
                      }}
                    >
                      <Ionicons name="close" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.identifyButton, identifying && styles.identifyButtonDisabled]}
                    onPress={handleIdentify}
                    disabled={identifying}
                  >
                    {identifying ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="search" size={20} color={COLORS.white} />
                        <Text style={styles.identifyButtonText}>
                          {identifierType === ID_TYPE_PLANT ? 'Identify plant' : 'Identify disease or pest'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.captureButtons}>
                  <TouchableOpacity
                    style={styles.captureBtn}
                    onPress={() => handleIdentifierCapture('camera')}
                  >
                    <View style={styles.captureBtnInner}>
                      <Ionicons name="camera" size={36} color={COLORS.primary} />
                    </View>
                    <Text style={styles.captureBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.captureBtn}
                    onPress={() => handleIdentifierCapture('library')}
                  >
                    <View style={styles.captureBtnInner}>
                      <Ionicons name="images" size={36} color={COLORS.accent} />
                    </View>
                    <Text style={styles.captureBtnText}>From Library</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {(identifying || identificationError || identificationResult) && (
            <View style={styles.identifierResultsSection}>
              <Text style={styles.sectionTitle}>Identification results</Text>
              {identifying ? (
                <View style={styles.identifierResultsCard}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.identifierResultsHint}>Identifying…</Text>
                </View>
              ) : identificationError ? (
                <View style={[styles.identifierResultsCard, styles.identifierResultsCardError]}>
                  <Ionicons name="warning-outline" size={40} color={COLORS.danger} />
                  <Text style={styles.identifierResultsTitle}>Identification failed</Text>
                  <Text style={styles.identifierResultsHint}>{identificationError}</Text>
                </View>
              ) : identificationResult?.results?.length > 0 && identifierType === ID_TYPE_PLANT ? (
                <View style={styles.identifierResultsList}>
                  {identificationResult.results.slice(0, 5).map((item, index) => {
                    const species = item.species ?? {};
                    const commonNames = species.commonNames ?? [];
                    const primaryName = commonNames[0] || species.scientificNameWithoutAuthor || species.scientificName || 'Unknown';
                    const score = item.score != null ? Math.round(item.score * 100) : null;
                    return (
                      <View key={index} style={styles.identifierResultItem}>
                        <View style={styles.identifierResultRank}>
                          <Text style={styles.identifierResultRankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.identifierResultContent}>
                          <Text style={styles.identifierResultName}>{primaryName}</Text>
                          {species.scientificName && (
                            <Text style={styles.identifierResultScientific} numberOfLines={1}>
                              {species.scientificName}
                            </Text>
                          )}
                          {commonNames.length > 1 && (
                            <Text style={styles.identifierResultCommon} numberOfLines={1}>
                              {commonNames.slice(1, 3).join(', ')}
                            </Text>
                          )}
                        </View>
                        {score != null && (
                          <Text style={styles.identifierResultScore}>{score}%</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : identificationResult?.results?.length > 0 && identifierType === ID_TYPE_DISEASE ? (
                <View style={styles.identifierResultsList}>
                  {identificationResult.results.slice(0, 5).map((item, index) => {
                    const label = item.description ?? item.name ?? 'Unknown';
                    const score = item.score != null ? Math.round(item.score * 100) : null;
                    return (
                      <View key={index} style={styles.identifierResultItem}>
                        <View style={styles.identifierResultRank}>
                          <Text style={styles.identifierResultRankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.identifierResultContent}>
                          <Text style={styles.identifierResultName}>{label}</Text>
                          {item.name && (
                            <Text style={styles.identifierResultScientific} numberOfLines={1}>
                              {item.name}
                            </Text>
                          )}
                        </View>
                        {score != null && (
                          <Text style={styles.identifierResultScore}>{score}%</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.identifierResultsCard}>
                  <Ionicons name="leaf-outline" size={40} color={COLORS.textLight} />
                  <Text style={styles.identifierResultsTitle}>No results yet</Text>
                  <Text style={styles.identifierResultsHint}>
                    Add a photo and tap Identify to see suggestions.
                  </Text>
                </View>
              )}
            </View>
            )}

            {/* History for current mode only */}
            {identifierType === ID_TYPE_PLANT && (
              <View style={styles.idFeedSection}>
                <Text style={styles.sectionTitle}>Plant identification history</Text>
                {plantHistory.length === 0 ? (
                  <View style={styles.idFeedEmpty}>
                    <Ionicons name="leaf-outline" size={36} color={COLORS.textLight} />
                    <Text style={styles.idFeedEmptyText}>No plant identifications yet</Text>
                    <Text style={styles.identifierResultsHint}>Plant IDs will appear here.</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.idFeedScroll}>
                    {plantHistory.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.idFeedCard}
                        onPress={() => setSelectedHistoryItem(item)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.imageUri }} style={styles.idFeedThumb} />
                        <View style={styles.idFeedCardFooter}>
                          <Ionicons name="leaf" size={14} color={COLORS.primary} />
                          <Text style={styles.idFeedCardDate} numberOfLines={1}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {identifierType === ID_TYPE_DISEASE && (
              <View style={styles.idFeedSection}>
                <Text style={styles.sectionTitle}>Disease & pest identification history</Text>
                {diseaseHistory.length === 0 ? (
                  <View style={styles.idFeedEmpty}>
                    <Ionicons name="bug-outline" size={36} color={COLORS.textLight} />
                    <Text style={styles.idFeedEmptyText}>No disease or pest identifications yet</Text>
                    <Text style={styles.identifierResultsHint}>Disease & pest IDs will appear here.</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.idFeedScroll}>
                    {diseaseHistory.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.idFeedCard}
                        onPress={() => setSelectedHistoryItem(item)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.imageUri }} style={styles.idFeedThumb} />
                        <View style={styles.idFeedCardFooter}>
                          <Ionicons name="bug" size={14} color={COLORS.primary} />
                          <Text style={styles.idFeedCardDate} numberOfLines={1}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Detail modal: image + results for selected history item */}
            <Modal
              visible={!!selectedHistoryItem}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setSelectedHistoryItem(null)}
            >
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setSelectedHistoryItem(null)}>
                    <Text style={styles.modalCancel}>Close</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {selectedHistoryItem?.type === ID_TYPE_PLANT ? 'Plant identification' : 'Disease & pest identification'}
                  </Text>
                  <View style={{ width: 56 }} />
                </View>
                {selectedHistoryItem && (
                  <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    <Image source={{ uri: selectedHistoryItem.imageUri }} style={styles.idDetailImage} />
                    <View style={styles.idDetailResults}>
                      <Text style={styles.sectionTitle}>Results</Text>
                      {selectedHistoryItem.type === ID_TYPE_PLANT && selectedHistoryItem.results?.results?.length > 0 ? (
                        selectedHistoryItem.results.results.slice(0, 8).map((item, index) => {
                          const species = item.species ?? {};
                          const commonNames = species.commonNames ?? [];
                          const primaryName = commonNames[0] || species.scientificNameWithoutAuthor || species.scientificName || 'Unknown';
                          const score = item.score != null ? Math.round(item.score * 100) : null;
                          return (
                            <View key={index} style={styles.identifierResultItem}>
                              <View style={styles.identifierResultRank}>
                                <Text style={styles.identifierResultRankText}>{index + 1}</Text>
                              </View>
                              <View style={styles.identifierResultContent}>
                                <Text style={styles.identifierResultName}>{primaryName}</Text>
                                {species.scientificName && (
                                  <Text style={styles.identifierResultScientific} numberOfLines={1}>{species.scientificName}</Text>
                                )}
                              </View>
                              {score != null && <Text style={styles.identifierResultScore}>{score}%</Text>}
                            </View>
                          );
                        })
                      ) : selectedHistoryItem.type === ID_TYPE_DISEASE && selectedHistoryItem.results?.results?.length > 0 ? (
                        selectedHistoryItem.results.results.slice(0, 8).map((item, index) => {
                          const label = item.description ?? item.name ?? 'Unknown';
                          const score = item.score != null ? Math.round(item.score * 100) : null;
                          return (
                            <View key={index} style={styles.identifierResultItem}>
                              <View style={styles.identifierResultRank}>
                                <Text style={styles.identifierResultRankText}>{index + 1}</Text>
                              </View>
                              <View style={styles.identifierResultContent}>
                                <Text style={styles.identifierResultName}>{label}</Text>
                                {item.name && <Text style={styles.identifierResultScientific} numberOfLines={1}>{item.name}</Text>}
                              </View>
                              {score != null && <Text style={styles.identifierResultScore}>{score}%</Text>}
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.identifierResultsHint}>No results saved for this identification.</Text>
                      )}
                    </View>
                    <View style={{ height: 40 }} />
                  </ScrollView>
                )}
              </SafeAreaView>
            </Modal>
          </>
        )}

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
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm + 2,
    gap: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentBtnTextActive: {
    color: COLORS.white,
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
  identifierSection: {
    paddingHorizontal: SIZES.lg,
  },
  identifierHeadline: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  subSegmentWrap: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    gap: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  subSegmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  subSegmentBtnText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subSegmentBtnTextActive: {
    color: COLORS.white,
  },
  identifierPreviewWrap: {
    position: 'relative',
    borderRadius: SIZES.radiusXl,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
  },
  identifierPreview: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  identifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  identifyButtonDisabled: {
    opacity: 0.7,
  },
  identifyButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
  identifierResultsSection: {
    marginTop: SIZES.md,
  },
  identifierResultsCard: {
    marginHorizontal: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
    paddingHorizontal: SIZES.xl,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  identifierResultsCardError: {
    borderColor: COLORS.danger + '60',
    borderStyle: 'solid',
  },
  identifierResultsList: {
    marginHorizontal: SIZES.lg,
  },
  identifierResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  identifierResultRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMuted + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  identifierResultRankText: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  identifierResultContent: {
    flex: 1,
    minWidth: 0,
  },
  identifierResultName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  identifierResultScientific: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  identifierResultCommon: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  identifierResultScore: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  identifierResultsTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  identifierResultsHint: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.xs,
    paddingHorizontal: SIZES.lg,
  },
  idFeedSection: {
    marginTop: SIZES.lg,
  },
  idFeedEmpty: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLg,
  },
  idFeedEmptyText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  idFeedScroll: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    gap: SIZES.md,
  },
  idFeedCard: {
    width: 120,
    marginRight: SIZES.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  idFeedThumb: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  idFeedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    gap: SIZES.xs,
  },
  idFeedCardDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    flex: 1,
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
    backgroundColor: COLORS.backgroundCard,
  },
  modalCancel: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
  },
  idDetailImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
    borderRadius: SIZES.radiusLg,
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  idDetailResults: {
    marginBottom: SIZES.lg,
  },
});

export default CaptureScreen;
