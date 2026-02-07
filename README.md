# 🌱 Garden Tracker

A React Native (Expo) mobile app for managing your garden and tracking plant growth over time, with a Node.js + MongoDB backend.

---

## Quick Start (Frontend Only — with mock data)

```bash
cd garden-app
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your phone (same Wi-Fi network).

---

## Project Structure

```
garden-app/
├── App.js                      # Entry point
├── src/
│   ├── theme.js                # Colors, spacing, font sizes
│   ├── context/
│   │   └── GardenContext.js    # State management (swap for API calls later)
│   ├── data/
│   │   └── mockData.js         # Mock data matching MongoDB schema
│   ├── navigation/
│   │   ├── AppNavigator.js     # Bottom tabs (Capture | Home | Profile)
│   │   └── HomeStack.js        # Home → Area → Category → Plant Detail
│   └── screens/
│       ├── HomeScreen.js       # Garden areas + recent activity
│       ├── AreaScreen.js       # Category folders for a garden area
│       ├── CategoryScreen.js   # Grid of plants in a category
│       ├── PlantDetailScreen.js# Growth timeline, photos, description
│       ├── CaptureScreen.js    # Daily photo capture (Instagram-style)
│       └── ProfileScreen.js    # User profile & settings
├── backend/
│   ├── server.js               # Express server
│   ├── models/                 # Mongoose schemas (Plant, Area, Category)
│   ├── routes/                 # REST API routes
│   └── .env                    # Environment variables
```

---

## App Screens

| Tab | Screen | Description |
|-----|--------|-------------|
| 📷 Capture | Daily Capture | Take/upload a plant photo, select which plant, save |
| 🌿 Home | Garden Areas | Shows Frontyard, Backyard, Balcony, etc. |
| | → Area | Category folders (Flowers, Vegetables, Herbs...) |
| | → Category | Grid of plants with photos |
| | → Plant Detail | Growth timeline, all photos, description |
| 👤 Profile | Settings | Stats, reminders, appearance, backup |

---

## Connecting the Backend (when ready)

### 1. Install & run MongoDB locally (or use MongoDB Atlas)

### 2. Start the backend
```bash
cd garden-app/backend
npm install
mkdir uploads
npm run dev
```

### 3. Update GardenContext.js
Replace the local state functions with `fetch()` calls to your API:

```js
// Example: replace getPlantsForArea with:
const getPlantsForArea = async (areaId) => {
  const res = await fetch(`http://YOUR_IP:5000/api/plants?area=${areaId}`);
  return res.json();
};
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/areas` | List all garden areas |
| POST | `/api/areas` | Create a garden area |
| GET | `/api/plants?area=X&category=Y` | List plants (filterable) |
| GET | `/api/plants/:id` | Get plant with growth log |
| POST | `/api/plants` | Create a plant |
| POST | `/api/plants/:id/growth-log` | Add growth entry (with photo upload) |
| PUT | `/api/plants/:id` | Update plant |
| DELETE | `/api/plants/:id` | Delete plant |

---

## Next Steps

- [ ] Connect frontend to backend API
- [ ] Add user authentication (JWT)
- [ ] Push notifications for watering reminders
- [ ] Plant identification via image AI
- [ ] Weather integration for garden care tips
- [ ] Export/share growth timelapse
