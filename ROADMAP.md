# Daily Ritual - Launch Roadmap

A comprehensive plan to bring Daily Ritual from development to production.

---

## Current Status: ✅ MVP Complete

The app is functional with:
- [x] Daily habit tracking (check-off)
- [x] Timed habit tracking (with timer, persistence)
- [x] Weekly target tracking
- [x] Motivational intro for timed sessions
- [x] Custom power phrases
- [x] Habit-specific "why" motivation
- [x] Calendar view with heatmap
- [x] Stats & streaks
- [x] Daily review prompt
- [x] Dark "hardcore" aesthetic
- [x] Data persistence (AsyncStorage)

---

## Phase 1: Pre-Launch Polish
**Goal:** Fix any remaining bugs, clean up code

| Task | Priority | Status |
|------|----------|--------|
| Test all features thoroughly on Android | High | ⬜ |
| Test data persistence (close/reopen app) | High | ⬜ |
| Test timer persistence (pause, close, resume) | High | ⬜ |
| Remove any console.log statements | Medium | ⬜ |
| Add proper error handling for edge cases | Medium | ⬜ |
| Review and clean up unused code/imports | Low | ⬜ |

---

## Phase 2: Android Production Build
**Goal:** Create installable APK for Android users

| Task | Priority | Status |
|------|----------|--------|
| Create Expo account (if not done) | High | ⬜ |
| Install EAS CLI (`npm install -g eas-cli`) | High | ⬜ |
| Run `eas build:configure` | High | ⬜ |
| Configure `app.json` (name, icon, splash, package name) | High | ⬜ |
| Create app icon (1024x1024) | High | ⬜ |
| Create splash screen | Medium | ⬜ |
| Run first build: `eas build --platform android --profile preview` | High | ⬜ |
| Test APK on physical device | High | ⬜ |
| Fix any build-specific issues | High | ⬜ |

---

## Phase 3: PWA Setup (for iPhone users)
**Goal:** Create web version that works as installable PWA

| Task | Priority | Status |
|------|----------|--------|
| Install web dependencies: `npx expo install react-dom react-native-web @expo/metro-runtime` | High | ⬜ |
| Configure `app.json` for web | High | ⬜ |
| Create PWA manifest (name, icons, theme color) | High | ⬜ |
| Create web-specific icons (192x192, 512x512) | High | ⬜ |
| Test web build locally: `npx expo start --web` | High | ⬜ |
| Fix any web-specific styling issues | Medium | ⬜ |
| Ensure localStorage works (may need adapter) | High | ⬜ |
| Add service worker for offline support | Medium | ⬜ |
| Export for production: `npx expo export:web` | High | ⬜ |

---

## Phase 4: GitHub Setup
**Goal:** Version control + open source

| Task | Priority | Status |
|------|----------|--------|
| Initialize git repo (if not done) | High | ⬜ |
| Create `.gitignore` (node_modules, .expo, etc.) | High | ⬜ |
| Create GitHub repository | High | ⬜ |
| Write README.md with: | High | ⬜ |
| - Project description | | |
| - Screenshots | | |
| - Installation instructions | | |
| - How to contribute | | |
| Push code to GitHub | High | ⬜ |
| Set up GitHub Releases for APK hosting | Medium | ⬜ |

---

## Phase 5: Deployment & Distribution
**Goal:** Make app available to users

### Android Distribution
| Task | Priority | Status |
|------|----------|--------|
| Download final APK from EAS | High | ⬜ |
| Create GitHub Release with APK attached | High | ⬜ |
| Write installation instructions for Android users | High | ⬜ |
| Test fresh install on another Android device | High | ⬜ |

### PWA Distribution
| Task | Priority | Status |
|------|----------|--------|
| Choose hosting: Vercel / Netlify / GitHub Pages | High | ⬜ |
| Deploy web build | High | ⬜ |
| Test PWA install on iPhone (Add to Home Screen) | High | ⬜ |
| Test PWA on Android browser | Medium | ⬜ |
| Add PWA URL to README | High | ⬜ |

---

## Phase 6: Post-Launch (Future Enhancements)
**Goal:** Iterate based on feedback

| Feature | Priority | Status |
|---------|----------|--------|
| Push notifications (requires dev build) | Medium | ⬜ |
| Widget for Android home screen | Low | ⬜ |
| Data export (JSON/CSV) | Medium | ⬜ |
| Data import | Medium | ⬜ |
| Cloud sync (would need backend) | Low | ⬜ |
| Habit templates/presets | Low | ⬜ |
| Dark/light theme toggle | Low | ⬜ |
| Habit archiving improvements | Low | ⬜ |
| Habit categories/tags | Low | ⬜ |
| Weekly email summary (would need backend) | Low | ⬜ |

---

## Assets Needed

| Asset | Dimensions | Format | Status |
|-------|------------|--------|--------|
| App Icon | 1024x1024 | PNG | ⬜ |
| Adaptive Icon (Android) | 1024x1024 | PNG | ⬜ |
| Splash Screen | 1284x2778 | PNG | ⬜ |
| PWA Icon (small) | 192x192 | PNG | ⬜ |
| PWA Icon (large) | 512x512 | PNG | ⬜ |
| Favicon | 32x32 | PNG/ICO | ⬜ |
| Screenshots (for README) | Various | PNG | ⬜ |

---

## Accounts Needed

| Service | Purpose | Cost | Status |
|---------|---------|------|--------|
| Expo | Build service | Free | ⬜ |
| GitHub | Code hosting + APK releases | Free | ⬜ |
| Vercel OR Netlify | PWA hosting | Free | ⬜ |
| Apple Developer | iOS App Store (OPTIONAL) | $99/year | ❌ Not needed |
| Google Play | Play Store (OPTIONAL) | $25 one-time | ❌ Not needed |

---

## Quick Reference Commands

```bash
# Development
npx expo start                    # Start dev server
npx expo start --web              # Start web version

# Android Build
eas build --platform android --profile preview   # Dev/test APK
eas build --platform android --profile production # Production APK

# Web/PWA Build
npx expo export:web               # Export static web files
npx vercel --prod                 # Deploy to Vercel

# OTA Updates (after initial build)
eas update --branch production --message "Description"
```

---

## Timeline Estimate

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Polish | 1-2 hours |
| Phase 2: Android Build | 2-3 hours (includes waiting for build) |
| Phase 3: PWA Setup | 2-3 hours |
| Phase 4: GitHub Setup | 1 hour |
| Phase 5: Deployment | 1 hour |
| **Total** | **~8-12 hours** |

---

## Notes

- Focus on Android first (your primary use case)
- PWA is a bonus for iPhone friends
- Don't overcomplicate - ship MVP, iterate later
- Push notifications won't work until proper dev build is made
- All core functionality works without a backend

---

*Last updated: November 2024*

