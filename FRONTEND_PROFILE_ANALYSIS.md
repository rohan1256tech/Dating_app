# Frontend Profile Implementation - Complete Analysis

## 📋 Current Implementation Overview

The frontend has **3 fully-built profile setup screens** that collect user data locally in React Context (AppContext). Currently, **NO backend integration exists** - all data is stored in memory and lost on app restart.

---

## 🔍 Detailed Screen-by-Screen Breakdown

### **Screen 1: Basic Info** (`app/profile-setup/basic-info/index.tsx`)

**File**: `app/profile-setup/basic-info/index.tsx`  
**Route**: `/profile-setup/basic-info`  
**Step**: 1 of 3

#### Data Collected:
```typescript
{
  name: string,        // Full name
  age: number,         // Calculated from DOB
  dob: string,         // Internal (DD/MM/YYYY format, not saved to context)
  gender: string       // "Male" | "Female" | "Other" (NOT currently saved)
}
```

#### Validation Rules:
- **Name**: Minimum 2 characters
- **DOB**: 
  - Must match format `DD/MM/YYYY`
  - User must be **>= 18 years old**
  - Age is calculated: `currentYear - birthYear`
- **Gender**: Must select one of 3 options (Male, Female, Other)

#### Current Behavior:
```typescript
updateUserProfile({ name, age });  // ⚠️ Gender is NOT saved to context!
router.push('/profile-setup/photos');
```

#### UI Components:
- Input fields (name, DOB)
- 3 gender selection buttons
- Continue button (validates before proceeding)

#### ⚠️ Issue Identified:
**Gender is collected but NOT saved** to the AppContext. This needs to be added to backend schema.

---

### **Screen 2: Photos** (`app/profile-setup/photos/index.tsx`)

**File**: `app/profile-setup/photos/index.tsx`  
**Route**: `/profile-setup/photos`  
**Step**: 2 of 3

#### Data Collected:
```typescript
{
  photos: (string | null)[]  // Array of 6 photo URIs (local device paths)
}
```

#### Features:
- **6 photo slots** (grid layout)
- Uses `expo-image-picker` to select images
- Each image has a remove button (X)
- Photos are stored as **local device URIs** (e.g., `file://...`)

#### Validation Rules:
- **At least 1 photo required** to continue
- Maximum 6 photos total
- Images can be edited/cropped before selection (aspect ratio 4:3)

#### Current Behavior:
```typescript
updateUserProfile({ photos });
router.push('/profile-setup/interests');
```

#### ⚠️ Backend Integration Need:
Photos are currently **local URIs**. Backend will need:
1. File upload endpoint (multipart/form-data)
2. S3/CDN storage for images
3. Return public URLs to store in database
4. OR accept base64 encoded images (not recommended for production)

---

### **Screen 3: Interests** (`app/profile-setup/interests/index.tsx`)

**File**: `app/profile-setup/interests/index.tsx`  
**Route**: `/profile-setup/interests`  
**Step**: 3 of 3

#### Data Collected:
```typescript
{
  interests: string[]  // Array of selected interest tags
}
```

#### Predefined Interest Options:
```typescript
['Photography', 'Cooking', 'Hiking', 'Gaming', 'Art',
 'Music', 'Travel', 'Tech', 'Fitness', 'Reading',
 'Movies', 'Dancing', 'Yoga', 'Writing', 'Sports',
 'Fashion', 'Foodie', 'Animals', 'Nature', 'Cars']
```

#### Validation Rules:
- **Minimum 3 interests** required
- **Maximum 5 interests** allowed
- Selected interests are highlighted in pink

#### Current Behavior:
```typescript
updateUserProfile({ interests: selectedInterests });
router.replace('/(tabs)');  // Navigate to main app (discovery screen)
```

#### Final Action:
After interests, user is taken **directly to the discovery/swipe screen** (`/(tabs)/index.tsx`), marking profile setup as complete.

---

## 🗂️ AppContext Architecture

### UserProfile Type Definition:
```typescript
export interface UserProfile {
    name: string;              // From basic-info
    photos: (string | null)[]; // From photos screen
    interests: string[];       // From interests screen
    bio?: string;             // ⚠️ NOT collected anywhere!
    age?: number;             // From basic-info (calculated)
    location?: {              // Auto-collected via expo-location
        latitude: number;
        longitude: number;
        city?: string;
    };
}
```

### What's MISSING in Frontend:
1. **Bio/Description field** - Defined in type but no UI exists
2. **Gender field** - Collected in UI but NOT saved to context
3. **Date of Birth** - Validated but NOT saved (only age is saved)
4. **Profile completion status** - No `profileCompleted` flag

### Context Functions:
```typescript
const { updateUserProfile } = useApp();

// Usage in screens:
updateUserProfile({ 
  name: "John", 
  age: 25 
});
```

### Storage Mechanism:
```typescript
const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    photos: [],
    interests: [],
});

const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
};
```

**⚠️ CRITICAL**: All data is **in-memory only**. On app restart, everything is lost!

---

## 🚦 Navigation Flow

```
1. OTP Verification Success
   ↓
2. Navigate to: /profile-setup/basic-info
   ↓ (name, age saved)
3. Navigate to: /profile-setup/photos
   ↓ (photos saved)
4. Navigate to: /profile-setup/interests
   ↓ (interests saved)
5. Navigate to: /(tabs) [Main App - Discovery Screen]
```

### Current Logic:
```typescript
// In otp-verification screen after successful login:
router.push('/profile-setup/basic-info');

// In interests screen after completion:
router.replace('/(tabs)');  // No check if profile is complete!
```

**⚠️ Issue**: No logic to **skip profile setup** if user already completed it. Every login forces profile setup again.

---

## 🔄 Location Auto-Detection

**Feature**: AppContext automatically fetches user location on app load

```typescript
useEffect(() => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const location = await Location.getCurrentPositionAsync({});
    
    setUserProfile(prev => ({ 
        ...prev, 
        location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        }
    }));
}, []);
```

**Used For**: Sorting potential matches by distance in discovery screen

---

## 📊 Data Summary Table

| Field | Collected | Validated | Saved to Context | Type | Required |
|-------|-----------|-----------|------------------|------|----------|
| **name** | ✅ basic-info | ✅ Min 2 chars | ✅ | string | ✅ |
| **age** | ✅ basic-info | ✅ >= 18 | ✅ | number | ✅ |
| **dob** | ✅ basic-info | ✅ DD/MM/YYYY | ❌ | - | ✅ |
| **gender** | ✅ basic-info | ✅ Required | ❌ | - | ✅ |
| **photos** | ✅ photos | ✅ >= 1 photo | ✅ | string[] | ✅ |
| **interests** | ✅ interests | ✅ 3-5 items | ✅ | string[] | ✅ |
| **bio** | ❌ No UI | ❌ | ❌ | - | ❌ |
| **location** | ✅ Auto | ❌ | ✅ | object | ❌ |

---

## ⚠️ Critical Issues for Backend Integration

### 1. **No Persistence**
- Data stored in React state only
- App restart = complete data loss
- Need backend to persist profile data

### 2. **Missing Fields**
- **Gender**: Collected but not saved to context
- **DOB**: Validated but not saved (only age saved)
- **Bio**: No UI component exists

### 3. **Photo Storage**
- Photos are local device URIs (`file:///...`)
- Backend needs file upload + cloud storage (S3)
- Or base64 encoding (not recommended)

### 4. **No Profile Completion Check**
- No `profileCompleted` boolean flag
- No logic to skip setup if already complete
- Every login forces re-entering profile data

### 5. **Navigation Logic Missing**
```typescript
// ❌ Current (in OTP verification):
router.push('/profile-setup/basic-info');

// ✅ Should be:
if (user.profileCompleted) {
    router.replace('/(tabs)');  // Go to discovery
} else {
    router.push('/profile-setup/basic-info');  // Setup profile
}
```

---

## 🎯 What Backend Needs to Provide

### 1. **Profile Schema**
```typescript
{
  userId: string;           // Link to auth user
  name: string;
  dob: Date;               // Store full DOB, not just age
  age: number;             // Calculate or store
  gender: string;          // "Male" | "Female" | "Other"
  bio?: string;            // Optional for now
  interests: string[];
  photos: string[];        // URLs after upload
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  profileCompleted: boolean;  // Critical for navigation logic
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. **API Endpoints**

#### **POST /profile/create-or-update**
```typescript
// Request
{
  name: string;
  dob: string;           // ISO date or DD/MM/YYYY
  gender: string;
  interests: string[];
  photos: string[];      // Base64 or uploaded URLs
  bio?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Response
{
  profile: UserProfile;
  message: "Profile updated successfully";
}
```

#### **GET /profile/me**
```typescript
// Response
{
  userId: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  photos: string[];
  location: { ... };
  profileCompleted: boolean;
}
```

#### **PATCH /profile/update**
For partial updates (e.g., only bio, only interests)

#### **POST /profile/upload-photo** (Optional)
Separate endpoint for photo uploads if using multipart/form-data

---

## 🔄 Recommended Integration Flow

### **1. After OTP Verification**
```typescript
// In otp-verification screen:
const response = await api.verifyOTP(phoneNumber, otp);

// Store tokens
await AsyncStorage.setItem('accessToken', response.accessToken);
await AsyncStorage.setItem('userId', response.user.id);

// Check profile status
const profile = await api.getProfile(response.accessToken);

if (profile.profileCompleted) {
    router.replace('/(tabs)');  // Main app
} else {
    router.push('/profile-setup/basic-info');  // Setup profile
}
```

### **2. During Profile Setup**
```typescript
// After interests screen (final step):
const profileData = {
    name: userProfile.name,
    age: userProfile.age,
    gender: selectedGender,  // Add to state
    dob: dobValue,           // Add to state
    interests: userProfile.interests,
    photos: userProfile.photos,  // Handle upload separately
    location: userProfile.location,
};

await api.createOrUpdateProfile(profileData);

// Then navigate to main app
router.replace('/(tabs)');
```

### **3. On App Launch**
```typescript
// In _layout.tsx or app entry:
const token = await AsyncStorage.getItem('accessToken');

if (token) {
    const profile = await api.getProfile(token);
    
    // Load profile into context
    updateUserProfile(profile);
    
    if (profile.profileCompleted) {
        // Go to main app
    } else {
        // Go to profile setup
    }
} else {
    // Go to login
}
```

---

## 📸 Photo Upload Strategy

### **Option 1: Base64 Encoding** (Simple, not recommended for production)
```typescript
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
});

await api.createProfile({
    ...data,
    photos: [base64, base64, ...]
});
```

### **Option 2: Multipart Upload** (Recommended)
```typescript
const formData = new FormData();
formData.append('name', name);
formData.append('age', age);

photos.forEach((uri, index) => {
    formData.append(`photo${index}`, {
        uri,
        type: 'image/jpeg',
        name: `photo-${index}.jpg`
    });
});

await fetch(`${API_URL}/profile/create`, {
    method: 'POST',
    headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data' 
    },
    body: formData
});
```

### **Option 3: Pre-signed S3 URLs** (Best for scale)
```typescript
// 1. Request upload URLs from backend
const { uploadUrls } = await api.requestPhotoUploadUrls(photoCount);

// 2. Upload directly to S3
for (let i = 0; i < photos.length; i++) {
    await fetch(uploadUrls[i], {
        method: 'PUT',
        body: photoFile,
    });
}

// 3. Send final URLs to backend
await api.createProfile({
    ...data,
    photos: uploadUrls.map(u => u.finalUrl)
});
```

---

## ✅ Summary for Backend Implementation

### **What Already Works in Frontend:**
1. ✅ 3-screen profile setup UI (basic-info → photos → interests)
2. ✅ Form validation (age >= 18, min 3 interests, etc.)
3. ✅ Image picker integration
4. ✅ Local state management (AppContext)
5. ✅ Location auto-detection
6. ✅ Navigation flow between screens

### **What Backend Needs to Build:**
1. ✅ Profile MongoDB schema with all fields
2. ✅ `POST /profile/create-or-update` endpoint
3. ✅ `GET /profile/me` endpoint
4. ✅ `PATCH /profile/update` endpoint
5. ✅ `profileCompleted` boolean logic
6. ✅ Photo upload handling (S3 integration)
7. ✅ Validation (age >= 18, interests min 3)
8. ✅ Link profile to authenticated user (userId from JWT)

### **What Frontend Needs to Update:**
1. ❌ Add **gender** to context state
2. ❌ Add **DOB** storage (not just age)
3. ❌ Add **bio** input screen (or field)
4. ❌ Replace context updates with API calls
5. ❌ Add profile completion check after OTP verification
6. ❌ Handle photo upload to backend
7. ❌ Load profile from backend on app launch
8. ❌ Update navigation logic based on `profileCompleted`

---

## 🚀 Recommended Implementation Order

1. **Backend Profile Schema** (MongoDB model)
2. **Backend create-or-update endpoint** (no photos yet)
3. **Backend get profile endpoint**
4. **Frontend: Replace context with API calls** (basic fields only)
5. **Test profile creation flow** (no photos)
6. **Add S3 integration** to backend
7. **Add photo upload** to frontend
8. **Test complete flow** with photos
9. **Add bio field** (backend + frontend)
10. **Production: Add Redis caching** for profile lookups

---

**Status**: Frontend profile UI is complete and production-ready. Backend integration is the only missing piece to persist data across app restarts.

**Last Updated**: February 8, 2026
