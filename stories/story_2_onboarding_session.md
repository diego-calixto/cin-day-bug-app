# Story 2: Onboarding & Session Management (Mobile)

**Title:** Mobile Onboarding Registration & Player Session Initialization

## Goal
Provide a seamless, mobile-optimized entry screen where players register their names, initializing a dedicated game session before the countdown begins.

## Target Requirements Mapped
- **RF01 - Onboarding (Mobile):** User enters landing page via QR Code, inserts a mandatory name, and clicks "Start Challenge".
- **RNF01 - Responsiveness:** Mobile-optimized screen layout.

## Tasks to be Completed
- [ ] Build a landing/onboarding page optimized for portrait orientation on mobile devices (iOS/Android).
- [ ] Add a mandatory text input for `Name` with proper validation (non-empty, strip leading/trailing spaces, maximum character length of 30).
- [ ] Add a prominent, highly-interactive "Start Challenge" button.
- [ ] Implement player registration logic:
  - On submit, write a new row to the Supabase `players` table containing the validated Name.
  - Store the returned player session ID (`player_id`) and the player's name in `localStorage` to ensure persistence across potential accidental page reloads.
- [ ] Redirect the user automatically to the Store Game page upon successful initialization.

## Acceptance Criteria
- [ ] Accessing the app on a mobile browser loads the onboarding form quickly and fits perfectly within the viewport.
- [ ] Attempting to start the challenge without entering a name triggers an inline validation error.
- [ ] Clicking "Start Challenge" successfully inserts the player's name into the database, caches their session locally, and redirects them to the game page.
