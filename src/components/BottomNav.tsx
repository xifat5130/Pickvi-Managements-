import React from 'react';
import { Home, ClipboardList, Plus, Bell, User } from 'lucide-react';

interface Props {
  active: 'home' | 'schedule' | 'inbox' | 'profile';
  setActive: (tab: 'home' | 'schedule' | 'inbox' | 'profile') => void;
  onCreateOrderClick: () => void;
  notificationCount: number;
}

export const BottomNav = ({ active, setActive, onCreateOrderClick, notificationCount }: Props) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 pb-6 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {/* Home Tab */}
      <button 
        onClick={() => setActive('home')} 
        className="flex flex-col items-center gap-1 cursor-pointer select-none py-1 focus:outline-none transition-all"
        id="btn-nav-home"
      >
        <Home className={`w-5.5 h-5.5 transition-colors ${active === 'home' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${active === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>Home</span>
      </button>

      {/* Timeline Tab */}
      <button 
        onClick={() => setActive('schedule')} 
        className="flex flex-col items-center gap-1 cursor-pointer select-none py-1 focus:outline-none transition-all"
        id="btn-nav-schedule"
      >
        <ClipboardList className={`w-5.5 h-5.5 transition-colors ${active === 'schedule' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${active === 'schedule' ? 'text-blue-600' : 'text-slate-400'}`}>Orders</span>
      </button>
      
      {/* Central Plus (FAB) Button */}
      <div className="relative -mt-9">
        <button 
          onClick={onCreateOrderClick}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg shadow-blue-500/40 hover:bg-blue-500 active:scale-95 transition-transform cursor-pointer focus:outline-none border-4 border-slate-50 flex items-center justify-center"
          title="Create New Order Checkout"
          id="btn-nav-create"
        >
          <Plus className="w-6 h-6 text-white stroke-[3px]" />
        </button>
      </div>

      {/* Inbox Tab */}
      <button 
        onClick={() => setActive('inbox')} 
        className="flex flex-col items-center gap-1 cursor-pointer select-none py-1 focus:outline-none transition-all relative"
        id="btn-nav-inbox"
      >
        <div className="relative">
          <Bell className={`w-5.5 h-5.5 transition-colors ${active === 'inbox' ? 'text-blue-600' : 'text-slate-400'}`} />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono border-2 border-white animate-pulse">
              {notificationCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold ${active === 'inbox' ? 'text-blue-600' : 'text-slate-400'}`}>Inbox</span>
      </button>

      {/* Profile/System Tab */}
      <button 
        onClick={() => setActive('profile')} 
        className="flex flex-col items-center gap-1 cursor-pointer select-none py-1 focus:outline-none transition-all"
        id="btn-nav-profile"
      >
        <User className={`w-5.5 h-5.5 transition-colors ${active === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${active === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>Profile</span>
      </button>
    </div>
  );
};
