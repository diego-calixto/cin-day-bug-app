# Story 5: Live Leaderboard/Ranking Dashboard (Desktop)

**Title:** Real-Time Stand Leaderboard Screen for Large Desktop Displays

## Goal
Build an ultra-responsive, visually stunning Full HD live ranking board that keeps the event stand high-energy by showcasing the top players in real time.

## Target Requirements Mapped
- **RF07 - Ranking em Tempo Real (Desktop):** Live Full HD ranking displaying the Top 10 users with Names and Scores.
- **RNF01 - Responsiveness:** Optimized for Full HD (1080p) large-format display screens.

## Tasks to be Completed
- [ ] Design a dedicated `/leaderboard` desktop-optimized screen with a high-end theme (dark mode, sleek gradients, glowing typography fitting for a Motorola stand).
- [ ] Build the Leaderboard ranking table displaying:
  - Top 10 Rank Position (1st with a special gold styling, 2nd silver, 3rd bronze).
  - Player Name.
  - Total Bug Points Score.
  - Time/Date of completion (as a tie-breaker).
- [ ] Integrate Supabase Realtime channel listening:
  - Subscribe to real-time `INSERT`/`UPDATE` events on the `players` table.
  - Automatically re-query or dynamically update the local ranking state when changes are broadcasted.
- [ ] Implement a fallback polling mechanism (e.g., re-fetching the Top 10 every 5 seconds) if WebSockets fail to connect.
- [ ] Add professional, smooth entrance/sorting animations for the leaderboard rows using CSS or Framer Motion to make score transitions feel dynamic and "alive".

## Acceptance Criteria
- [ ] The Leaderboard matches full HD (1920x1080) dimensions perfectly without horizontal or vertical scrolling.
- [ ] As soon as a mobile player finishes their game or submits a bug (or when a player's score increments), the ranking updates instantly on the TV screen without manual refreshes.
- [ ] Only the Top 10 players are listed, sorted in descending order by score and then ascending order by the time/date of creation (faster completes win ties).
