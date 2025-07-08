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

// Store active calls
const activeCalls = new Map();

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

  // Handle call initiation
  socket.on("initiate_call", (data) => {
    const callerUsername = users.get(socket.id);
    const { targetUsername, callType } = data;

    // Find target user's socket ID
    const targetSocketId = Array.from(users.entries()).find(
      ([_, username]) => username === targetUsername
    )?.[0];

    if (targetSocketId) {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store call information
      activeCalls.set(callId, {
        callId,
        caller: callerUsername,
        callerSocketId: socket.id,
        target: targetUsername,
        targetSocketId,
        callType,
        status: "pending",
        startTime: new Date().toISOString(),
      });

      // Send call initiation confirmation to caller
      socket.emit("call_initiated", {
        callId,
        targetUser: targetUsername,
        callType,
      });

      // Send incoming call notification to target
      io.to(targetSocketId).emit("incoming_call", {
        callId,
        caller: callerUsername,
        callType,
      });

      console.log(`Call initiated: ${callerUsername} -> ${targetUsername} (${callType})`);
    } else {
      socket.emit("call_error", {
        message: "Target user not found or not online",
      });
    }
  });

  // Handle call response (accept/reject)
  socket.on("call_response", (data) => {
    const { callId, response } = data;
    const call = activeCalls.get(callId);

    if (call) {
      if (response === "accept") {
        // Update call status
        call.status = "accepted";
        call.acceptTime = new Date().toISOString();

        // Notify both parties that call was accepted
        io.to(call.callerSocketId).emit("call_accepted", {
          callId,
          acceptedBy: call.target,
        });
        io.to(call.targetSocketId).emit("call_accepted", {
          callId,
          acceptedBy: call.target,
        });

        console.log(`Call accepted: ${call.caller} <-> ${call.target}`);
      } else if (response === "reject") {
        // Notify caller that call was rejected
        io.to(call.callerSocketId).emit("call_rejected", {
          callId,
          rejectedBy: call.target,
        });

        // Remove call from active calls
        activeCalls.delete(callId);

        console.log(`Call rejected: ${call.caller} -> ${call.target}`);
      }
    } else {
      socket.emit("call_error", {
        message: "Call not found",
      });
    }
  });

  // Handle call end
  socket.on("end_call", (data) => {
    const { callId } = data;
    const call = activeCalls.get(callId);

    if (call) {
      // Notify both parties that call ended
      io.to(call.callerSocketId).emit("call_ended", {
        callId,
        endedBy: users.get(socket.id),
      });
      io.to(call.targetSocketId).emit("call_ended", {
        callId,
        endedBy: users.get(socket.id),
      });

      // Remove call from active calls
      activeCalls.delete(callId);

      console.log(`Call ended: ${call.caller} <-> ${call.target}`);
    }
  });

  // Handle WebRTC signaling
  socket.on("webrtc_offer", (data) => {
    const { callId, offer } = data;
    const call = activeCalls.get(callId);

    if (call) {
      const targetSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
      io.to(targetSocketId).emit("webrtc_offer", {
        callId,
        offer,
        from: users.get(socket.id),
      });
    }
  });

  socket.on("webrtc_answer", (data) => {
    const { callId, answer } = data;
    const call = activeCalls.get(callId);

    if (call) {
      const targetSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
      io.to(targetSocketId).emit("webrtc_answer", {
        callId,
        answer,
        from: users.get(socket.id),
      });
    }
  });

  socket.on("webrtc_ice_candidate", (data) => {
    const { callId, candidate } = data;
    const call = activeCalls.get(callId);

    if (call) {
      const targetSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
      io.to(targetSocketId).emit("webrtc_ice_candidate", {
        callId,
        candidate,
        from: users.get(socket.id),
      });
    }
  });

  // Handle participant mute/unmute
  socket.on("toggle_mute", (data) => {
    const { callId, isMuted } = data;
    const call = activeCalls.get(callId);
    const username = users.get(socket.id);

    if (call && username) {
      // Notify other participant about mute status
      const targetSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
      io.to(targetSocketId).emit("participant_muted", {
        username,
        isMuted,
      });
      
      console.log(`${username} ${isMuted ? 'muted' : 'unmuted'} in call ${callId}`);
    }
  });

  // Handle participant video toggle
  socket.on("toggle_video", (data) => {
    const { callId, isVideoOff } = data;
    const call = activeCalls.get(callId);
    const username = users.get(socket.id);

    if (call && username) {
      // Notify other participant about video status
      const targetSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
      io.to(targetSocketId).emit("participant_video_toggled", {
        username,
        isVideoOff,
      });
      
      console.log(`${username} turned video ${isVideoOff ? 'off' : 'on'} in call ${callId}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = users.get(socket.id);

    if (username) {
      // End any active calls involving this user
      for (const [callId, call] of activeCalls.entries()) {
        if (call.callerSocketId === socket.id || call.targetSocketId === socket.id) {
          const otherSocketId = call.callerSocketId === socket.id ? call.targetSocketId : call.callerSocketId;
          io.to(otherSocketId).emit("call_ended", {
            callId,
            endedBy: username,
            reason: "User disconnected",
          });
          activeCalls.delete(callId);
        }
      }

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
