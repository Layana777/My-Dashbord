import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import Webcam from "react-webcam";
import {
  MessageCircle,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Camera,
  Image,
  VideoIcon,
  X,
  RotateCcw,
  Download,
  Check,
  Square,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";

const Chat = () => {
  const socketRef = useRef(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessage] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsername, setTypingUsername] = useState("");

  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamMode, setWebcamMode] = useState("photo"); // "photo" or "video"
  const [capturedImage, setCapturedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);

  // Webcam configuration options
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
    // Additional constraints you can use:
    // aspectRatio: 16/9,
    // frameRate: 30,
    // deviceId: "specific-device-id" // if you want to select specific camera
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://192.168.7.149:4000");
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

    socket.on("user_typing", (data) => {
      console.log("user_typing event received:", data);
      setIsTyping(data.isTyping);
      setTypingUsername(data.username);
    });

    return () => {
      socket.off("user_joined");
      socket.off("users_list");
      socket.off("receive_message");
      socket.off("typing");
      socket.off("user_left");
    };
  }, []);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } else {
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [isRecording]);

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
        timestamp: new Date().toISOString(),
        isSystem: false,
        isOwn: true,
      };
      setText("");
      socketRef.current.emit("typing", {
        isTyping: false,
        username: username,
      });
      socketRef.current.emit("send_message", message);
    }
  };

  // Webcam handlers
  const handleCaptureImage = () => {
    setWebcamMode("photo");
    setShowWebcam(true);
    setShowMediaOptions(false);
    setCapturedImage(null);
  };

  const handleUploadImage = () => {
    // Create file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          // Add uploaded image to messages
          const message = {
            id: Date.now(),
            username: username,
            text: "Uploaded an image",
            imageUrl: event.target.result,
            timestamp: new Date().toISOString(),
            isSystem: false,
            isOwn: true,
          };
          setMessage((prev) => [...prev, message]);
          socketRef.current.emit("send_message", message);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setShowMediaOptions(false);
  };

  const handleRecordVideo = () => {
    setWebcamMode("video");
    setShowWebcam(true);
    setShowMediaOptions(false);
    setRecordedVideo(null);
    setRecordedChunks([]);
  };

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  // Start video recording
  const startRecording = useCallback(() => {
    setRecordedChunks([]);
    setIsRecording(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [webcamRef]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Handle recorded data
  const handleDataAvailable = useCallback(({ data }) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  }, []);

  // Create video blob when recording stops
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
    }
  }, [recordedChunks, isRecording]);

  // Send captured photo
  const sendCapturedPhoto = () => {
    if (capturedImage) {
      const message = {
        id: Date.now(),
        username: username,
        text: "Captured a photo",
        imageUrl: capturedImage,
        timestamp: new Date().toISOString(),
        isSystem: false,
        isOwn: true,
      };
      socketRef.current.emit("send_message", message);
      closeWebcam();
    }
  };

  // Send recorded video
  const sendRecordedVideo = () => {
    if (recordedVideo) {
      const message = {
        id: Date.now(),
        username: username,
        text: "Recorded a video",
        videoUrl: recordedVideo,
        timestamp: new Date().toISOString(),
        isSystem: false,
        isOwn: true,
      };

      socketRef.current.emit("send_message", message);
      closeWebcam();
    }
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Close webcam
  const closeWebcam = () => {
    setShowWebcam(false);
    setCapturedImage(null);
    setRecordedVideo(null);
    setRecordedChunks([]);
    setIsRecording(false);
    setRecordingTime(0);
  };

  // Retake photo/video
  const retake = () => {
    setCapturedImage(null);
    setRecordedVideo(null);
    setRecordedChunks([]);
  };

  // Download captured media
  const downloadMedia = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
              <button
                onClick={() => setShowMediaOptions(true)}
                className="w-full py-2 px-4 bg-white/50 hover:bg-white/70 text-gray-800 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Attach Media
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
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Shared image"
                          className="mt-2 rounded-lg max-w-full h-auto max-h-64 object-cover"
                        />
                      )}
                      {message.videoUrl && (
                        <video
                          src={message.videoUrl}
                          controls
                          className="mt-2 rounded-lg max-w-full h-auto max-h-64"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && typingUsername !== username ? (
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
                      {typingUsername} is typing...
                    </span>
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 bg-white/40 backdrop-blur-sm border-t border-white/20 flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowMediaOptions(!showMediaOptions)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Paperclip className="w-5 h-5 text-gray-600" />
              </button>

              {/* Media Options Menu */}
              {showMediaOptions && (
                <div className="absolute bottom-full mb-2 left-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/40 p-2 min-w-[160px]">
                  <button
                    onClick={handleCaptureImage}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm text-gray-700"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Image</span>
                  </button>
                  <button
                    onClick={handleUploadImage}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm text-gray-700"
                  >
                    <Image className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    onClick={handleRecordVideo}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm text-gray-700"
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>Record Video</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7BBDE8] to-[#49769F] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">
                {webcamMode === "photo" ? "Capture Photo" : "Record Video"}
              </h3>
              <button
                onClick={closeWebcam}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Webcam Content */}
            <div className="p-6">
              <div className="relative bg-black rounded-xl overflow-hidden">
                {!capturedImage && !recordedVideo && (
                  <Webcam
                    ref={webcamRef}
                    audio={webcamMode === "video"}
                    videoConstraints={videoConstraints}
                    screenshotFormat="image/jpeg"
                    className="w-full h-auto"
                  />
                )}

                {/* Show captured image */}
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-auto"
                  />
                )}

                {/* Show recorded video */}
                {recordedVideo && (
                  <video
                    src={recordedVideo}
                    controls
                    className="w-full h-auto"
                  />
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      REC {formatTime(recordingTime)}
                    </span>
                  </div>
                )}

                {/* Switch camera button */}
                {!capturedImage && !recordedVideo && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-center space-x-4">
                {webcamMode === "photo" && !capturedImage && (
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] hover:from-[#6BB0E5] hover:to-[#3E6891] rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                )}

                {webcamMode === "video" && !recordedVideo && (
                  <>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                      >
                        <VideoIcon className="w-8 h-8 text-white" />
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                      >
                        <Square className="w-8 h-8 text-white" />
                      </button>
                    )}
                  </>
                )}

                {/* Action buttons for captured media */}
                {(capturedImage || recordedVideo) && (
                  <div className="flex space-x-4">
                    <button
                      onClick={retake}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadMedia(
                          capturedImage || recordedVideo,
                          webcamMode === "photo"
                            ? "captured-image.jpg"
                            : "recorded-video.webm"
                        )
                      }
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={
                        webcamMode === "photo"
                          ? sendCapturedPhoto
                          : sendRecordedVideo
                      }
                      className="px-6 py-3 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] hover:from-[#6BB0E5] hover:to-[#3E6891] text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-gray-600">
                <span>Camera: {facingMode === "user" ? "Front" : "Back"}</span>
                <span>•</span>
                <span>Resolution: 1280x720</span>
                {webcamMode === "video" && (
                  <>
                    <span>•</span>
                    <span>Format: WebM</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
