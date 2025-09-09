# Vercel Deployment Guide

## Cookie Domain Issue Fix

The "Cookie has been rejected for invalid domain" error occurs because cookies need proper domain configuration for production deployment.

### Environment Variables for Vercel

Set these environment variables in your Vercel project settings:

```bash
# Required Stytch B2B Configuration
STYTCH_BUSINESS_PROJECT_ID=project-live-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
STYTCH_BUSINESS_SECRET=secret-live-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID=organization-live-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_STYTCH_BUSINESS_PUBLIC_TOKEN=public-token-live-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Stytch Cookie Domain (CRITICAL for Vercel)
NEXT_PUBLIC_STYTCH_COOKIE_DOMAIN=support-app-five.vercel.app

# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your-cosmos-db-primary-key
AZURE_COSMOS_DATABASE_ID=support-app

# Deployment Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
COOKIE_DOMAIN=.vercel.app
NODE_ENV=production

# Session Security
SESSION_SECRET=your-very-secure-session-secret-key-here
```

### Key Cookie Domain Settings

**Two different cookie domain variables are needed:**

1. **`NEXT_PUBLIC_STYTCH_COOKIE_DOMAIN`** (Stytch client-side cookies):
   - For your Vercel app: `support-app-five.vercel.app` (exact domain, no leading dot)
   - For custom domains: `yourdomain.com`
   - For localhost: `localhost`

2. **`COOKIE_DOMAIN`** (Application server-side cookies):
   - For Vercel apps: `.vercel.app` (with leading dot for subdomain support)
   - For custom domains: `.yourdomain.com` (with leading dot)
   - For localhost: leave empty or set to `localhost`

### Stytch Configuration Updates

The application has been updated to:
- Set `stytch_session_jwt` cookie (which the auth flow uses)
- Include proper domain configuration for production
- Support both development and production cookie settings

### Code Changes Made

1. **Updated cookie setting in `lib/stytch/session.ts`**:
   ```typescript
   cookieStore.set('stytch_session_jwt', sessionToken, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7, // 1 week
     path: '/',
     ...(process.env.NODE_ENV === 'production' && {
       domain: process.env.COOKIE_DOMAIN || undefined
     })
   })
   ```

2. **Updated cookie clearing to handle all cookie types**:
   ```typescript
   cookieStore.delete('stytch_session_jwt')
   cookieStore.delete('tzv_b2b_token')
   ```

### Vercel Deployment Steps

1. **Push the updated code** to your GitHub repository
2. **Configure environment variables** in Vercel dashboard
3. **Redeploy** the application
4. **Test authentication** flow

### Stytch Dashboard Configuration

Make sure your Stytch B2B project is configured with:
- **Authorized domains**: Include your Vercel domain (e.g., `your-app.vercel.app`)
- **Redirect URLs**: Include your auth callback URLs
- **Organization setup**: Ensure your organization ID matches `NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID`

### Troubleshooting

1. **Check browser developer tools** for cookie settings
2. **Verify environment variables** are set correctly in Vercel
3. **Ensure Stytch domain configuration** matches your deployment URL
4. **Check Next.js logs** in Vercel function logs for authentication errors

### Testing the Fix

After deployment:
1. Clear browser cookies for your domain
2. Navigate to your Vercel app
3. Go through the login flow
4. Check that cookies are set properly in browser dev tools
5. Verify authentication works without redirect loops