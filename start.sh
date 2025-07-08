#!/bin/bash

# Start script for My Dashboard Application
echo "🚀 Starting My Dashboard Application..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Start server in background
echo "🖥️  Starting server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start React app
echo "⚛️  Starting React app..."
cd ..
npm run dev &
REACT_PID=$!

echo "✅ Application started successfully!"
echo "📱 Frontend: http://localhost:5173"
echo "🖥️  Backend: http://192.168.7.134:4000"
echo ""
echo "📝 To stop the application, press Ctrl+C"

# Wait for both processes
wait $SERVER_PID $REACT_PID