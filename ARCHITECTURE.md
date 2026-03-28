# Detto Application Architecture & File Structure

This document provides a comprehensive breakdown of the Detto application repository, detailing the directory structure, every file, and its specific function within the system. The project is a full-stack mobile application comprising a React Native (Expo) frontend and a Node.js (NestJS) backend.

---

## 1. Project Root Directory
Contains global configurations, scripts, and documentation for the frontend and monorepo setup.

- `.env` / `.env.example`: Environment variables for the frontend (API URLs, Firebase keys, etc.).
- `.gitignore`: Specifies intentionally untracked files that Git should ignore.
- `app.json`: Core configuration file for Expo (defines app name, bundle identifier, version, icon, and splash screen).
- `eas.json`: Configuration for Expo Application Services (EAS) used for building and submitting the app to app stores.
- `babel.config.js`: Configuration for Babel compiler, defining presets and plugins (e.g., Reanimated, Expo environment).
- `eslint.config.js`: Linter rules to maintain code quality and consistency across the frontend.
- `package.json` / `package-lock.json`: Defines frontend npm dependencies, project metadata, and scripts (start, build, script executions).
- `tsconfig.json`: TypeScript compiler configuration for the frontend React Native code.
- `expo-env.d.ts`: TypeScript declarations specific to Expo.
- `dev-start.ps1`: PowerShell script to initialize the development environment (starts frontend/backend concurrently).
- `fix_geo_index.js`: Utility script, likely a quick run to fix MongoDB geospatial indexing issues.
- `google-services.json`: Firebase configuration file for Android push notifications and authentication.
- `index.html`: Web entry point if the Expo app is built for the web (React Native Web).
- `README.md`, `FRONTEND_PROFILE_ANALYSIS.md`, `MOBILE_NETWORK_FIX.md`, `NETWORK_TROUBLESHOOTING.md`: Markdown files containing project documentation, setup instructions, and historical debugging logs.
- `ts_errors*.txt`, `tsc-output.txt`: Generated logs from TypeScript compilation debugging (temporary output files).
- `.vscode/extensions.json` / `.vscode/settings.json`: VS Code workspace settings and recommended extensions for developers.

---

## 2. Frontend Source Code (React Native / Expo)

The frontend uses Expo Router (file-based routing), React Native, and context/hooks for state management.

### `/app` (Application Screens & Navigation)
Expo Router uses the file system to build the app navigation.
- `_layout.tsx`: The root navigator layout that wraps the entire application (providers, global headers).
- `index.tsx`: The initial entry point screen, likely handling a redirect based on auth state (e.g., to onboarding or main tabs).
- `payment.tsx`: Standalone screen handling subscription logic and payment gateway UI.
- `premium.tsx`: Screen showcasing premium features/benefits and upselling the user.
- **`/app/login`**
  - `index.tsx`: Initial login screen where users enter their phone number.
- **`/app/otp-verification`**
  - `index.tsx`: Screen handling the input and verification of the SMS OTP code sent via Firebase.
- **`/app/onboarding`**
  - `index.tsx`: Welcome screens guiding the user through the app's value proposition before profile setup.
- **`/app/profile-setup`**
  - `basic-info/index.tsx`: Screen to collect user's name, age, gender.
  - `interests/index.tsx`: Screen to select user tags/interests.
  - `photos/index.tsx`: Screen to upload profile pictures.
- **`/app/(tabs)`** (Main Tab Bar Navigation)
  - `_layout.tsx`: Defines the bottom tab navigator UI.
  - `index.tsx`: The main "Discovery" swipe screen (Tinder-like card stack).
  - `chat.tsx`: The list of active conversations/messages.
  - `likes.tsx`: Screen showing users who liked the current user (often a premium feature).
  - `map.tsx`: A map view plotting nearby users or interactions.
  - `matches.tsx`: A grid/list of mutual matches.
  - `profile.tsx`: The current user's profile view and settings menu.
- **`/app/chat/[id].tsx`**
  - Dynamic route for an individual 1-on-1 chat room screen between the user and the match `[id]`.

### `/components` (Reusable UI Elements)
- `Button.tsx`, `ui/Button.tsx`: Custom, stylized button base components.
- `Card.tsx`: The draggable profile card component used in the discovery swipe stack.
- `CartoonAvatar.tsx`: Component to render placeholder avatars or profile thumbnails.
- `GradientBackground.tsx`: A wrapper component providing a branded linear gradient background.
- `Input.tsx`, `ui/Input.tsx`: Custom text input fields with active/inactive styling.
- `OtpInput.tsx`: Specialized input component consisting of multiple boxes for OTP entry.
- `OnboardingSlide.tsx`: A generic layout component for rendering individual onboarding carousel slides.
- `PremiumModal.tsx`: A pop-up modal prompting the user to upgrade to an active premium subscription.
- `hello-wave.tsx`, `parallax-scroll-view.tsx`, `external-link.tsx`, `haptic-tab.tsx`: Standard UI utility wrappers for animations, scrolling headers, and linking.
- `themed-text.tsx`, `themed-view.tsx`: Base UI elements that react to dark/light mode automatically.
- `ui/Chip.tsx`, `ui/Skeleton.tsx`, `ui/collapsible.tsx`: Secondary UI components for selection tags, loading states, and accordions.
- `ui/icon-symbol.tsx`, `ui/icon-symbol.ios.tsx`: Cross-platform icon wrappers using standard icon libraries.

### `/constants` & `/theme` (Design System)
- `constants/animations.ts`: Timing variables and spring configurations for Reanimated.
- `constants/design-tokens.ts`: Core design primitives (spacing, border radii, shadow definitions).
- `constants/theme.ts`: Extracted colors, typography, layout properties.
- `theme/styles.ts`: Global stylesheet utilities.
- `theme/ThemeProvider.tsx`: React Context provider injecting the current theme (light vs dark) into child components.

### `/context` & `/hooks` (State & Logic)
- `context/AppContext.tsx`: Global React Context managing user authentication state, current user data, and socket connection state.
- `hooks/use-color-scheme.ts`, `use-color-scheme.web.ts`: Custom hook to detect OS dark/light mode preferences safely across native/web.
- `hooks/use-theme-color.ts`: Helper hook returning specific color values based on the active theme.

### `/lib`, `/services`, `/utils` & `/scripts` (Infrastructure)
- `lib/firebaseConfirmation.ts`: Interacts securely with Firebase Auth to process the OTP confirmation result.
- `services/api.ts`: Centralized Axios instances configuring base URLs, auth token injection interceptors, and error handling for REST requests.
- `services/socket.ts`: Manages the WebSocket connection (via Socket.io) for real-time chat and online presence.
- `utils/location.ts`: Helper functions to acquire GPS coordinates and manage Android/iOS location permissions.
- `scripts/reset-project.js`: A development script to clear cache and build artifacts when the project is in a bad state.

### `/assets/images` 
- App icons, splash screens, and favicons (`icon.png`, `splash-icon.png`, `android-icon*.png`).

---

## 3. Backend Source Code (NestJS / Node.js)

The backend is a monolithic NestJS application using MongoDB (via Mongoose) and WebSockets.

### `/backend` (Backend Configuration)
- `.env`, `.env.example`: Environment variables (Database URI, JWT secrets, Twilio credentials, Ports).
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`: Containerization setup for deploying the backend and spinning up local Redis/Mongo instances.
- `package.json`, `nest-cli.json`, `tsconfig.json`: Node.js dependencies, NestJS CLI configs, and TypeScript build rules.
- `railway.json`: Configuration mapping for deploying to the Railway cloud platform.
- `tunnel.js`: Script potentially used for local tunnelling (like Ngrok) to test webhooks or external callbacks.
- `README.md`, `QUICK_START.md`, `REDIS_SETUP.md`, `INTEGRATION_DOCS.md`: Detailed documentation on running, deploying, and integrating the backend.

### `/backend/scripts` (Database Operations)
- `create-geo-indexes.js`: Script to enforce MongoDB `2dsphere` indexes on location fields crucial for distance-based querying.
- `create-indexes-test-db.js`: Sets up indexes in the testing database environment.
- `migrate-locations.js`: Data migration script to format legacy coordinate structures into GeoJSON.
- `verify-geo-setup.js`: Admin script to validate that MongoDB spatial queries are functional.

### `/backend/src` (Core Application Modules)
NestJS uses a modular architecture. `app.module.ts` is the root module importing all others. `main.ts` is the bootstrap entry point.

#### `/auth` (Authentication Module)
- `auth.controller.ts`: API endpoints (`/auth/request-otp`, `/auth/verify-otp`).
- `auth.service.ts`: Business logic for verifying users and issuing JWT standard tokens.
- `firebase-admin.service.ts`: Connects to Firebase Admin SDK to valid Firebase tokens.
- `dto/request-otp.dto.ts`, `verify-otp.dto.ts`: Data Transfer Objects validating incoming auth requests.
- `guards/jwt-auth.guard.ts`: Protects routes ensuring requests have a valid JWT.
- `strategies/jwt.strategy.ts`: Passport strategy decoding and validating the JWT against the user database.

#### `/discovery` (Swiping & Map Module)
- `discovery.controller.ts`: Endpoints to fetch feed, register swipes, update location.
- `discovery.service.ts`: Handles the complex logic of finding nearby users, filtering out previously swiped users, and executing the swipe.
- `dto/create-swipe.dto.ts`, `update-map-location.dto.ts`: Request validations.
- `guards/swipe-limit.guard.ts`: Enforces a daily limit on swipes for free tier users.
- `schemas/swipe.schema.ts`, `match.schema.ts`: Mongoose database schemas storing swipe actions (LIKE/REJECT) and mutual matches.

#### `/users` & `/profile` (User State & Data)
- `users/...`: Core user module dealing with base account creation, auth mapping, and `user.schema.ts`.
- `profile.controller.ts` & `profile.service.ts`: Dedicated logic for fetching and updating the dating profile (bio, media, interests).
- `profile.schema.ts`: Schema outlining the specific dating attributes (gender, age, location GeoJSON, photos, metadata).
- `dto/create-profile.dto.ts`, `update-profile.dto.ts`: Validators ensuring profile uploads meet strict requirements.

#### `/match` (Match Management Module)
- `match.controller.ts`, `match.service.ts`: Handles retrieving the user's active matches after a mutual swipe occurs, unmatching logic, and listing matches.

#### `/likes` (Likes Module)
- `likes.controller.ts`: Endpoints for retrieving profiles who have liked the user (premium feature).

#### `/message` (Chat & Real-time Module)
- `chat.gateway.ts`: WebSocket gateway class listening and emitting real-time events (connecting, sending messages, typing indicators).
- `message.controller.ts`: REST endpoints to fetch paginated historical chat logs for a specific match.
- `message.service.ts`: Persists messages to MongoDB and bridges REST REST requests with Socket emissions.
- `message.schema.ts`, `dto/send-message.dto.ts`: Database structure and incoming payload validation for chats.

#### `/otp` (One-Time Password Service)
- `otp.service.ts`: Abstraction module responsible for triggering the SMS (either integrating Twilio directly or wrapping Firebase logic).

#### `/subscription` (Monetization Module)
- `subscription.controller.ts`, `subscription.service.ts`: Logic handling payment verifications, webhooks from stores (Apple/Google play), and unlocking premium database flags.
- `subscription.dto.ts`: Request validation for purchases.

#### `/common` & `/config` (Shared Utilities)
- `common/filters/all-exceptions.filter.ts`: Captures system-wide exceptions and formats them into standardized JSON error responses.
- `common/interceptors/logging.interceptor.ts`: Logs incoming requests and outgoing responses.
- `common/utils/crypto.util.ts`: Hashing or encryption helpers.
- `common/utils/validation.util.ts`: Shared validation helpers.
- `config/configuration.ts`: Centralized parsing of the `.env` file into strongly typed config objects.

### `/backend/test` (E2E Testing)
- `app.e2e-spec.ts`: End-to-end tests ensuring the backend modules operate together correctly.
- `jest-e2e.json`: Jest configuration specifically for running backend tests against a test database.
