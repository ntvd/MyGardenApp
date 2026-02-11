import Constants from 'expo-constants';

const PLANTNET_BASE = 'https://my-api.plantnet.org';
const PROJECT_ALL = 'all';

/**
 * Get PlantNet API key from Expo config (set via .env and app.config.js).
 * @returns {string|null}
 */
export function getPlantnetApiKey() {
  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;
  return extra?.plantnetApiKey ?? null;
}

/**
 * Identify a plant from a single image using PlantNet API.
 * @param {string} imageUri - Local file URI (e.g. from ImagePicker)
 * @returns {Promise<{ success: boolean, results?: Array<{ score: number, species: object }>, bestMatch?: string, error?: string }>}
 */
export async function identifyPlant(imageUri) {
  const apiKey = getPlantnetApiKey();
  if (!apiKey || !imageUri) {
    return {
      success: false,
      error: !apiKey
        ? 'PlantNet API key is not configured. Add PLANTNET_API_KEY to your .env file.'
        : 'No image provided.',
    };
  }

  const { formData } = buildImageFormData(imageUri);
  const url = `${PLANTNET_BASE}/v2/identify/${PROJECT_ALL}?api-key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Do not set Content-Type; fetch sets multipart boundary automatically
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.message || data.error || `Request failed (${response.status})`;
      return { success: false, error: message };
    }

    const results = data.results ?? [];
    const bestMatch = data.bestMatch ?? null;

    return {
      success: true,
      results,
      bestMatch,
      remainingRequests: data.remainingIdentificationRequests,
      version: data.version,
    };
  } catch (err) {
    const message =
      err.message || (err.network ? 'Network error' : 'Identification failed');
    return { success: false, error: message };
  }
}

/**
 * Build FormData with one image for PlantNet (shared by identify and diseases).
 * Must be defined before identifyPlant/identifyDisease.
 * @param {string} imageUri
 * @returns {{ formData: FormData, mimeType: string, fileName: string }}
 */
function buildImageFormData(imageUri) {
  const isPng =
    typeof imageUri === 'string' &&
    (imageUri.includes('.png') || imageUri.endsWith('.png'));
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const fileName = isPng ? 'photo.png' : 'photo.jpg';
  const formData = new FormData();
  formData.append('images', {
    uri: imageUri,
    type: mimeType,
    name: fileName,
  });
  formData.append('organs', 'auto');
  return { formData, mimeType, fileName };
}

/**
 * Identify a disease or pest from a single image using PlantNet Diseases API.
 * @param {string} imageUri - Local file URI (e.g. from ImagePicker)
 * @returns {Promise<{ success: boolean, results?: Array<{ name: string, score: number, description?: string }>, error?: string }>}
 */
export async function identifyDisease(imageUri) {
  const apiKey = getPlantnetApiKey();
  if (!apiKey || !imageUri) {
    return {
      success: false,
      error: !apiKey
        ? 'PlantNet API key is not configured. Add PLANTNET_API_KEY to your .env file.'
        : 'No image provided.',
    };
  }

  const { formData } = buildImageFormData(imageUri);
  const url = `${PLANTNET_BASE}/v2/diseases/identify?api-key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.message || data.error || `Request failed (${response.status})`;
      return { success: false, error: message };
    }

    const results = data.results ?? [];

    return {
      success: true,
      results,
      remainingRequests: data.remainingIdentificationRequests,
      version: data.version,
    };
  } catch (err) {
    const message =
      err.message || (err.network ? 'Network error' : 'Identification failed');
    return { success: false, error: message };
  }
}
