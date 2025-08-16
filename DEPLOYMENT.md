# Deployment Guide - Environment Variables

## Vercel Environment Variable Setup

Since the admin credentials are stored in environment variables (not committed to git for security), you need to configure them in Vercel's dashboard.

### Step 1: Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `sciencehabits` project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Environment Variables
Add these environment variables in Vercel:

| Variable Name | Value | Environment |
|---------------|--------|-------------|
| `REACT_APP_ADMIN_EMAIL` | `fg-lists@gmx.de` | All Environments |
| `REACT_APP_ADMIN_PASSWORD` | `AdminPass123!` | All Environments |
| `REACT_APP_SECONDARY_ADMIN_EMAIL` | `admin@example.com` | All Environments |
| `REACT_APP_SECONDARY_ADMIN_PASSWORD` | `TestPassword123!` | All Environments |

### Step 3: Environment Settings
- **Environment**: Select "All Environments" (Production, Preview, Development)
- **Git Branch**: Leave blank to apply to all branches

### Step 4: Redeploy
After adding the environment variables:
1. Go to **Deployments** tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Alternative: Vercel CLI Method

You can also set environment variables using Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add REACT_APP_ADMIN_EMAIL
# Enter: fg-lists@gmx.de
# Select: All Environments

vercel env add REACT_APP_ADMIN_PASSWORD
# Enter: AdminPass123!
# Select: All Environments

vercel env add REACT_APP_SECONDARY_ADMIN_EMAIL
# Enter: admin@example.com
# Select: All Environments

vercel env add REACT_APP_SECONDARY_ADMIN_PASSWORD
# Enter: TestPassword123!
# Select: All Environments

# Trigger redeploy
vercel --prod
```

## Security Notes

- Environment variables in Vercel are secure and not exposed in the client bundle
- `REACT_APP_` prefix makes them available to React at build time
- The credentials are encrypted and only accessible to your Vercel team
- Consider using stronger passwords for production

## Verification

After deployment, test the admin login at:
- Production: `https://your-domain.vercel.app/#admin`
- Use email: `fg-lists@gmx.de`
- Use password: `AdminPass123!`

## Local Development

For local development, ensure you have `.env.local` file with the same variables:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your actual credentials
# (This file is already created and ignored by git)
```

### Testing Environment Variables

To verify your environment variables are properly configured:

```bash
# Test local development (loads .env.local automatically)
npm start
# Then visit: http://localhost:3000/#admin

# Verify environment setup manually
eval "$(cat .env.local | grep -v '^#' | sed 's/^/export /')" && npm run verify-env
```

### Development vs Production

- **Local Development**: Environment variables are loaded from `.env.local` automatically by React
- **Vercel Production**: Environment variables must be configured in Vercel dashboard
- **Build Process**: Both environments use the same `REACT_APP_` prefixed variables