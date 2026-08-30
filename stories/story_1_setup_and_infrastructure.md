# Story 1: Setup and Infrastructure

**Title:** Project Setup, Database Schema Initialization, and Hosting Deployment

## Goal
Establish a robust, fast-loading development environment with the necessary database schema and real-time backend capabilities to support the gamified challenge.

## Target Requirements Mapped
- Recommended Stack: React + Vite + Tailwind CSS, Supabase, Vercel/Netlify.

## Tasks to be Completed
- [ ] Initialize the React project using Vite with TypeScript.
- [ ] Install and configure Tailwind CSS for utility-first styling.
- [ ] Setup a Supabase project and define the database schema:
  - `players` table: `id` (UUID), `name` (text, mandatory), `created_at` (timestamp), `score` (integer, default 0), `session_ended` (boolean, default false).
  - `bug_reports` table: `id` (UUID), `player_id` (foreign key to players.id), `bug_id` (text, identifying the specific pre-defined bug element), `title` (text), `description` (text), `created_at` (timestamp).
- [ ] Apply database-level constraints and basic index on `player_id` and `bug_id` to guarantee unique bugs reported per user.
- [ ] Configure environment variables (`.env.local`) to securely store Supabase client keys and access points.
- [ ] Setup the initial repository and deploy a skeleton build to Vercel/Netlify to confirm automatic HTTPS validation (mandatory for QR Code scanning).

## Acceptance Criteria
- [ ] The web app compiles cleanly using Vite without warnings or errors.
- [ ] Supabase connection is successfully verified from the frontend client.
- [ ] Overwriting or sending data to the `players` or `bug_reports` tables functions properly with row-level security or clean test queries.
- [ ] The app is publicly accessible over HTTPS (Vercel/Netlify URL).
