import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  MessageCircle,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  Search,
} from "lucide-react";
const Chat = () => {
  const socketRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessage] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000");
    }
    const socket = socketRef.current;

    socket.on("user_joined", (data) => {
      setMessage((prev) => [
        ...prev,
        {
          id: Date.now(),
          username: "System",
          text: data.message,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ]);
    });

    socket.on("users_list", (users) => {
      setUsers(users);
    });

    socket.on("receive_message", (message) => {
      setMessage((prev) => [...prev, message]);
    });

    socket.on("user_left", (data) => {
      setMessage((prev) => [
        ...prev,
        {
          id: Date.now(),
          username: "System",
          text: data.message,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ]);
      setUsers((prev) => prev.filter((user) => user !== data.username));
    });

    return () => {
      socket.off("user_joined");
      socket.off("users_list");
      socket.off("receive_message");
      socket.off("user_left");
    };
  }, []); // Empty dependency array to run once

  console.log("Socket initialized:", messages);

  // console.log("Socket connected:", socketRef.current.connected);

  const mockMessages = [
    {
      id: 1,
      username: "System",
      text: "John joined the chat",
      timestamp: "10:30 AM",
      isSystem: true,
    },
    {
      id: 2,
      username: "Sarah",
      text: "Hey everyone! How's the project going?",
      timestamp: "10:32 AM",
      isOwn: false,
    },
    {
      id: 3,
      username: "You",
      text: "Going great! Just finished the frontend design",
      timestamp: "10:33 AM",
      isOwn: true,
    },
    {
      id: 4,
      username: "Mike",
      text: "Awesome work! Can you share the mockups?",
      timestamp: "10:35 AM",
      isOwn: false,
    },
    {
      id: 5,
      username: "You",
      text: "Sure! I'll upload them in a few minutes",
      timestamp: "10:36 AM",
      isOwn: true,
    },
  ];

  const mockUsers = ["Sarah", "Faisal", "Layana", "Layan", "Amal"];

  const handleJoinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socketRef.current.emit("join", username);
      setIsJoined(true);
    }
  };

  const handleSendMessage = () => {
    if (text.trim() !== "") {
      const message = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString(), //عشان اعرف التاريخ
        isSystem: false,
        isOwn: true,
      };
      setText("");
      socketRef.current.emit("send_message", message);
    }
  };

  const handleChagnge = (e) => {
    setText(e.target.value);

    socketRef.current.emit("typing", {
      isTyping: e.target.value.length > 0,
      username: username,
    });
  };

  if (!isJoined) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Join Team Chat
            </h2>
            <p className="text-gray-600">
              Enter your username to start chatting
            </p>
          </div>

          <form onSubmit={handleJoinChat} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7BBDE8] focus:border-transparent placeholder-gray-500 text-gray-800"
                maxLength={20}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] hover:from-[#6BB0E5] hover:to-[#3E6891] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Join Chat
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Ready to collaborate with your team?
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden h-[calc(100vh-200px)]">
      <div className="flex h-full">
        {/* Users Sidebar - Left */}
        <div className="w-80 bg-white/40 backdrop-blur-sm border-r border-white/20 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Online Users
            </h3>
            <p className="text-sm text-gray-600">{users.length} members</p>
          </div>

          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all duration-200 cursor-pointer"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user[0]}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{user}</p>
                  <p className="text-xs text-gray-600">Online</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 p-4 bg-gradient-to-r from-[#7BBDE8]/20 to-[#49769F]/20 rounded-xl backdrop-blur-sm border border-white/30">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] text-white rounded-lg hover:from-[#6BB0E5] hover:to-[#3E6891] transition-all duration-200 text-sm font-medium">
                Share Screen
              </button>
              <button className="w-full py-2 px-4 bg-white/50 hover:bg-white/70 text-gray-800 rounded-lg transition-all duration-200 text-sm font-medium">
                Invite Members
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area - Right */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#7BBDE8] to-[#49769F] px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Team Chat
                  </h3>
                  <p className="text-white/80 text-sm">5 members online</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                  <Search className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                  <Phone className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                  <Video className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/10 to-white/5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  username === message.username
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.isSystem ? (
                  <div className="bg-[#7BBDE8]/20 text-[#49769F] px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                    {message.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      username === message.username ? "order-2" : "order-1"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                        username === message.username
                          ? "bg-gradient-to-r from-[#7BBDE8] to-[#49769F] text-white rounded-br-sm"
                          : "bg-white/80 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium ${
                            message.isOwn ? "text-white/80" : "text-gray-600"
                          }`}
                        >
                          {message.username}
                        </span>
                        <span
                          className={`text-xs ${
                            message.isOwn ? "text-white/60" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            <div className="flex justify-start">
              <div className="bg-white/80 px-4 py-3 rounded-2xl rounded-bl-sm backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {username} is typing...
                  </span>
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-6 bg-white/20 backdrop-blur-sm border-t border-white/20">
            <div className="flex items-center space-x-4">
              <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                <Paperclip className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={text}
                  onChange={handleChagnge}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7BBDE8] placeholder-gray-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
                  <Smile className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] hover:from-[#6BB0E5] hover:to-[#3E6891] rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
