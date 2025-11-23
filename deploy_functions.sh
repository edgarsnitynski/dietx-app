#!/bin/bash
# Deploy Firebase functions (assumes firebase cli logged in and project set)
set -e
echo "Installing dependencies for functions..."
pushd functions
npm install
echo "Deploying functions..."
firebase deploy --only functions
popd
echo "Deployed functions."
