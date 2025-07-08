// components/VideoCallModal.js
import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";

const VideoCallModal = ({ callId, socket, isVideoCall, onEndCall }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

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

    // Socket event listeners for WebRTC signaling
    socket.on("webrtc_offer", handleReceiveOffer);
    socket.on("webrtc_answer", handleReceiveAnswer);
    socket.on("webrtc_ice_candidate", handleReceiveIceCandidate);
    socket.on("participant_muted", handleParticipantMuted);
    socket.on("participant_video_toggled", handleParticipantVideoToggled);

    return () => {
      cleanup();
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("participant_muted");
      socket.off("participant_video_toggled");
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc_ice_candidate", {
            callId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        setConnectionStatus(peerConnection.connectionState);
        if (peerConnection.connectionState === "connected") {
          setConnectionStatus("connected");
        }
      };

      // Create and send offer (caller initiates)
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("webrtc_offer", { callId, offer });
    } catch (error) {
      console.error("Error initializing call:", error);
      setConnectionStatus("failed");
    }
  };

  const handleReceiveOffer = async (data) => {
    try {
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
    // Handle remote participant mute/unmute
    console.log(
      `Participant ${data.username} is ${data.isMuted ? "muted" : "unmuted"}`
    );
  };

  const handleParticipantVideoToggled = (data) => {
    // Handle remote participant video toggle
    console.log(
      `Participant ${data.username} turned video ${
        data.isVideoOff ? "off" : "on"
      }`
    );
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

        socket.emit("toggle_video", {
          callId,
          isVideoOff: !videoTrack.enabled,
        });
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
    cleanup();
    onEndCall();
  };

  return (
    <div
      className={`fixed inset-0 bg-black z-50 flex flex-col ${
        isFullscreen ? "" : "p-4"
      }`}
    >
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-white text-sm font-medium">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Connection Failed"}
            </span>
          </div>
          <span className="text-white/70 text-sm">
            {formatCallDuration(callDuration)}
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

          <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

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
        </div>

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
          <button className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200">
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

        {/* Additional Controls */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-white/70 text-sm">
          <span>{isMuted ? "Microphone off" : "Microphone on"}</span>
          {isVideoCall && (
            <>
              <span>•</span>
              <span>{isVideoOff ? "Camera off" : "Camera on"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
