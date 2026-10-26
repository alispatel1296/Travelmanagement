import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  LayoutDashboard,
  Truck,
  MapPin,
  Calendar,
  Ticket,
  UserCheck,
  LogOut,
  Database,
  Users
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, role, logout } = useAuth();

  const navItems = [
    // Admin Tabs ONLY
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck, roles: ['admin'] },
    { id: 'routes', label: 'Transit Routes', icon: MapPin, roles: ['admin'] },
    { id: 'trips', label: 'Trip Schedules', icon: Calendar, roles: ['admin'] },
    { id: 'manifest', label: 'Passenger Manifest', icon: Users, roles: ['admin'] },
    { id: 'database', label: 'MySQL Tables', icon: Database, roles: ['admin'] },

    // Passenger / Student Tabs ONLY
    { id: 'booking', label: 'Book Transit', icon: Ticket, roles: ['passenger'] },
    { id: 'my-bookings', label: 'My Boarding Passes', icon: Ticket, roles: ['passenger'] },

    // Driver Tabs ONLY
    { id: 'driver-console', label: 'Driver Console', icon: UserCheck, roles: ['driver'] }
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(role));

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab(role === 'driver' ? 'driver-console' : role === 'passenger' ? 'booking' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
                  Trans<span className="text-brand-600">Fleet</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-50 text-brand-700 rounded border border-brand-200">
                  TMS v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Smart Transit & Fleet Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-brand-600 font-mono capitalize">{role} role</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200 scrollbar-none">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
