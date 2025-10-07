# Google OAuth Setup Guide for AWS Cognito

This guide walks you through integrating Google OAuth with your Checkmate application using AWS Cognito.

## Prerequisites

- Google OAuth Client ID and Secret (you already have these)
- AWS Cognito User Pool
- Access to AWS Console

---

## Step 1: Configure Google OAuth Credentials

### 1.1 Verify Your Google Cloud Console Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   ```
   https://YOUR_COGNITO_DOMAIN.auth.YOUR_REGION.amazoncognito.com/oauth2/idpresponse
   ```
   
   For example, if your Cognito domain is `checkmate-auth` and region is `us-east-1`:
   ```
   https://us-east-1kar1moteb.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```

5. Also add for local development:
   ```
   https://YOUR_COGNITO_DOMAIN.auth.YOUR_REGION.amazoncognito.com/oauth2/idpresponse
   ```

---

## Step 2: Configure AWS Cognito

### 2.1 Add Google as an Identity Provider

1. Open the **AWS Console** and navigate to **Amazon Cognito**
2. Select your **User Pool**
3. Go to **Sign-in experience** tab
4. Scroll to **Federated identity provider sign-in**
5. Click **Add identity provider**
6. Select **Google**
7. Enter your credentials:
   - **Google app ID**: Your Google OAuth Client ID
   - **Google app secret**: Your Google OAuth Client Secret
   - **Authorized scopes**: `profile email openid`
8. Click **Add identity provider**

### 2.2 Configure App Client Settings

1. Go to **App integration** tab
2. Under **App clients and analytics**, click on your app client
3. Scroll to **Hosted UI settings** (or create a hosted UI)
4. Click **Edit**
5. Configure:
   - **Allowed callback URLs**: Add your application URLs:
     ```
     http://localhost:3000/api/auth/callback
     https://yourdomain.com/api/auth/callback
     ```
   - **Allowed sign-out URLs**: Add your URLs:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - **Identity providers**: Check ✅ **Google**
   - **OAuth 2.0 grant types**: Check ✅ **Authorization code grant**
   - **OpenID Connect scopes**: Check ✅ `email`, `openid`, `profile`
6. Click **Save changes**

### 2.3 Set Up Cognito Domain (if not already configured)

1. In your User Pool, go to **App integration** tab
2. Under **Domain**, click **Actions** → **Create Cognito domain** (or **Create custom domain**)
3. Enter a domain prefix (e.g., `checkmate-auth`)
4. Click **Create**
5. Note your domain: `https://YOUR_DOMAIN.auth.YOUR_REGION.amazoncognito.com`

---

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# AWS Cognito Configuration
COGNITO_REGION="us-east-1"  # Your AWS region
COGNITO_USER_POOL_ID="us-east-1_xxxxxxxxx"  # Your User Pool ID
COGNITO_CLIENT_ID="your-app-client-id"  # Your App Client ID
COGNITO_CLIENT_SECRET="your-app-client-secret"  # Your App Client Secret (if using)
COGNITO_DOMAIN="checkmate-auth"  # Your Cognito domain prefix (without .auth.region.amazoncognito.com)

# Google OAuth (same credentials used in Cognito)
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

**Important**: The `COGNITO_DOMAIN` should be just the prefix, not the full URL.

---

## Step 4: Update Google Cloud Console with Cognito Domain

1. Return to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_COGNITO_DOMAIN.auth.YOUR_REGION.amazoncognito.com/oauth2/idpresponse
   ```
   Replace `YOUR_COGNITO_DOMAIN` with your actual domain prefix and `YOUR_REGION` with your AWS region.

5. Click **Save**

---

## Step 5: Test the Integration

### 5.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/sign-in`

3. Click **Sign in with Google**

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to your app at the homepage

### 5.2 Verify User Creation

1. Go to AWS Console → Cognito → Your User Pool
2. Click on **Users** tab
3. You should see the new user created with Google federation
4. The username will be in the format: `Google_<google-user-id>`

---

## Common Issues & Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://YOUR_COGNITO_DOMAIN.auth.YOUR_REGION.amazoncognito.com/oauth2/idpresponse
```

### Issue: "invalid_client" Error

**Solution**: 
- Verify `COGNITO_CLIENT_ID` and `COGNITO_CLIENT_SECRET` in `.env.local`
- Make sure the app client has the correct settings in Cognito

### Issue: User is redirected but not signed in

**Solution**:
- Check browser console for errors
- Verify the callback URL is correctly configured in both Google and Cognito
- Ensure cookies are being set (check browser developer tools → Application → Cookies)

### Issue: "Identity provider not found" Error

**Solution**:
- Make sure Google is added as an identity provider in Cognito
- Verify the app client has Google enabled in the Hosted UI settings

---

## Security Best Practices

1. **Never commit secrets**: Ensure `.env.local` is in `.gitignore`
2. **Use HTTPS in production**: Configure SSL/TLS for your domain
3. **Rotate secrets regularly**: Update Google OAuth credentials periodically
4. **Limit scopes**: Only request necessary OAuth scopes (`email`, `openid`, `profile`)
5. **Monitor access**: Use AWS CloudWatch to monitor authentication events

---

## Architecture Overview

```
User clicks "Sign in with Google"
         ↓
/api/auth/google generates Cognito OAuth URL
         ↓
User redirected to Cognito Hosted UI
         ↓
Cognito redirects to Google OAuth
         ↓
User signs in with Google
         ↓
Google redirects back to Cognito
         ↓
Cognito redirects to /api/auth/callback with auth code
         ↓
/api/auth/callback exchanges code for tokens
         ↓
User data fetched and session created
         ↓
User redirected to homepage (/)
```

---

## Additional Resources

- [AWS Cognito User Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cognito Social Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html)

---

## Next Steps

Once Google OAuth is working:
- Consider adding more OAuth providers (Facebook, Apple, etc.)
- Implement profile completion for OAuth users
- Set up email verification for federated users (if required)
- Configure user attribute mapping in Cognito
