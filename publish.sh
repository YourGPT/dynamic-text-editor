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

# Run tests and build
# npm run test
npm run build

# Bump version
npm version $bump_type

# Publish to npm
npm publish

echo "Published successfully!" 