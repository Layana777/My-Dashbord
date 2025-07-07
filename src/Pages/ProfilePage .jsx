import React from "react";

const ProfilePage = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-gray-800 mb-4"> About me ❤️</h2>

    <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50">
      <p className="text-3m font-bold text-gray-600">
        Tech isn’t just my career — it’s the language I speak fluently. Started
        with curiosity, grew through challenges, and flourished at Riyad Bank,
        where I created interfaces with HTML, CSS, and JavaScript. Fast forward
        to Revive Saudi Arabia — a project that won best graduation project and
        proved how tech can change local communities. Now? I’m exploring new
        heights in React, Node.js, and Django, crafting code that’s clean,
        experiences that matter, and solutions that make a difference.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Name:</h3>
        <p className="text-3m font-bold text-gray-600">Layana Alhudaithi</p>
      </div>
      <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Email:</h3>
        <p className="text-3m font-bold text-gray-600">
          layana.alhudaithi@gmail.com
        </p>
      </div>
      <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Phone:</h3>
        <p className="text-3m font-bold text-gray-600">+966 50 258 7228</p>
      </div>
    </div>
  </div>
);

export default ProfilePage;
