#!/bin/bash

# Script to create the necessary directory structure for email templates

# Create templates directory
mkdir -p src/templates/emails

# Check if directories were created successfully
if [ $? -eq 0 ]; then
  echo "Email template directories created successfully"
else
  echo "Failed to create email template directories"
  exit 1
fi

# Success
echo "Directory structure setup complete"