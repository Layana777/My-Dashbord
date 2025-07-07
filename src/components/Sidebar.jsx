import { Link, useLocation } from "react-router-dom";




// Sidebar Component
const Sidebar = ({ items }) => {
  const location = useLocation();
  
  return (
    <div className="w-64 bg-white/30 backdrop-blur-xl rounded-r-3xl p-6 shadow-2xl border border-white/40">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">CoachPro</h1>
      </div>
      
      <nav className="space-y-2">
        {items.map((item, index) => (
          <SidebarItem
            key={index}
            to={item.path}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.path}
          />
        ))}
      </nav>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ to, icon: Icon, label, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-[#0A4174] text-white shadow-lg' 
          : 'text-gray-700 hover:bg-[#BDD8E9]/70 hover:shadow-md'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};


export default Sidebar;