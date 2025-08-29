#!/bin/bash

# Kill processes running on the specified port
PORT=${1:-3000}

echo "Checking for processes running on port $PORT..."

# Find and kill processes using the specified port
PIDS=$(lsof -ti :$PORT)

if [ -z "$PIDS" ]; then
    echo "No processes found running on port $PORT"
else
    echo "Found processes running on port $PORT: $PIDS"
    echo "Killing processes..."
    echo $PIDS | xargs kill -9
    echo "Processes killed successfully"
fi