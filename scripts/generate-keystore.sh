#!/bin/bash
# Generate Android signing keystore for ScienceHabits

set -e

KEYSTORE_NAME="release.keystore"
KEY_ALIAS="sciencehabits"
VALIDITY_YEARS=25

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Generating Android keystore for ScienceHabits...${NC}"

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo -e "${RED}❌ keytool not found. Please install Java JDK.${NC}"
    exit 1
fi

# Check if password provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: $0 <keystore_password>${NC}"
    echo "Example: $0 'your_secure_password'"
    exit 1
fi

KEYSTORE_PASSWORD="$1"

# Validate password strength
if [ ${#KEYSTORE_PASSWORD} -lt 8 ]; then
    echo -e "${RED}❌ Password must be at least 8 characters long${NC}"
    exit 1
fi

# Check if keystore already exists
if [ -f "$KEYSTORE_NAME" ]; then
    echo -e "${RED}⚠️  Keystore already exists: $KEYSTORE_NAME${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm "$KEYSTORE_NAME"
fi

echo -e "${BLUE}📝 Generating keystore with the following details:${NC}"
echo "  Keystore: $KEYSTORE_NAME"
echo "  Alias: $KEY_ALIAS"
echo "  Validity: $VALIDITY_YEARS years"
echo "  Organization: ScienceHabits"
echo "  Country: DE"

# Generate the keystore
keytool -genkeypair \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity $(($VALIDITY_YEARS * 365)) \
  -keystore "$KEYSTORE_NAME" \
  -dname "CN=ScienceHabits,OU=Development,O=ScienceHabits,L=Stade,ST=Lower Saxony,C=DE" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEYSTORE_PASSWORD"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Keystore generated successfully: $KEYSTORE_NAME${NC}"
    
    # Display keystore info
    echo -e "\n${BLUE}📋 Keystore Information:${NC}"
    keytool -list -v -keystore "$KEYSTORE_NAME" -storepass "$KEYSTORE_PASSWORD" | head -20
    
    echo -e "\n${BLUE}🔑 For GitHub Secrets, convert keystore to base64:${NC}"
    echo "base64 -w 0 $KEYSTORE_NAME > keystore.base64"
    
    echo -e "\n${BLUE}📝 GitHub Secrets to add:${NC}"
    echo "ANDROID_KEYSTORE=<contents of keystore.base64>"
    echo "KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD"
    echo "KEY_ALIAS=$KEY_ALIAS"
    echo "KEY_PASSWORD=$KEYSTORE_PASSWORD"
    
    echo -e "\n${GREEN}🎉 Keystore generation complete!${NC}"
    
    # Security reminder
    echo -e "\n${RED}🔒 SECURITY REMINDER:${NC}"
    echo "- Keep this keystore file secure and backed up"
    echo "- Never commit keystore files to version control"
    echo "- Store the password in a secure password manager"
    echo "- Consider using GitHub's encrypted secrets for CI/CD"
    
else
    echo -e "${RED}❌ Failed to generate keystore${NC}"
    exit 1
fi