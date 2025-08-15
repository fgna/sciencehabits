# 🤖 Android APK Pipeline Setup Guide

This guide will help you set up the automated Android APK generation pipeline for ScienceHabits.

## 🚀 Quick Start (10 minutes)

### 1. Create GitHub Workflow
First, manually create the workflow file (GitHub OAuth limitation):

1. Go to your repository on GitHub
2. Create new file: `.github/workflows/android-release.yml`
3. Copy the contents from the workflow file in this repository
4. Commit directly on GitHub

### 2. Generate Keystore
```bash
# Generate your production keystore (use a secure password!)
./scripts/generate-keystore.sh "your_very_secure_password"

# Convert to base64 for GitHub secrets
base64 -w 0 release.keystore > keystore.base64
```

### 2. Configure GitHub Secrets
Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 4 secrets:
| Secret Name | Value |
|-------------|-------|
| `ANDROID_KEYSTORE` | Contents of `keystore.base64` file |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_ALIAS` | `sciencehabits` |
| `KEY_PASSWORD` | Your keystore password |

### 3. Test the Pipeline
```bash
# Commit and push to trigger the workflow
git add .
git commit -m "Add Android APK pipeline"
git push origin main
```

**That's it!** 🎉 Your APK will be generated automatically and available in GitHub Actions artifacts.

## 📱 How It Works

### Automatic Triggers
- **Push to main**: Creates debug APK for testing
- **Tagged release** (`git tag v1.0.0`): Creates signed release APK
- **Manual**: Via GitHub Actions UI

### Build Outputs
- **Debug APK**: `ScienceHabits-v1.0.0-debug-20250815_2100.apk`
- **Release APK**: `ScienceHabits-v1.0.0-release-123.apk`

## 🔐 Security Notes

- ✅ Keystore files are automatically ignored by git
- ✅ All sensitive data stored in GitHub secrets
- ✅ APK signing happens securely in CI/CD
- ❌ Never commit keystore files to git
- ❌ Never share keystore passwords

## 📋 Next Steps

1. **Create your first release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Download and test APK**:
   - Go to GitHub Actions → Latest workflow run
   - Download APK from artifacts
   - Install on Android device: `adb install app.apk`

3. **Optional: Set up Play Store upload** (see `docs/ANDROID_PIPELINE.md`)

## 🆘 Need Help?

- **Build failing?** Check GitHub Actions logs
- **APK won't install?** Ensure "Install unknown apps" is enabled
- **Questions?** See full documentation in `docs/ANDROID_PIPELINE.md`

---

**Ready to go mobile!** 📱✨