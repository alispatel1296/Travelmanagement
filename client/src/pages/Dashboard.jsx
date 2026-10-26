import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import {
  Truck,
  Calendar,
  Users,
  Leaf,
  Plus,
  RefreshCw,
  Zap,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  Compass
} from 'lucide-react';

export function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [analyticsRes, tripsRes, bookingsRes] = await Promise.all([
        api.analytics.getDashboard(),
        api.trips.getAll(),
        api.bookings.getAll().catch(() => ({ success: false, data: [] }))
      ]);

      if (analyticsRes.success) setData(analyticsRes.data);
      if (tripsRes.success) setRecentTrips(tripsRes.data.slice(0, 5));
      if (bookingsRes.success) setRecentBookings((bookingsRes.data || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
          <p className="text-xs text-slate-500 font-mono">Aggregating TransFleet Telemetry...</p>
        </div>
      </div>
    );
  }

  const vStats = data?.vehicles || {};
  const tStats = data?.trips || {};
  const bStats = data?.bookings || {};
  const network = data?.network || {};
  const revenue = data?.revenue || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-brand-600 to-indigo-700 text-white shadow-md shadow-blue-500/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-200" />
            Operations Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Fleet Dispatch & Operations Hub
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-2 leading-relaxed">
            Centralized supervisory system for vehicle asset management, transit corridor scheduling, live passenger seating manifests, and telemetry tracking.
          </p>

          {/* Quick Admin Actions */}
          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => setActiveTab('vehicles')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-brand-700 hover:bg-blue-50 text-xs font-bold shadow-sm transition"
            >
              <Truck className="w-3.5 h-3.5" />
              Manage Vehicles
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              Transit Routes
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              Dispatch Trips
            </button>
            <button
              onClick={() => setActiveTab('manifest')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition"
            >
              <Users className="w-3.5 h-3.5" />
              Passenger Manifest
            </button>
            <button
              onClick={fetchStats}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition ml-auto"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Network Health & Alert Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Network Grid</span>
            <span className="text-xs font-bold text-slate-900">
              {network.total_routes || 2} Corridors • {network.total_stops || 7} Checkpoints
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center border border-brand-200 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Active Drivers On Duty</span>
            <span className="text-xs font-bold text-slate-900">
              {network.total_drivers || 2} Drivers • {network.total_passengers || 4} Registered Riders
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Maintenance Status</span>
            <span className="text-xs font-bold text-slate-900">
              {vStats.maintenance_vehicles || 0 > 0 ? `${vStats.maintenance_vehicles} vehicle in service shop` : 'All vehicles roadworthy'}
            </span>
          </div>
        </div>
      </div>

      {/* 5-Card Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Fleet Vehicles"
          value={vStats.total_vehicles || 0}
          subtitle={`${vStats.active_vehicles || 0} active • ${vStats.ev_count || 0} EVs`}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Active Live Trips"
          value={tStats.live_trips || 0}
          subtitle={`${tStats.scheduled_trips || 0} upcoming runs`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Total Bookings"
          value={bStats.total_bookings || 0}
          subtitle={`${bStats.boarded_count || 0} boarded • ${bStats.confirmed_count || 0} confirmed`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Fare Revenue"
          value={`₹${revenue}`}
          subtitle="Collected tickets"
          icon={DollarSign}
          color="amber"
          trend="₹ Live"
        />
        <StatCard
          title="Est. CO2 Offset"
          value={`${data?.co2_saved_kg || 0} kg`}
          subtitle="Green transit savings"
          icon={Leaf}
          color="teal"
          trend="🌿 Eco"
        />
      </div>

      {/* Fleet Composition & Live Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Composition Card */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fleet Operational Health</h3>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 font-semibold">
                {vStats.ev_count || 0} Electric Transit
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active & Roadworthy
                  </span>
                  <span className="font-semibold text-slate-800">{vStats.active_vehicles || 0} / {vStats.total_vehicles || 0}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${vStats.total_vehicles ? (vStats.active_vehicles / vStats.total_vehicles) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Under Maintenance
                  </span>
                  <span className="font-semibold text-slate-800">{vStats.maintenance_vehicles || 0} / {vStats.total_vehicles || 0}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${vStats.total_vehicles ? (vStats.maintenance_vehicles / vStats.total_vehicles) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Idle / In Reserve
                  </span>
                  <span className="font-semibold text-slate-800">{vStats.idle_vehicles || 0} / {vStats.total_vehicles || 0}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${vStats.total_vehicles ? (vStats.idle_vehicles / vStats.total_vehicles) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('vehicles')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
          >
            Manage Fleet Inventory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Dispatches & Trips Table */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Corridor Dispatches</h3>
              <p className="text-xs text-slate-500">Real-time transit progress across assigned corridors</p>
            </div>
            <button
              onClick={() => setActiveTab('trips')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition"
            >
              All Schedules <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">Route & Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Driver</th>
                  <th className="py-2.5 px-3 font-semibold">Current Milestone</th>
                  <th className="py-2.5 px-3 font-semibold">Seats Open</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No active dispatches found.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{trip.route_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {trip.plate_number} • {trip.vehicle_model}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{trip.driver_name}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {trip.current_stop_name || 'Origin Depot'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-brand-600">
                          {trip.available_seats} / {trip.total_capacity} Left
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={trip.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Passenger Manifest Activity */}
      <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Recent Passenger Manifest Bookings
            </h3>
            <p className="text-xs text-slate-500">Latest tokens issued and check-ins across the fleet</p>
          </div>
          <button
            onClick={() => setActiveTab('manifest')}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition"
          >
            View Full Passenger Manifest <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                <th className="py-2.5 px-3 font-semibold">Seat & Token</th>
                <th className="py-2.5 px-3 font-semibold">Passenger</th>
                <th className="py-2.5 px-3 font-semibold">Transit Route</th>
                <th className="py-2.5 px-3 font-semibold">Checkpoints</th>
                <th className="py-2.5 px-3 font-semibold">Fare</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    No passenger bookings recorded yet.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">Seat #{b.seat_number}</span>
                      <span className="font-mono text-[10px] text-brand-700 ml-2 bg-brand-50 px-1 py-0.5 rounded border border-brand-200">
                        {b.boarding_token}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{b.passenger_name}</div>
                      <div className="text-[10px] text-slate-500">{b.passenger_email}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{b.route_name}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      {b.pickup_stop_name} ➔ {b.drop_stop_name}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">₹{b.fare}</td>
                    <td className="py-2.5 px-3">
                      <Badge status={b.booking_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
