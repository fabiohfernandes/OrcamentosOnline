#!/bin/bash
# Update Git Remote URL after GitHub Repository Rename
# Run this script AFTER renaming the repository on GitHub

echo "Current remote URL:"
git remote -v

echo ""
echo "Updating remote URL to new repository name..."
git remote set-url origin https://github.com/fabiohfernandes/WebPropostas.git

echo ""
echo "New remote URL:"
git remote -v

echo ""
echo "Testing connection..."
git remote show origin

echo ""
echo "✅ Remote URL updated successfully!"
echo "You can now continue using git push/pull normally."
