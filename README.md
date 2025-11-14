# ConvoHub (Chat-Messaging-App — Client)

A lightweight React client for the Chat-Messaging-App (ConvoHub). This repository contains the front-end single-page application used to interact with the chat API and Socket.IO service.

## What this is

- React-based chat client (Create React App style project structure).
- Provides UI for listing chats, opening chat windows, creating groups/private chats, and realtime updates via Socket.IO.

## Features

- Conversation list with search, pinning, and bulk actions.
- Split view for wide screens and single-page navigation on mobile.
- Group creation, private chats, and profile previews.
- Real-time messages and presence via Socket.IO.

## Prerequisites

- Node.js (LTS recommended)
- npm (or yarn)
- A running backend API (the client expects an API to talk to — see Env variables below)

## Quick start (development)

1. Install dependencies

   npm install

2. Provide environment variables

   Create a `.env` (or set in your environment) at the project root with the following if needed:

   REACT_APP_API_URL=http://localhost:3001

   The client stores authentication tokens in `localStorage` (for example `accessToken` and `refreshToken`) when you log in through the app.

3. Start dev server

   npm start

This launches the client (usually on http://localhost:3000) and enables hot-reload.

## Build for production

To create a production build:

   npm run build

The output `build/` folder is suitable to serve from a static host or integrate with your backend.

There is a `deploy.ps1` script present which may be used for deployment on Windows-hosted environments; review it before running.

## Tests

Run the test suite:

   npm test

## Environment variables

- `REACT_APP_API_URL` — base URL for the backend API (default used in code: `http://localhost:3001` when not provided).

The app expects the backend to provide routes for authentication, chat endpoints under `/api/`, and file uploads under `/uploads/` as used in the code.

## Project structure (important client folders)

- `src/` — main React source
  - `pages/` — main page components like `ChatHome`, `ChatWindow`, auth pages
  - `components/` — UI components used across pages
  - `utils/` — helpers (API client, socket wrapper, date utils)
  - `hooks/` — custom React hooks
- `public/` — static HTML and assets
- `build/` — production build output

## Notes

- The client relies on tokens in `localStorage` when making authenticated calls. If you see 401/refresh flows in the console, ensure your backend returns valid refresh tokens.
- For group images and private profile pictures, the client constructs image URLs from returned upload paths and fetches them with authorization headers when necessary.