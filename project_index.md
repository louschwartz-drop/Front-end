# Droppr.ai Frontend Project Index

Overview of the frontend architecture and key components.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand
- **Real-time**: Socket.io-client
- **Payments**: Stripe
- **Styling**: Tailwind CSS 4, Framer Motion, Lucide React
- **Rich Text**: Tiptap / Quill

## Directory Structure
- [src/app/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/app) - Main pages and layout (Route Groups used for isolation).
- [src/components/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/components) - Reusable UI components.
- [src/context/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/context) - React Context providers (Sockets).
- [src/store/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/store) - Zustand stores for global state.
- [src/lib/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/lib) - Shared libraries and configurations.
- [src/utils/](file:///d:/Code/ClientProjects/droppr.ai-frontend/src/utils) - Helper functions.
- [public/](file:///d:/Code/ClientProjects/droppr.ai-frontend/public) - Static assets (images, logos).

## Route Catalog (`src/app`)

### Page Groups
- **(landing)**: Main entry landing page.
- **(auth)**: Login, Signup, and Authentication flows.
- **(user)**: User dashboard, campaigns, and settings.
- **(admin)**: Admin-only management portal.

## Global State & Context

### Zustand Stores (`src/store`)
- `adminAuthStore`: Manages admin session and data.
- `userAuthStore`: Manages user session and profiles.
- `filesStore`: Handling file uploads and management.

### React Contexts (`src/context`)
- `SocketContext`: Global socket connection for users.
- `AdminSocketContext`: Socket connection specifically for admin features.

## Key Integrations
- **Stripe**: Handled in `(user)/billing` or similar routes.
- **AWS S3**: Client-side uploads (if applicable) or backend signatures.
- **Google OAuth**: Integrated for auth flows.
