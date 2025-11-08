# Google Sign-In Configuration Guide

## Overview
This guide will help you set up Google Sign-In for your FCC CHMS application using Supabase.

## Prerequisites
- A Supabase project (you already have this)
- A Google Cloud Platform account

## Step 1: Configure Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create or Select a Project
- Create a new project or select your existing one
- Project name suggestion: "FCC CHMS Authentication"

### 1.3 Enable Google+ API (if prompted)
- Go to APIs & Services > Library
- Search for "Google+ API"
- Click Enable (this might not be necessary for newer projects)

### 1.4 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: FCC CHMS
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. Add scopes (click **Add or Remove Scopes**):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Click **Save and Continue**
7. Add test users if in testing mode (add your email and any test emails)
8. Click **Save and Continue**

### 1.5 Create OAuth 2.0 Client ID
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Select **Web application** as the application type
4. Name it: "FCC CHMS Web Client"
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-supabase-project.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   ```
7. Click **Create**
8. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these!

## Step 2: Configure Supabase

### 2.1 Get Your Supabase Callback URL
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (cpkgyteugfjcgimykftj)
3. Navigate to **Authentication > Providers**
4. Find **Google** in the list
5. Copy the **Callback URL (for OAuth)** shown there
   - It should look like: `https://cpkgyteugfjcgimykftj.supabase.co/auth/v1/callback`

### 2.2 Enable Google Provider in Supabase
1. In the same **Authentication > Providers** page
2. Find **Google** and toggle it to **Enabled**
3. Paste your **Google Client ID** from Step 1.5
4. Paste your **Google Client Secret** from Step 1.5
5. Click **Save**

## Step 3: Update Your Application URLs

### 3.1 For Development (localhost)
The callback URL is already configured to work with `http://localhost:3000/auth/callback`

### 3.2 For Production
When deploying, update the following:

1. **In Google Cloud Console** (APIs & Services > Credentials):
   - Add your production domain to **Authorized JavaScript origins**
   - Add `https://your-domain.com/auth/callback` to **Authorized redirect URIs**

2. **In your .env.local** (if needed):
   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/login

3. Click the **"Sign in with Google"** button

4. You should be redirected to Google's login page

5. After signing in with Google, you should be redirected back to your dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in your Google Cloud Console exactly matches the Supabase callback URL

### Error: "Access blocked: This app's request is invalid"
**Solution**: 
- Make sure you've configured the OAuth consent screen
- Add yourself as a test user if the app is in testing mode

### Error: "Invalid client: no application name"
**Solution**: Configure the OAuth consent screen with an application name

### Users not appearing in Supabase
**Solution**: Check your Supabase authentication settings and make sure the Google provider is enabled

## Security Best Practices

1. **Never commit secrets**: Don't commit your Google Client Secret to Git
2. **Use environment variables**: Store sensitive data in `.env.local`
3. **Restrict domains**: Only add trusted domains to authorized origins
4. **Review periodically**: Check your Google Cloud Console for any suspicious activity
5. **Use HTTPS in production**: Always use HTTPS for production deployments

## Additional Configuration (Optional)

### Request Additional Scopes
If you need more user information, you can request additional scopes in the `handleGoogleSignIn` function:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
    scopes: 'email profile', // Add more scopes as needed
  },
});
```

### Customize User Profile Creation
The user profile will be automatically created in Supabase. You can customize this in your database triggers or in the auth callback route.

## Files Modified
- ✅ `src/app/login/page.tsx` - Added Google Sign-In button and handler
- ✅ `src/app/auth/callback/route.ts` - Created OAuth callback handler

## Next Steps
1. Follow the steps above to configure Google OAuth
2. Test the sign-in flow
3. Customize the user experience as needed
4. Deploy to production with proper domain configuration

## Support
If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all URLs match exactly
4. Ensure OAuth consent screen is properly configured

---
Last Updated: November 8, 2025
