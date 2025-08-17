#!/bin/bash

# Git Hooks Setup Script for ScienceHabits
# Sets up comprehensive git hooks to prevent TypeScript errors and maintain code quality

set -e

echo "🔧 Setting up Git hooks for ScienceHabits..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Create git hooks directory if it doesn't exist
if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
    print_status "Created .git/hooks directory"
fi

# Copy pre-commit hook
if [ -f ".githooks/pre-commit" ]; then
    cp .githooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    print_success "✅ Pre-commit hook installed"
else
    print_error "Pre-commit hook source not found at .githooks/pre-commit"
    exit 1
fi

# Copy pre-push hook
if [ -f ".githooks/pre-push" ]; then
    cp .githooks/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    print_success "✅ Pre-push hook installed"
else
    print_warning "Pre-push hook source not found, skipping"
fi

# Test the hooks
print_status "🧪 Testing git hooks..."

# Test pre-commit hook
print_status "Testing pre-commit hook with current codebase..."
if .git/hooks/pre-commit; then
    print_success "✅ Pre-commit hook test passed"
else
    print_error "❌ Pre-commit hook test failed"
    print_error "Please fix issues before committing code"
    exit 1
fi

# Add npm scripts for manual hook execution
print_status "📝 Adding npm scripts for manual validation..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
fi

# Add scripts to package.json using node
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add validation scripts
pkg.scripts = pkg.scripts || {};
pkg.scripts['validate:pre-commit'] = '.git/hooks/pre-commit';
pkg.scripts['validate:pre-push'] = '.git/hooks/pre-push';
pkg.scripts['validate:typescript'] = 'npx tsc --noEmit';
pkg.scripts['validate:all'] = 'npm run validate:typescript && npm run validate:pre-commit';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Added validation scripts to package.json');
"

# Create documentation
cat > .githooks/README.md << 'EOF'
# Git Hooks for ScienceHabits

This directory contains git hooks that automatically validate code quality before commits and pushes.

## Installed Hooks

### Pre-commit Hook
Runs before every commit and validates:
- ✅ TypeScript compilation (no errors)
- ✅ Content validation
- ✅ ESLint critical errors
- ✅ Common problematic patterns (debugger, console.log)
- ✅ Build verification
- ✅ Commit message format
- ✅ File size checks
- ✅ Package.json validation

### Pre-push Hook
Runs before every push and validates:
- ✅ Full TypeScript build
- ✅ Test suite (if available)

## Manual Validation

You can manually run these validations using npm scripts:

```bash
# Run pre-commit checks
npm run validate:pre-commit

# Run pre-push checks
npm run validate:pre-push

# Run only TypeScript validation
npm run validate:typescript

# Run all validations
npm run validate:all
```

## Bypassing Hooks (Emergency Only)

In extreme cases, you can bypass hooks with:

```bash
# Skip pre-commit hook
git commit --no-verify -m "Emergency commit"

# Skip pre-push hook
git push --no-verify
```

**⚠️ Warning**: Only use `--no-verify` in true emergencies. The hooks exist to prevent broken code from entering the repository.

## Hook Configuration

The hooks are configured to:
- **Block commits** with TypeScript errors
- **Block commits** with ESLint errors (not warnings)
- **Block commits** with debugger statements
- **Block pushes** with build failures
- **Block pushes** with test failures
- **Warn** about console.log statements (non-blocking)
- **Warn** about TODO comments (non-blocking)

## Troubleshooting

### "TypeScript compilation failed"
- Run `npm run typecheck` to see detailed errors
- Fix all TypeScript errors before committing

### "Build failed"
- Run `npm run build` to see build errors
- Ensure all dependencies are installed (`npm install`)

### "ESLint errors"
- Run `npx eslint src --ext .ts,.tsx` to see errors
- Fix critical ESLint errors (warnings are allowed)

### "Hook not executable"
- Run `chmod +x .git/hooks/pre-commit .git/hooks/pre-push`

For more help, see the project documentation or contact the development team.
EOF

print_success "✅ Created git hooks documentation"

# Final summary
echo ""
print_success "🎉 Git hooks setup complete!"
echo ""
echo "Installed hooks:"
echo "  📋 Pre-commit: TypeScript validation, linting, and code quality checks"
echo "  🚀 Pre-push: Full build and test validation"
echo ""
echo "Available npm scripts:"
echo "  npm run validate:pre-commit    # Run pre-commit checks manually"
echo "  npm run validate:pre-push      # Run pre-push checks manually"
echo "  npm run validate:typescript    # Run TypeScript validation only"
echo "  npm run validate:all           # Run all validations"
echo ""
echo "From now on, git will automatically:"
echo "  ✅ Prevent commits with TypeScript errors"
echo "  ✅ Prevent commits with critical ESLint errors"
echo "  ✅ Prevent commits with debugger statements"
echo "  ✅ Prevent pushes with build failures"
echo "  ✅ Warn about console.log statements and TODOs"
echo ""
print_status "Your code quality is now protected! 🛡️"