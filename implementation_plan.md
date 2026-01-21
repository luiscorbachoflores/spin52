# Implementation Plan: Spotify Full Playback Integration

## Goal Description
Enable users to log in with their Spotify account directly within the application to access full track playback (instead of 30s previews) and save albums to their library. This will be achieved by integrating the **Spotify Web Playback SDK** and implementing a proper **OAuth 2.0 Authorization Code Flow**.

## User Review Required
> [!IMPORTANT]
> **Spotify Premium Required**: The Web Playback SDK **only** works for Spotify Premium users. Free users will not be able to use the in-app player.
>
> **Development Mode**: For the API integration to work, the Spotify Developer Dashboard must have the correct Redirect URIs configured (`http://localhost:5612/callback` or similar).

## Proposed Changes

### Backend (`/backend`)
#### [MODIFY] [server.js](file:///home/pi/spin52/backend/server.js)
-   **Add Routes**:
    -   `GET /api/auth/spotify/login`: Initiates the OAuth flow, redirecting user to Spotify.
    -   `GET /api/auth/spotify/callback`: Handles the code exchange for Access/Refresh tokens.
    -   `GET /api/auth/spotify/token`: Endpoint for the frontend to retrieve/refresh the access token.
    -   `POST /api/spotify/library/check`: Check if album is in user's library.
    -   `PUT /api/spotify/library/save`: Add album to user's library.
-   **Dependencies**: Requires storing Refresh Tokens (can use cookie-session or simple memory/DB for this MVP).

### Frontend (`/frontend`)
#### [NEW] [SpotifyAuthContext.jsx](file:///home/pi/spin52/frontend/src/context/SpotifyAuthContext.jsx)
-   Manage `accessToken`, `user` profile state.
-   Provide `login` and `logout` methods.

#### [NEW] [WebPlayer.jsx](file:///home/pi/spin52/frontend/src/components/WebPlayer.jsx)
-   Implement the `Spotify.Player` initialization.
-   Render a persistent **Player Bar** (at the bottom of the screen) with controls: Play/Pause, Next/Prev, Volume, Track Info.
-   Handle player state changes (active device, current track).

#### [MODIFY] [AlbumDetail.jsx](file:///home/pi/spin52/frontend/src/components/AlbumDetail.jsx)
-   **Conditional Rendering**:
    -   If **connected**: Show a prominent "Reproducir en App" (Play in App) button and "Guardar en Spotify" (Save to Library) button.
    -   If **not connected**: Show the existing Iframe (fallback for previews) and a "Conectar con Spotify" CTA.
-   **Logic**: Clicking "Play" calls the `play` function of the SDK context with the Album URI.

#### [MODIFY] [App.jsx](file:///home/pi/spin52/frontend/src/App.jsx)
-   Wrap the application in `SpotifyAuthProvider`.
-   Place the `WebPlayer` component globally so playback continues while navigating.

## Verification Plan

### Automated Tests
-   Not applicable for OAuth/SDK visual flows.

### Manual Verification
1.  **Auth Flow**:
    -   Click "Conectar con Spotify".
    -   Verify redirect to Spotify consent screen.
    -   Verify return to App with active session.
2.  **Playback**:
    -   Navigate to an album.
    -   Click "Play".
    -   Verify music starts playing in the Global Player Bar.
    -   Verify full song playback (cross-check with 30s limit).
3.  **Library Interaction**:
    -   Click "Guardar en Spotify".
    -   Verify the album appears in the real Spotify App library.
