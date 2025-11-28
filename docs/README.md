## Daily Ritual – Documentation Index

This folder contains the living documentation for the **Daily Ritual** app. It’s meant to stay short and practical while still being detailed enough for future contributors (or future you) to quickly understand how things work and where to extend them.

- **What this app is**:  
  Daily Ritual is an Expo / React Native habit system with:
  - Daily and weekly check‑off habits
  - Timed habits with a focused timer flow
  - Streaks and “streaks at risk” warnings
  - Calendar heatmap view
  - Stats / performance dashboard
  - Optional notifications and motivational “power phrases”

### Docs structure

- `architecture.md` – High‑level architecture (navigation, state management, data flow, and modules)
- `state-and-data.md` – How habits, completions, timer state, reviews, and settings are modelled and persisted
- `screens.md` – Responsibilities and behaviour of each screen
- `components.md` – Reusable UI components and how they fit together
- `development.md` – How to run, debug, and extend the app
- `roadmap-and-release.md` – How this codebase connects to the product roadmap and release process

As you add features, **prefer adding or extending a focused doc** (for example a new `notifications.md` or `sync.md`) rather than bloating the existing ones.

### Quick start for new contributors

- **Read first**: `architecture.md` → `state-and-data.md`  
- **Then**: skim `screens.md` for the feature area you care about  
- **When coding**: keep the single source of truth rules from `state-and-data.md` in mind (all app‑level state lives in `AppContext`, persistence in `storage.ts`).


