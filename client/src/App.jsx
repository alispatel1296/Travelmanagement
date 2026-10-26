import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { VehiclesPage } from './pages/VehiclesPage';
import { RoutesPage } from './pages/RoutesPage';
import { TripsPage } from './pages/TripsPage';
import { PassengerBooking } from './pages/PassengerBooking';
import { MyBookings } from './pages/MyBookings';
import { DriverConsole } from './pages/DriverConsole';
import { PassengerManifest } from './pages/PassengerManifest';
import { DatabaseExplorer } from './pages/DatabaseExplorer';
import { AuthPage } from './pages/AuthPage';

function MainApp() {
  const { isAuthenticated, loading, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (role === 'driver') {
      setActiveTab('driver-console');
    } else if (role === 'passenger') {
      setActiveTab('booking');
    } else if (role === 'admin') {
      setActiveTab('dashboard');
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono">Initializing TransFleet Operations Engine...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="  w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Views */}
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'vehicles' && <VehiclesPage />}
        {activeTab === 'routes' && <RoutesPage />}
        {activeTab === 'trips' && <TripsPage />}
        {activeTab === 'manifest' && <PassengerManifest />}
        {activeTab === 'database' && <DatabaseExplorer />}

        {/* Passenger Views */}
        {activeTab === 'booking' && <PassengerBooking setActiveTab={setActiveTab} />}
        {activeTab === 'my-bookings' && <MyBookings setActiveTab={setActiveTab} />}

        {/* Driver Views */}
        {activeTab === 'driver-console' && <DriverConsole />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>TransFleet Transportation Management System (TMS) • 5th Sem Full Stack Development Project</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
