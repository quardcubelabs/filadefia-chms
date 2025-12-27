# Increasing JWT Expiration Time in Supabase

## Overview
By default, Supabase JWT tokens expire after **3600 seconds (1 hour)**. To prevent frequent session expirations, you can increase this value.

## Steps to Increase JWT Expiration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **JWT Expiry Limit**
5. Change the value to a higher number:
   - `86400` = 24 hours
   - `604800` = 7 days
   - `2592000` = 30 days
   - `31536000` = 1 year (maximum recommended)
6. Click **Save**

### Option 2: Via Supabase CLI

If you're using Supabase CLI, you can update the config:

```bash
# In your supabase/config.toml file
[auth]
jwt_expiry = 604800  # 7 days in seconds
```

Then apply the changes:
```bash
supabase db push
```

## Important Notes

1. **Security Consideration**: Longer JWT expiration times are less secure. Balance convenience with security needs.

2. **Refresh Tokens**: Supabase uses refresh tokens to obtain new JWTs. The client-side code we implemented automatically refreshes tokens before they expire.

3. **Recommended Settings for Church Management System**:
   - **JWT Expiry**: `604800` (7 days) - Good balance for regular users
   - For higher security: `86400` (24 hours) with aggressive client-side refresh

4. **Client-Side Refresh**: Our AuthContext implementation:
   - Refreshes tokens every 30 seconds if expiring within 10 minutes
   - Refreshes on tab/window focus
   - Automatically retries failed operations due to JWT expiration
   - Handles JWT errors gracefully

## What Our Client Code Does

The updated `AuthContext.tsx` includes:

1. **Proactive Refresh**: Checks token expiration every 30 seconds and refreshes if expiring within 10 minutes
2. **Visibility Refresh**: Refreshes token when user returns to the tab
3. **Focus Refresh**: Refreshes token when window gains focus
4. **Retry Logic**: Automatically retries failed database operations if JWT expired
5. **Error Handling**: Gracefully handles JWT errors without disrupting user experience

## Verifying Your Changes

After updating the JWT expiry in Supabase Dashboard:

1. Log out and log back in
2. Check the browser console for token refresh logs
3. The session should persist for the configured duration
4. No more "JWT expired" errors during normal usage
