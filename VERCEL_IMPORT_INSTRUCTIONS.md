# Vercel Environment Variables Import

## 📋 Quick Copy-Paste for Vercel Dashboard

The `.env` file in your project root contains all the environment variables needed for Vercel deployment.

### Step 1: Copy Environment Variables

Open the `.env` file in your project and copy each variable to Vercel:

```
REACT_APP_ADMIN_EMAIL=fg-lists@gmx.de
REACT_APP_ADMIN_PASSWORD=AdminPass123!
REACT_APP_SECONDARY_ADMIN_EMAIL=admin@example.com
REACT_APP_SECONDARY_ADMIN_PASSWORD=TestPassword123!
```

### Step 2: Add to Vercel Dashboard

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

2. For each variable above:
   - **Name**: Copy the part before `=` (e.g., `REACT_APP_ADMIN_EMAIL`)
   - **Value**: Copy the part after `=` (e.g., `fg-lists@gmx.de`)
   - **Environment**: Select **All Environments**

3. Click **Save** after adding all 4 variables

### Step 3: Redeploy

- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

## ✅ Verification

Once deployed, test admin access at:
- **URL**: `https://your-vercel-domain.vercel.app/#admin`
- **Login**: `fg-lists@gmx.de` / `AdminPass123!`

## 🔒 Security Note

The `.env` file is included in git for easy Vercel import, but:
- Contains only non-sensitive admin credentials for this demo
- `.env.local` (with your actual local credentials) remains git-ignored
- Consider updating passwords after initial setup