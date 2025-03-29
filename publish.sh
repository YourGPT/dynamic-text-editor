#!/bin/bash

# Get the current version from package.json
current_version=$(node -p "require('./package.json').version")

# Ask for version bump type
echo "Current version: $current_version"
echo "Select version bump type:"
echo "1) patch (x.x.X)"
echo "2) minor (x.X.0)"
echo "3) major (X.0.0)"
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    bump_type="patch"
    ;;
  2)
    bump_type="minor"
    ;;
  3)
    bump_type="major"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Ask if user wants to bypass linting
read -p "Bypass linting? (y/n): " bypass_lint

if [ "$bypass_lint" = "y" ]; then
  # Run build without linting
  npm run build:no-lint
  
  # Bump version
  npm version $bump_type
  
  # Publish to npm with --ignore-scripts flag to bypass prepublishOnly
  npm publish --ignore-scripts
else
  # Run normal build with linting
  npm run build
  
  # Bump version
  npm version $bump_type
  
  # Publish to npm normally with all checks
  npm publish
fi

echo "Published successfully!" 