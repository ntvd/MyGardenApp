// Mock data structured to match future MongoDB collections
// Each object has an _id field to mirror MongoDB documents

export const GARDEN_AREAS = [
  {
    _id: 'area_1',
    name: 'Frontyard Garden',
    emoji: '🌻',
    description: 'The welcoming entrance garden',
    coverColor: '#7CB342',
    coverImage: null,
  },
  {
    _id: 'area_2',
    name: 'Backyard Garden',
    emoji: '🌿',
    description: 'The main growing space',
    coverColor: '#558B2F',
    coverImage: null,
  },
  {
    _id: 'area_3',
    name: 'Balcony Pots',
    emoji: '🪴',
    description: 'Container garden on the balcony',
    coverColor: '#8D6E63',
    coverImage: null,
  },
];

export const CATEGORIES = [
  { _id: 'cat_1', name: 'Flowers', emoji: '🌸' },
  { _id: 'cat_2', name: 'Vegetables', emoji: '🥬' },
  { _id: 'cat_3', name: 'Herbs', emoji: '🌿' },
  { _id: 'cat_4', name: 'Fruits', emoji: '🍓' },
  { _id: 'cat_5', name: 'Succulents', emoji: '🌵' },
];

export const PLANTS = [
  {
    _id: 'plant_1',
    name: 'Cherry Tomato',
    category: 'cat_2',
    area: 'area_2',
    description:
      'Sweet cherry tomatoes, perfect for salads. Planted from seed in early spring. Needs full sun and consistent watering.',
    datePlanted: '2025-03-15',
    growthLog: [
      {
        _id: 'log_1',
        date: '2025-03-15',
        photo: null, // Will be a URI when photos are taken
        note: 'Planted seeds in starter pots',
      },
      {
        _id: 'log_2',
        date: '2025-03-22',
        photo: null,
        note: 'First sprouts appeared!',
      },
      {
        _id: 'log_3',
        date: '2025-04-05',
        photo: null,
        note: 'Transplanted to garden bed',
      },
      {
        _id: 'log_4',
        date: '2025-04-20',
        photo: null,
        note: 'Growing strong, about 12 inches tall',
      },
    ],
  },
  {
    _id: 'plant_2',
    name: 'Basil',
    category: 'cat_3',
    area: 'area_2',
    description:
      'Sweet Genovese basil for cooking. Loves warm weather and well-drained soil. Pinch off flower buds to encourage leaf growth.',
    datePlanted: '2025-04-01',
    growthLog: [
      {
        _id: 'log_5',
        date: '2025-04-01',
        photo: null,
        note: 'Started from nursery seedling',
      },
      {
        _id: 'log_6',
        date: '2025-04-10',
        photo: null,
        note: 'Lots of new leaves',
      },
    ],
  },
  {
    _id: 'plant_3',
    name: 'Sunflower',
    category: 'cat_1',
    area: 'area_1',
    description:
      'Giant sunflower variety, expected to reach 6-8 feet. Planted along the fence line for a stunning summer display.',
    datePlanted: '2025-04-10',
    growthLog: [
      {
        _id: 'log_7',
        date: '2025-04-10',
        photo: null,
        note: 'Seeds planted directly in ground',
      },
      {
        _id: 'log_8',
        date: '2025-04-18',
        photo: null,
        note: 'Seedlings emerging',
      },
      {
        _id: 'log_9',
        date: '2025-05-01',
        photo: null,
        note: 'About 2 feet tall now',
      },
    ],
  },
  {
    _id: 'plant_4',
    name: 'Lavender',
    category: 'cat_1',
    area: 'area_1',
    description:
      'English lavender. Drought-tolerant and fragrant. Perfect for borders and attracting pollinators.',
    datePlanted: '2025-03-20',
    growthLog: [
      {
        _id: 'log_10',
        date: '2025-03-20',
        photo: null,
        note: 'Transplanted from nursery pot',
      },
    ],
  },
  {
    _id: 'plant_5',
    name: 'Mint',
    category: 'cat_3',
    area: 'area_3',
    description:
      'Spearmint kept in a container to prevent spreading. Great for teas and cocktails.',
    datePlanted: '2025-03-10',
    growthLog: [
      {
        _id: 'log_11',
        date: '2025-03-10',
        photo: null,
        note: 'Potted in large container',
      },
      {
        _id: 'log_12',
        date: '2025-03-25',
        photo: null,
        note: 'Already spreading like crazy!',
      },
    ],
  },
  {
    _id: 'plant_6',
    name: 'Strawberry',
    category: 'cat_4',
    area: 'area_2',
    description:
      'Ever-bearing strawberry plants. Should produce fruit from late spring through fall.',
    datePlanted: '2025-03-01',
    growthLog: [
      {
        _id: 'log_13',
        date: '2025-03-01',
        photo: null,
        note: 'Planted bare root crowns',
      },
      {
        _id: 'log_14',
        date: '2025-03-20',
        photo: null,
        note: 'New leaves unfurling',
      },
      {
        _id: 'log_15',
        date: '2025-04-15',
        photo: null,
        note: 'First flowers!',
      },
    ],
  },
  {
    _id: 'plant_7',
    name: 'Rose',
    category: 'cat_1',
    area: 'area_1',
    description:
      'Classic red hybrid tea rose. Requires regular pruning and feeding for best blooms.',
    datePlanted: '2025-02-15',
    growthLog: [
      {
        _id: 'log_16',
        date: '2025-02-15',
        photo: null,
        note: 'Planted bare root rose',
      },
      {
        _id: 'log_17',
        date: '2025-03-10',
        photo: null,
        note: 'New red shoots emerging',
      },
      {
        _id: 'log_18',
        date: '2025-04-20',
        photo: null,
        note: 'First bud forming!',
      },
    ],
  },
  {
    _id: 'plant_8',
    name: 'Aloe Vera',
    category: 'cat_5',
    area: 'area_3',
    description:
      'Medicinal aloe vera. Low maintenance, just needs bright light and infrequent watering.',
    datePlanted: '2025-01-10',
    growthLog: [
      {
        _id: 'log_19',
        date: '2025-01-10',
        photo: null,
        note: 'Repotted from a pup',
      },
    ],
  },
];
