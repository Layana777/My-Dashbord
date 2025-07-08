# My Dashboard - React Chat Application

A real-time chat application with video calling capabilities built with React, Socket.IO, and WebRTC.

## Features

- 📱 Real-time messaging
- 🎥 Video calling
- 📞 Audio calling
- 📸 Photo capture and sharing
- 🎬 Video recording and sharing
- 👥 User presence indicators
- 🔴 Typing indicators
- 📱 Responsive design

## Tech Stack

### Frontend
- React 19.1.0
- Vite (build tool)
- TailwindCSS (styling)
- Socket.IO Client
- React Webcam
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- Socket.IO
- CORS

## Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install
```

## Configuration

The application is configured with environment variables:

### Frontend (.env)
```
REACT_APP_SERVER_URL=http://localhost:4000
REACT_APP_SERVER_IP=http://192.168.7.134:4000
NODE_ENV=development
```

### Server (server/.env)
```
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
```

## Running the Application

### Development Mode

1. Start the server:
```bash
npm run server:dev
```

2. Start the React app:
```bash
npm run dev
```

### Production Mode

1. Build the React app:
```bash
npm run build
```

2. Start the server:
```bash
npm run server
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Server
- `npm run server` - Start server in production mode
- `npm run server:dev` - Start server in development mode with nodemon

## Network Access

The server is configured to accept connections from:
- localhost
- 127.0.0.1
- Local network IPs (192.168.x.x)
- Private network IPs (10.x.x.x)

## Usage

1. Open the application in your browser
2. Enter a username to join the chat
3. Start messaging with other users
4. Use the camera icon to capture photos or record videos
5. Click the phone or video icons next to users to initiate calls

## File Structure

```
My-Dashbord/
├── public/
├── src/
│   ├── components/
│   │   ├── IncomingCallModal.jsx
│   │   ├── Layout.jsx
│   │   ├── MediaCapture.jsx
│   │   ├── Sidebar.jsx
│   │   ├── UsersSidebar.jsx
│   │   ├── VideoCall.jsx
│   │   └── VideoCallModal.jsx
│   ├── Pages/
│   │   ├── Chat.jsx
│   │   └── ProfilePage.jsx
│   ├── App.jsx
│   └── main.jsx
├── server/
│   ├── server.js
│   └── package.json
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
