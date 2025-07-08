// components/VideoCall.js
import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  Settings,
  Maximize2,
  Minimize2,
  Users,
} from "lucide-react";

const VideoCall = ({
  callId,
  socket,
  username,
  isVideoCall = true,
  onEndCall,
  participants = [],
  remoteUsername = "",
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Call states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [remoteUserMuted, setRemoteUserMuted] = useState(false);
  const [remoteUserVideoOff, setRemoteUserVideoOff] = useState(false);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    initializeCall();
    startCallTimer();

    // Socket event listeners for WebRTC signaling (matching your backend)
    socket.on("webrtc_offer", handleReceiveOffer);
    socket.on("webrtc_answer", handleReceiveAnswer);
    socket.on("webrtc_ice_candidate", handleReceiveIceCandidate);
    socket.on("participant_muted", handleParticipantMuted);
    socket.on("participant_video_toggled", handleParticipantVideoToggled);
    socket.on("call_ended", handleCallEnded);

    return () => {
      cleanup();
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("participant_muted");
      socket.off("participant_video_toggled");
      socket.off("call_ended");
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log("Initializing call with:", { callId, isVideoCall, username });
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true,
      });

      console.log("Got user media stream:", stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        console.log("Adding track to peer connection:", track);
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote stream:", event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setConnectionStatus("connected");
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          socket.emit("webrtc_ice_candidate", {
            callId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        setConnectionStatus(state);
        console.log("Connection state changed:", state);
      };

      // Create and send offer (caller initiates)
      console.log("Creating offer...");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("Sending offer:", offer);
      socket.emit("webrtc_offer", { callId, offer });
    } catch (error) {
      console.error("Error initializing call:", error);
      setConnectionStatus("failed");
      alert("Failed to initialize call. Please check your camera and microphone permissions.");
    }
  };

  const handleReceiveOffer = async (data) => {
    try {
      console.log("Received WebRTC offer");
      const { offer } = data;
      await peerConnectionRef.current.setRemoteDescription(offer);

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("webrtc_answer", { callId, answer });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleReceiveAnswer = async (data) => {
    try {
      console.log("Received WebRTC answer");
      const { answer } = data;
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleReceiveIceCandidate = async (data) => {
    try {
      const { candidate } = data;
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };

  const handleParticipantMuted = (data) => {
    console.log(
      `Participant ${data.username} is ${data.isMuted ? "muted" : "unmuted"}`
    );
    if (data.username !== username) {
      setRemoteUserMuted(data.isMuted);
    }
  };

  const handleParticipantVideoToggled = (data) => {
    console.log(
      `Participant ${data.username} turned video ${
        data.isVideoOff ? "off" : "on"
      }`
    );
    if (data.username !== username) {
      setRemoteUserVideoOff(data.isVideoOff);
    }
  };

  const handleCallEnded = (data) => {
    console.log("Call ended by:", data.endedBy);
    cleanup();
    onEndCall();
  };

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);

        // Emit to your backend (matching your backend events)
        socket.emit("toggle_mute", {
          callId,
          isMuted: !audioTrack.enabled,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        // Emit to your backend (matching your backend events)
        socket.emit("toggle_video", {
          callId,
          isVideoOff: !videoTrack.enabled,
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);

        // Listen for screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: false, // Don't replace audio
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatCallDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleEndCall = () => {
    // Emit to your backend (matching your backend events)
    socket.emit("end_call", { callId });
    cleanup();
    onEndCall();
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500 animate-pulse";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "failed":
        return "Connection Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      className={`${
        isFullscreen ? "fixed inset-0" : "fixed inset-0"
      } bg-black z-50 flex flex-col`}
    >
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}
            ></div>
            <span className="text-white text-sm font-medium">
              {getConnectionStatusText()}
            </span>
          </div>
          <span className="text-white/70 text-sm">
            {formatCallDuration(callDuration)}
          </span>
          <span className="text-white/70 text-sm">
            {isVideoCall ? "Video Call" : "Audio Call"} with {remoteUsername}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Main) */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          {connectionStatus === "connected" ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {remoteUsername ? remoteUsername[0].toUpperCase() : "?"}
                </span>
              </div>
              <p className="text-white text-lg">{remoteUsername}</p>
              <p className="text-white/60 text-sm">
                {getConnectionStatusText()}
              </p>
            </div>
          )}

          {/* Remote user video off overlay */}
          {remoteUserVideoOff && connectionStatus === "connected" && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {remoteUsername ? remoteUsername[0].toUpperCase() : "?"}
                  </span>
                </div>
                <p className="text-white text-lg">{remoteUsername}</p>
                <p className="text-white/60 text-sm">Camera is off</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white/60" />
            </div>
          )}
          {isScreenSharing && (
            <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Screen
            </div>
          )}

          {/* Local user label */}
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* Remote user muted indicator */}
        {remoteUserMuted && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
            <MicOff className="w-4 h-4" />
            <span className="text-sm">{remoteUsername} is muted</span>
          </div>
        )}

        {/* Connection Status Overlay */}
        {connectionStatus !== "connected" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">
                {connectionStatus === "connecting"
                  ? "Connecting to call..."
                  : "Connection failed"}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {connectionStatus === "connecting"
                  ? "Please wait..."
                  : "Please check your connection"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm px-6 py-6">
        <div className="flex items-center justify-center space-x-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video Button */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <VideoIcon className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <Monitor className="w-6 h-6 text-white" />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-white/70 text-sm">
          <span>{isMuted ? "Microphone off" : "Microphone on"}</span>
          {isVideoCall && (
            <>
              <span>•</span>
              <span>{isVideoOff ? "Camera off" : "Camera on"}</span>
            </>
          )}
          {isScreenSharing && (
            <>
              <span>•</span>
              <span>Screen sharing</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
