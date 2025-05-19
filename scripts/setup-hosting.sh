#!/bin/bash

# Script to set up Firebase Hosting targets
# Usage: ./setup-hosting.sh

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it with 'npm install -g firebase-tools'."
    exit 1
fi

# Login to Firebase (if not already logged in)
firebase login

# Add hosting targets
echo "Setting up Firebase Hosting targets..."
firebase target:apply hosting production property-a148c
firebase target:apply hosting staging property-staging

echo "Hosting targets configured successfully!"
echo "You can now use 'npm run deploy:hosting' to deploy to production."
