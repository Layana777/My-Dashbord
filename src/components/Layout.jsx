import {
  UserRound,
  BarChart3,
  MessagesSquare,
  MessageCircle,
  Calendar,
  DollarSign,
  Trophy,
  UserCheck,
} from "lucide-react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const sidebarItems = [
    { path: "/", icon: UserRound, label: "profile" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/messenger", icon: MessagesSquare, label: "Chat GPT" },
    { path: "/statistic", icon: BarChart3, label: "Project" },
    // { path: '/calendar', icon: Calendar, label: 'Calendar' },
    // { path: '/finance', icon: DollarSign, label: 'Finance' },
    // { path: '/transfers', icon: Trophy, label: 'Transfers' },
    // { path: '/youth', icon: UserCheck, label: 'Youth academy' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#BDD8E9] via-[#7BBDE8] to-[#49769F] flex">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-900 mb-1">Welcome back, Layana 👋</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-[#7BBDE8]/70 rounded-full shadow-lg"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">AP</span>
            </div>
            <span className="text-gray-900 font-medium">Andrea Pirlo</span>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/80">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
