const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const os = require("os");

// Create Express app
const app = express();
const server = http.createServer(app);

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }
  return "localhost";
}

// Configure Socket.IO with CORS for network access
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);

      // Allow localhost and local network IPs
      if (
        origin.match(
          /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/
        )
      ) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  },
});

// Enable CORS for Express
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.match(
          /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/
        )
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Store connected users
const users = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user joining
  socket.on("join", (username) => {
    users.set(socket.id, username);

    console.log("this is users", users);

    // Notify all clients that a user joined
    socket.broadcast.emit("user_joined", {
      username: username,
      message: `${username} joined the chat`,
    });

    // Send current users list to the new user
    const userList = Array.from(users.values());
    io.emit("users_list", userList);

    console.log(`${username} joined the chat`);
  });

  // Handle incoming messages
  socket.on("send_message", (data) => {
    console.log(users);
    const username = users.get(socket.id);

    // Create message object
    const message = {
      id: Date.now(),
      username: username,
      text: data.text,
      timestamp: new Date().toISOString(),
      imageUrl: data.imageUrl || null,
      videoUrl: data.videoUrl || null,
      isSystem: false,
    };

    // Send message to all clients
    io.emit("receive_message", message);

    console.log(`Message from ${username}: ${data.text}`);
  });

  // Handle user typing
  socket.on("typing", (data) => {
    const username = users.get(socket.id);
    socket.broadcast.emit("user_typing", {
      username: username,
      isTyping: data.isTyping,
    });
    console.log(`${username} is typing: ${data.isTyping}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = users.get(socket.id);

    if (username) {
      users.delete(socket.id);

      // Notify all clients that user left
      socket.broadcast.emit("user_left", {
        username: username,
        message: `${username} left the chat`,
      });

      // Send updated users list to all clients
      const userList = Array.from(users.values());
      io.emit("users_list", userList);

      console.log(`${username} disconnected`);
    }
  });
});

// Start server on all network interfaces
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const localIP = getLocalIP();

server.listen(PORT, HOST, () => {
  console.log("🚀 Server is running on:");
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${localIP}:${PORT}`);
  console.log("");
  console.log(
    "You can now access the server from other devices on your network!"
  );
});
