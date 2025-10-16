# Auth0 Setup Guide for OAuth 2.0 + SMART on FHIR

This guide will walk you through setting up Auth0 for your AI on FHIR application with SMART on FHIR scopes.

## Prerequisites

- An Auth0 account (free tier is sufficient for development)
- Basic understanding of OAuth 2.0 flows

## Step 1: Create Auth0 Application

1. Log into your Auth0 Dashboard
2. Navigate to **Applications** → **Applications**
3. Click **Create Application**
4. Choose **Single Page Application** (SPA)
5. Name it something like "AI FHIR Assistant"

## Step 2: Configure Application Settings

In your new application settings:

### Basic Information
- **Name**: AI FHIR Assistant
- **Application Type**: Single Page Application

### Application URIs
- **Allowed Callback URLs**: 
  ```
  http://localhost:3000/api/auth/callback/auth0
  ```
- **Allowed Logout URLs**: 
  ```
  http://localhost:3000
  ```
- **Allowed Web Origins**: 
  ```
  http://localhost:3000
  ```

### Advanced Settings → Grant Types
Make sure these are enabled:
- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (for development ease)

## Step 3: Create Auth0 API

1. Navigate to **Applications** → **APIs**
2. Click **Create API**
3. Configure:
   - **Name**: FHIR API
   - **Identifier**: `https://your-fhir-api` (this becomes your audience)
   - **Signing Algorithm**: RS256

## Step 4: Configure SMART on FHIR Scopes

In your API settings, go to **Scopes** tab and add:

```
patient/*.read    - Read access to all patient resources
user/*.read       - Read access to all user resources  
openid            - OpenID Connect standard scope
profile           - User profile information
email             - User email address
fhirUser          - SMART on FHIR user context
```

## Step 5: Set Up Custom Claims (Optional)

If you want to add custom claims to your JWT tokens:

1. Go to **Auth Pipeline** → **Rules** (or **Actions** in newer Auth0)
2. Create a new rule to add SMART context:

```javascript
function addSmartClaims(user, context, callback) {
  const namespace = 'https://your-fhir-api/';
  
  // Add SMART on FHIR specific claims
  context.idToken[namespace + 'smart_style_url'] = 'https://your-app.com/smart-style.json';
  context.accessToken[namespace + 'smart_style_url'] = 'https://your-app.com/smart-style.json';
  
  // Add user role (you can customize this logic)
  const userRole = user.app_metadata && user.app_metadata.role ? user.app_metadata.role : 'practitioner';
  context.accessToken[namespace + 'role'] = userRole;
  
  callback(null, user, context);
}
```

## Step 6: Environment Configuration

Copy the example environment files and fill in your Auth0 values:

### Backend (.env)
```bash
cp backend/.env.example backend/.env
```

Fill in:
- `AUTH0_DOMAIN`: Your Auth0 domain (e.g., "your-tenant.auth0.com")
- `AUTH0_AUDIENCE`: Your API identifier (e.g., "https://your-fhir-api")

### Frontend (.env.local)
```bash
cp frontend/src/.env.local.example frontend/.env.local
```

Fill in:
- `AUTH0_DOMAIN`: Same as backend
- `AUTH0_CLIENT_ID`: From your Auth0 Application settings
- `AUTH0_CLIENT_SECRET`: From your Auth0 Application settings
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

## Step 7: Test the Setup

1. Start your application:
   ```bash
   docker-compose up --build
   ```

2. Navigate to `http://localhost:3000`
3. Click the login button
4. You should be redirected to Auth0's login page
5. After successful login, you should see your user info and SMART scopes

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that your callback URL in Auth0 matches exactly: `http://localhost:3000/api/auth/callback/auth0`

2. **"Invalid audience"**
   - Ensure your AUTH0_AUDIENCE in both frontend and backend matches your API identifier

3. **"JWT verification failed"**
   - Check that your AUTH0_DOMAIN is correct and includes `https://`
   - Verify your API is using RS256 signing

4. **CORS errors**
   - Make sure your frontend URL is in "Allowed Web Origins" in Auth0

### Debug Mode

Enable debug mode to see detailed logs:
- Frontend: Set `NEXTAUTH_DEBUG=true` in `.env.local`
- Backend: Set `AUTH_DEBUG=true` in `.env`

## Production Considerations

When deploying to production:

1. **Update URLs**: Change all localhost URLs to your production domains
2. **Secure Secrets**: Use proper secret management for production
3. **Enable HTTPS**: Auth0 requires HTTPS for production applications
4. **Configure CORS**: Update CORS settings for your production frontend URL
5. **Rate Limiting**: Consider implementing rate limiting for your API endpoints

## SMART on FHIR Compliance Notes

This implementation provides:
- ✅ OAuth 2.0 authorization flow
- ✅ SMART scopes (patient/*.read, user/*.read)
- ✅ JWT token validation
- ✅ Scope-based authorization
- ✅ User context in API calls
- ✅ FHIR-compliant data filtering

For full SMART on FHIR compliance in production, you would also need:
- Patient selection workflow
- EHR integration capabilities
- FHIR server conformance statement
- Additional SMART scopes as needed