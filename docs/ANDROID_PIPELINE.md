# Android APK Pipeline Documentation

## Overview

This document describes the automated Android APK generation and deployment pipeline for ScienceHabits. The pipeline converts our PWA into a native Android app using Trusted Web Activity (TWA) technology.

## Architecture

### Build Strategy: Trusted Web Activity (TWA)
- **Approach**: PWA-native wrapper that maintains full web functionality
- **Benefits**: Single codebase, automatic updates, minimal APK size (~2-3MB)
- **Technology**: PWABuilder CLI + Android Gradle build system

### Pipeline Flow
```
Git Push → GitHub Actions → Build PWA → Generate TWA → Sign APK → Upload Artifacts
```

## Setup Instructions

### 1. Prerequisites
- GitHub repository with appropriate permissions
- Android development knowledge (basic)
- Java 8+ installed locally (for keystore generation)

### 2. Generate Android Keystore

First, generate a signing keystore for your APK:

```bash
# Run the keystore generation script
./scripts/generate-keystore.sh "your_secure_password"

# Convert keystore to base64 for GitHub secrets
base64 -w 0 release.keystore > keystore.base64
```

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ANDROID_KEYSTORE` | Base64-encoded keystore file | `MIIKXgIBAzCCCh...` |
| `KEYSTORE_PASSWORD` | Keystore password | `your_secure_password` |
| `KEY_ALIAS` | Key alias name | `sciencehabits` |
| `KEY_PASSWORD` | Key password | `your_secure_password` |

### 4. Trigger Build

The pipeline automatically triggers on:
- **Push to main branch**: Creates debug APK
- **Tagged release** (`v*`): Creates signed release APK
- **Manual trigger**: Via GitHub Actions interface

## Pipeline Configuration

### Workflow File
Location: `.github/workflows/android-release.yml`

### Key Features
- **Automated PWA validation**: Checks manifest, icons, and bundle size
- **Dual build modes**: Debug (unsigned) and Release (signed)
- **Quality gates**: Bundle size limits, APK validation
- **Artifact management**: Automatic upload with version naming
- **Release integration**: GitHub releases for tagged versions

## Build Outputs

### Debug Builds
- **Trigger**: Push to main branch or manual trigger
- **Output**: `ScienceHabits-v{version}-debug-{timestamp}.apk`
- **Signing**: Unsigned (for testing only)
- **Installation**: Requires "Install unknown apps" permission

### Release Builds  
- **Trigger**: Tagged release (`v1.0.0`, `v1.0.1`, etc.)
- **Output**: `ScienceHabits-v{version}-release-{build}.apk`
- **Signing**: Signed with release keystore
- **Installation**: Ready for distribution/Play Store

## Quality Assurance

### Automated Checks
1. **PWA Validation**:
   - Manifest file presence and validity
   - Required icons availability
   - Bundle size limits (10MB max)

2. **APK Validation**:
   - File generation success
   - Size limits (50MB max)
   - Basic APK structure

3. **Security**:
   - Keystore protection via GitHub secrets
   - No sensitive data in logs
   - Secure artifact handling

### Manual Testing
After downloading an APK:

1. **Install on device**:
   ```bash
   adb install ScienceHabits-v1.0.0-release-123.apk
   ```

2. **Test core functionality**:
   - App launches correctly
   - PWA features work (offline, notifications)
   - Navigation functions properly
   - Data persistence works

## Troubleshooting

### Common Issues

#### Build Fails at "Generate Android Project"
- **Cause**: PWABuilder CLI issues or network problems
- **Solution**: Check PWA manifest validity and retry

#### "No keystore found in secrets"
- **Cause**: Missing GitHub secrets configuration
- **Solution**: Verify all required secrets are properly set

#### APK Size Too Large
- **Cause**: Bundle size exceeds limits
- **Solution**: Optimize PWA bundle size or adjust limits

#### Gradle Build Failures
- **Cause**: Android SDK/dependencies issues
- **Solution**: Check Java version compatibility and Android SDK setup

### Debug Commands

```bash
# Check PWA manifest locally
npx pwa-manifest-validator ./public/manifest.json

# Test PWA build
npm run build
npx serve -s build

# Validate keystore
keytool -list -v -keystore release.keystore
```

## Security Considerations

### Keystore Management
- **Storage**: Keep keystore files secure and backed up
- **Access**: Limit access to release keystore
- **Rotation**: Plan for keystore rotation (Android allows updates)

### GitHub Secrets
- **Scope**: Repository-level secrets only
- **Access**: Only maintainers should have secrets access
- **Audit**: Regular review of secret usage

### APK Distribution
- **Channels**: Only distribute through trusted channels
- **Verification**: Verify APK signatures before distribution
- **Updates**: Monitor for security updates

## Future Enhancements

### Planned Features
- [ ] Automatic Play Store upload
- [ ] Multiple environment support (staging/production)
- [ ] Enhanced testing automation
- [ ] Bundle optimization
- [ ] Performance monitoring

### Integration Opportunities
- [ ] Slack/Discord notifications
- [ ] Quality metrics dashboard
- [ ] Automated testing on real devices
- [ ] Crash reporting integration

## Support

### Resources
- [PWABuilder Documentation](https://docs.pwabuilder.com/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Getting Help
- Check GitHub Actions logs for detailed error information
- Review PWA requirements and Android manifest guidelines
- Contact the development team for pipeline-specific issues

---

*Last Updated: August 15, 2025*
*Pipeline Version: 1.0.0*