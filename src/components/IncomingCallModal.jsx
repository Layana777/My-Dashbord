// components/IncomingCallModal.js
import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";

const IncomingCallModal = ({ incomingCall, onAccept, onReject }) => {
  const [ringTime, setRingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRingTime((prev) => prev + 1);
    }, 1000);

    // Auto-reject after 30 seconds
    const timeout = setTimeout(() => {
      onReject();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onReject]);

  const formatRingTime = (seconds) => {
    return `${seconds}s`;
  };

  const getCallIcon = () => {
    if (incomingCall.callType === "video") {
      return <Video className="w-8 h-8 text-blue-500" />;
    }
    return <Mic className="w-8 h-8 text-green-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7BBDE8] to-[#49769F] px-6 py-4 text-center">
          <h3 className="text-white font-semibold text-lg">
            Incoming {incomingCall.callType === "video" ? "Video" : "Audio"}{" "}
            Call
          </h3>
          <p className="text-white/80 text-sm mt-1">
            Ringing for {formatRingTime(ringTime)}
          </p>
        </div>

        {/* Caller Info */}
        <div className="p-8 text-center">
          {/* Avatar */}
          <div className="relative mx-auto mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-[#7BBDE8] to-[#49769F] rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-bold">
                {incomingCall.caller[0].toUpperCase()}
              </span>
            </div>

            {/* Call Type Icon */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              {getCallIcon()}
            </div>

            {/* Pulsing Ring Animation */}
            <div className="absolute inset-0 rounded-full border-4 border-[#7BBDE8] animate-ping opacity-30"></div>
            <div
              className="absolute inset-2 rounded-full border-4 border-[#49769F] animate-ping opacity-40"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>

          {/* Caller Name */}
          <h4 className="text-2xl font-bold text-gray-800 mb-2">
            {incomingCall.caller}
          </h4>

          <p className="text-gray-600 mb-8">
            {incomingCall.callType === "video"
              ? "wants to start a video call"
              : "wants to start an audio call"}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-8">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform hover:scale-105"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform hover:scale-105"
            >
              <Phone className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* Button Labels */}
          <div className="flex items-center justify-center space-x-8 mt-3">
            <span className="text-sm text-gray-500 w-16 text-center">
              Decline
            </span>
            <span className="text-sm text-gray-500 w-16 text-center">
              Accept
            </span>
          </div>
        </div>

        {/* Auto-reject warning */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            Call will automatically end in {30 - ringTime} seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
