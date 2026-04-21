# Social Authentication Implementation Plan

Implement OAuth 2.0 login with Google, Facebook, Microsoft, and X (Twitter) to capture user identity (name/email) and persist it in `session.USUARIO`/`session.EMAIL` variables for inclusion in Word export documents.

## Summary

This feature adds enterprise-grade social authentication to identify process executors, storing their credentials globally for display in generated Word documents while maintaining offline capability and GDPR compliance.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Google    │  │  Facebook   │  │  Microsoft  │  │    X     │ │
│  │   OAuth 2.0 │  │   OAuth     │  │    OIDC     │  │  OAuth   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │
│         └─────────────────┴─────────────────┴──────────────┘     │
│                           │                                      │
│                    ┌────────▼────────┐                            │
│                    │   NextAuth.js   │  (v4.24.13 already installed)
│                    │   (/api/auth)   │                            │
│                    └────────┬────────┘                            │
│                             │                                     │
│                    ┌────────▼────────┐                            │
│                    │   Auth Store    │  (Zustand + Persistence)   │
│                    │ (session.user)  │                            │
│                    └────────┬────────┘                            │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    PROCESS LAYER                                │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────┐    │
│  │              ProcessState (Extended)                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │   userInfo   │  │  userName    │  │  userEmail   │ │◄───┼─ NEW FIELDS
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Word Generator   │  ← Includes user in      │
│                    │  (word-generator) │    document header       │
│                    └───────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Files

### New Files (6)

| File | Purpose |
|------|---------|
| `nextjs_space/app/api/auth/[...nextauth]/route.ts` | NextAuth.js API route with 4 OAuth providers |
| `nextjs_space/lib/auth-store.ts` | Zustand store with `USUARIO` and `EMAIL` global variables |
| `nextjs_space/app/auth/signin/page.tsx` | Login UI with social provider buttons |
| `nextjs_space/components/session-provider.tsx` | NextAuth SessionProvider wrapper |
| `nextjs_space/components/auth-sync.tsx` | Sync NextAuth session with Zustand store |
| `nextjs_space/components/user-profile.tsx` | Header component showing logged user |

### Modified Files (4)

| File | Changes |
|------|---------|
| `nextjs_space/lib/types.ts` | Add `userInfo` field to `ProcessState` interface |
| `nextjs_space/lib/word-generator.ts` | Add user info section to Word document |
| `nextjs_space/app/layout.tsx` | Add SessionProvider and AuthSync |
| `nextjs_space/lib/session-store.ts` | Include user info when creating processes |

## Technical Specifications

### 1. Auth Store Schema

```typescript
interface AuthStore {
  USUARIO: string;        // Global variable: user name
  EMAIL: string;          // Global variable: user email
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    provider: 'google' | 'facebook' | 'azure-ad' | 'twitter';
  } | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}
```

### 2. ProcessState Extension

```typescript
export interface ProcessState {
  // ... existing fields ...
  userInfo?: {
    userId: string;
    userName: string;
    userEmail: string;
    userImage?: string;
    provider: string;
    authenticatedAt: string;
  };
}
```

### 3. Environment Variables Required

```env
# NextAuth
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

FACEBOOK_CLIENT_ID=<from-facebook-developers>
FACEBOOK_CLIENT_SECRET=<from-facebook-developers>

AZURE_AD_CLIENT_ID=<from-azure-portal>
AZURE_AD_CLIENT_SECRET=<from-azure-portal>
AZURE_AD_TENANT_ID=common

TWITTER_CLIENT_ID=<from-twitter-developer-portal>
TWITTER_CLIENT_SECRET=<from-twitter-developer-portal>
```

## Word Document Integration

The generated Word document will include a new section:

```
═══════════════════════════════════════════════════════
INFORMACIÓN DEL EJECUTOR
═══════════════════════════════════════════════════════
Nombre:    John Doe
Email:     john.doe@example.com
Provider:  GOOGLE
Autenticado:  17/04/2026, 10:30:45
═══════════════════════════════════════════════════════
```

## GDPR/Privacy Considerations

1. **Consent Required**: Add checkbox for data processing consent before login
2. **Privacy Policy**: Link to privacy policy on login page
3. **Data Retention**: User info stored in:
   - `localStorage` (Auth Store - persists across sessions)
   - `ProcessState` (included in exported JSON/Word)
4. **Right to be Forgotten**: Logout clears Auth Store; process data remains in exports
5. **Anonymous Mode**: Allow "Continue as Guest" option

## Provider Setup Guide

### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret

### Facebook Login
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create App → Add Product → Facebook Login
3. Settings → Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`
4. Copy App ID and App Secret

### Microsoft Azure AD
1. Go to [Azure Portal](https://portal.azure.com/) → App registrations
2. New registration → Single tenant or Multitenant
3. Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Certificates & secrets → New client secret
5. Copy Application (client) ID and Secret

### X (Twitter) OAuth 2.0
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Projects & Apps → Create App
3. User authentication settings → OAuth 2.0
4. Callback URI: `http://localhost:3000/api/auth/callback/twitter`
5. Copy Client ID and Secret

## Dependencies Already Installed

From `package.json`:
- `next-auth: ^4.24.13` ✓
- `@next-auth/prisma-adapter: 1.0.7` ✓
- `zustand: ^5.0.12` ✓ (with persist middleware)
- `lz-string: ^1.5.0` ✓ (compression for localStorage)

No new dependencies required.

## Testing Strategy

1. **Unit Tests**: Auth store actions (setUser, logout)
2. **Integration Tests**: OAuth callback flow simulation
3. **E2E Tests**: Login → Create Process → Export Word → Verify user info present

## Future Enhancements (Out of Scope)

- [ ] Role-based access control (RBAC)
- [ ] User preferences persistence
- [ ] Activity audit log
- [ ] Multi-factor authentication
- [ ] Session timeout warnings
- [ ] "Remember me" functionality

## Estimated Effort

- **Implementation**: 4-6 hours
- **Testing**: 2-3 hours
- **Documentation**: 1 hour
- **Total**: 7-10 hours

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth provider rate limiting | Medium | High | Implement retry logic, cache tokens |
| localStorage quota exceeded | Low | Medium | Compress data, cleanup old processes |
| GDPR non-compliance | Low | High | Add consent checkbox, privacy policy |
| Provider API changes | Low | Medium | Use NextAuth.js (handles abstractions) |

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [X API Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
