// components/UsersSidebar.js
import React, { useState } from "react";
import { Phone, Video, MoreHorizontal } from "lucide-react";

const UsersSidebar = ({ users, onInitiateCall, onShowMediaOptions }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCallOptions, setShowCallOptions] = useState(null);

  const handleUserClick = (user) => {
    if (selectedUser === user) {
      setSelectedUser(null);
      setShowCallOptions(null);
    } else {
      setSelectedUser(user);
      setShowCallOptions(user);
    }
  };

  const handleCall = (user, callType) => {
    onInitiateCall(user, callType);
    setShowCallOptions(null);
    setSelectedUser(null);
  };

  return (
    <div className="w-80 bg-white/40 backdrop-blur-sm border-r border-white/20 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Online Users
        </h3>
        <p className="text-sm text-gray-600">{users.length} members</p>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <div key={index} className="relative">
            <div
              className={`flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all duration-200 cursor-pointer ${
                selectedUser === user ? "bg-white/70 ring-2 ring-[#7BBDE8]" : ""
              }`}
              onClick={() => handleUserClick(user)}
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
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Call Options Dropdown */}
            {showCallOptions === user && (
              <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/40 p-2 min-w-[140px] z-10">
                <button
                  onClick={() => handleCall(user, "audio")}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm text-gray-700"
                >
                  <Phone className="w-4 h-4 text-green-500" />
                  <span>Audio Call</span>
                </button>
                <button
                  onClick={() => handleCall(user, "video")}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm text-gray-700"
                >
                  <Video className="w-4 h-4 text-blue-500" />
                  <span>Video Call</span>
                </button>
              </div>
            )}
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
            onClick={onShowMediaOptions}
            className="w-full py-2 px-4 bg-white/50 hover:bg-white/70 text-gray-800 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            Attach Media
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersSidebar;
