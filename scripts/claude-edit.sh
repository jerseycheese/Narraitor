#!/bin/bash

# Helper script for file editing in Claude Code without prompts
# Usage: ./scripts/claude-edit.sh [file_path] [content]

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: File path and content are required"
  echo "Usage: ./scripts/claude-edit.sh [file_path] [content]"
  exit 1
fi

file_path=$1
content=$2

# Check if the file exists
if [ -f "$file_path" ]; then
  echo "Updating file: $file_path"
  echo "$content" > "$file_path"
  echo "File updated successfully."
else
  echo "Creating file: $file_path"
  # Ensure the directory exists
  mkdir -p "$(dirname "$file_path")"
  echo "$content" > "$file_path"
  echo "File created successfully."
fi
