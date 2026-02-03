# AuthFlow Platform - Frontend

A professional authentication platform built with Next.js, React, and Tailwind CSS. Features secure user authentication with email/password and Google OAuth integration.

## Features

- ✅ User Registration with email/password
- ✅ User Login with email/password
- ✅ Google OAuth Authentication
- ✅ Protected Dashboard
- ✅ Responsive Design (Mobile-first)
- ✅ Professional UI with Orange Color Scheme
- ✅ Form Validation
- ✅ Error Handling
- ✅ Loading States
- ✅ JWT Token Management

## Tech Stack

- **Framework**: Next.js 16.0.3
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **OAuth**: @react-oauth/google
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Configure environment variables in `.env.local`:
```env
# Backend API URL (required)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Google OAuth Client ID (required for Google login)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Important**: Both environment variables are required:
- `NEXT_PUBLIC_API_URL`: The base URL of your backend API
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID from Google Cloud Console

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.js          # Root layout with providers
│   ├── page.js            # Home page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Protected dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/                # UI primitives
│   └── auth/              # Auth components
├── contexts/              # React contexts
│   └── AuthContext.js     # Auth state management
├── hooks/                 # Custom hooks
│   └── useAuth.js         # Auth hook
└── services/              # API services
    ├── api.js             # Axios configuration
    └── authService.js     # Auth API calls
```

## Pages

### Home (`/`)
Landing page with navigation and feature highlights.

### Register (`/register`)
User registration page with:
- Name, email, password fields
- Password confirmation
- Form validation
- Google OAuth option
- Orange color scheme

### Login (`/login`)
User login page with:
- Email and password fields
- Form validation
- Google OAuth option
- Error handling

### Dashboard (`/dashboard`)
Protected page accessible after authentication:
- User profile display
- Account information
- Logout functionality
- Success indicators

## Components

### Button
Reusable button component with variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `disabled`: boolean

### Input
Reusable input component with validation.

**Props:**
- `type`: string
- `label`: string
- `name`: string
- `value`: string
- `onChange`: function
- `error`: string
- `required`: boolean

### GoogleLoginButton
Google OAuth authentication button.

**Props:**
- `onSuccess`: function
- `onError`: function

## API Integration

The frontend communicates with the backend API at `/api/v1/auth`:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/google/verify` - Verify Google OAuth

## Authentication Flow

1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in API requests
5. Auto-logout on 401 errors

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes (for Google login) |

## Building for Production

```bash
npm run build
npm start
```

## Design System

### Colors
- Primary: Orange (#FF8C42)
- Background: White with orange gradients
- Text: Gray scale
- Error: Red

### Typography
- Font: Geist Sans
- Headings: Bold, large
- Body: Medium weight

### Spacing
- Consistent padding and margins
- Responsive breakpoints

## Professional Practices

- ✅ Component-based architecture
- ✅ Separation of concerns
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation
- ✅ Accessibility
- ✅ Responsive design
- ✅ Code documentation

## License

MIT
