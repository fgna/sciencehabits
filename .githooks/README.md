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
