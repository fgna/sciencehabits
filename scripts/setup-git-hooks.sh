#!/bin/bash

# Script to install Git hooks for Goal-to-Habit Mapping validation

echo "🔗 Setting up Git hooks for Goal-to-Habit Mapping validation..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Make validation script executable
chmod +x scripts/validate-goal-mappings.js

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Validate goal taxonomy structure"
echo "  • Check goal-to-habit mappings"
echo "  • Test Smart Recommendation Engine"
echo "  • Verify TypeScript compilation"
echo ""
echo "To bypass validation (NOT RECOMMENDED):"
echo "  git commit --no-verify"
echo ""
echo "To run validation manually:"
echo "  node scripts/validate-goal-mappings.js"
echo ""