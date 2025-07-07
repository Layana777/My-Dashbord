const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5174", // React app URL
    methods: ["GET", "POST"],
  },
});

// Enable CORS for Express
app.use(cors());
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

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
