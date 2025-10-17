# Authentication System

## Overview

The StableRent application now includes a comprehensive authentication system supporting both traditional email/password login and Web3 wallet-based authentication.

## Features

### Authentication Methods

1. **Email/Password Authentication**
   - Traditional registration with email and password
   - Password must be at least 8 characters
   - Email verification required (backend sends verification email)
   - Password reset functionality available

2. **Wallet-Based Authentication**
   - Sign In With Ethereum (SIWE) standard
   - No password required
   - Wallet signature serves as authentication
   - Seamless integration with existing wallet connection

## Pages

### Public Pages (No Authentication Required)
- `/` - Home page
- `/for-residents` - Information for residents
- `/for-property-owners` - Information for property owners
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/create` - Payment setup (read-only without auth)
- `/subscriptions` - Subscription management (read-only without auth)
- `/settings` - Payment settings (read-only without auth)

### Protected Pages (Authentication Required)
- None currently - all pages are publicly accessible
- Note: `/settings` displays additional account actions when authenticated

## Components

### AuthContext (`/src/contexts/AuthContext.tsx`)

Manages global authentication state including:
- User object
- Authentication token
- Login/logout methods
- Token persistence via localStorage

**Usage:**
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Check authentication
  if (isAuthenticated) {
    console.log('Logged in as:', user.displayName);
  }
}
```

### Conditional Content Display

Instead of protecting entire routes, the app now shows conditional content based on authentication:
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <>
      {/* Public content always visible */}
      <div>...</div>
      
      {/* Auth-only content */}
      {isAuthenticated && (
        <div>Authenticated user content: {user.displayName}</div>
      )}
    </>
  );
}
```

## API Integration

### Automatic Token Handling

The API client (`/src/lib/api.ts`) automatically:
- Retrieves auth token from localStorage
- Includes token in Authorization header
- Supports manual token override if needed

**Example:**
```tsx
// Token is automatically included
const response = await apiClient.get('/api/users/me/payment-addresses');
```

## User Flow

### Registration Flow

1. User visits `/register`
2. Chooses registration method (email or wallet)
3. **Email Method:**
   - Enters email, password, and optional profile info
   - Receives verification email
   - Must verify email before full access
4. **Wallet Method:**
   - Connects wallet via header button
   - Signs authentication message
   - Automatically logged in upon registration

### Login Flow

1. User visits `/login` (or is redirected when accessing protected route)
2. Chooses login method (email or wallet)
3. **Email Method:**
   - Enters email and password
   - Redirected to intended page or home
4. **Wallet Method:**
   - Connects wallet if not already connected
   - Signs authentication message
   - Automatically logged in

### Logout Flow

1. User clicks their name in the header (goes to `/settings`)
2. On the Profile tab, clicks "Sign Out" button
3. Token is invalidated on backend
4. Local auth state cleared
5. Redirected to home page

### Disconnect Wallet

Users can disconnect their wallet from the Profile tab in Settings:
1. Go to `/settings` → Profile tab
2. Scroll to "Account Actions"
3. Click "Disconnect Wallet"
4. Wallet is disconnected (but user remains logged in if using email auth)

## Header Authentication UI

The header displays:
- **Left Side:** StableRent logo
- **Center:** Navigation menu ([Home] [Set Up Payment] [Settings])
- **Right Side:**
  - Wallet connection status (shows connected address or "Connect MetaMask" button)
  - **Not Authenticated:** "Sign In" button → goes to `/login`
  - **Authenticated:** Profile button showing user's display name → goes to `/settings`
  - Mobile menu toggle (mobile)

## Security Features

1. **Token Storage:** JWT tokens stored in localStorage
2. **Auto-verification:** Token verified on app load
3. **Protected Routes:** Automatic redirect for unauthorized access
4. **Signature-based Wallet Auth:** Cryptographic proof of wallet ownership
5. **Rate Limiting:** Backend implements rate limiting on auth endpoints

## Backend Integration

The frontend integrates with these backend endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/wallet/generate-message` - Generate SIWE message
- `GET /api/auth/me` - Get current user info

## Environment Variables

Ensure the following is set in `.env`:

```
VITE_API_URL=http://localhost:3001
```

## Testing

To test the authentication system:

1. **Start the backend:** `cd backend && npm run dev`
2. **Start the frontend:** `cd frontend && npm run dev`
3. **Test Email Registration:**
   - Go to `/register`
   - Fill in email/password form
   - Check backend logs for verification email (if email service is configured)
4. **Test Wallet Registration:**
   - Connect MetaMask via header
   - Go to `/register`
   - Select "Wallet Only" tab
   - Sign the message
   - Verify auto-login
5. **Test Profile & Settings:**
   - Login
   - Click profile button in header (goes to `/settings`)
   - Verify Profile tab shows account info
   - Click "Sign Out" button
   - Verify redirect to home and logged out
   - Visit `/settings` while logged out
   - Verify "Sign In to Your Account" button appears in Account Actions

## Future Enhancements

Potential improvements:
- Two-factor authentication (2FA)
- Social login (Google, GitHub, etc.)
- Multiple wallet connections per account
- Session management page
- Account deletion
- Profile editing

