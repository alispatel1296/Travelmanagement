import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  Users,
  Search,
  RefreshCw,
  ArrowRight,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';

export function PassengerManifest() {
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripFilter, setSelectedTripFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, tripsRes] = await Promise.all([
        api.bookings.getAll(),
        api.trips.getAll()
      ]);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (tripsRes.success) setTrips(tripsRes.data || []);
    } catch (err) {
      console.error('Failed to load passenger manifest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminCancel = async () => {
    if (!cancellingBooking) return;
    try {
      const res = await api.bookings.cancel(cancellingBooking.id);
      if (res.success) {
        setActionMsg({ type: 'success', text: `Booking for Seat #${cancellingBooking.seat_number} cancelled. Seat restored to trip.` });
        setCancellingBooking(null);
        fetchData();
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.passenger_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passenger_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.boarding_token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.passenger_phone && b.passenger_phone.includes(searchQuery));

    const matchesTrip = selectedTripFilter === 'all' || Number(b.trip_id) === Number(selectedTripFilter);
    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;

    return matchesSearch && matchesTrip && matchesStatus;
  });

  const totalRevenue = bookings
    .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'boarded')
    .reduce((sum, b) => sum + Number(b.fare || 0), 0);

  const boardedCount = bookings.filter(b => b.booking_status === 'boarded').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'confirmed').length;
  const cancelledCount = bookings.filter(b => b.booking_status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            Passenger Manifest & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time passenger seating, boarding tokens, and trip manifests across all fleet runs.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          Refresh Manifest
        </button>
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Manifest Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Total Manifest</span>
          <span className="text-2xl font-extrabold text-slate-900">{bookings.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">All passenger tokens</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-mono text-emerald-600 uppercase block font-semibold">Boarded / Checked-In</span>
          <span className="text-2xl font-extrabold text-emerald-700">{boardedCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Aboard vehicles</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-mono text-blue-600 uppercase block font-semibold">Confirmed Reserved</span>
          <span className="text-2xl font-extrabold text-blue-700">{confirmedCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting pickup</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-mono text-brand-600 uppercase block font-semibold">Total Revenue</span>
          <span className="text-2xl font-extrabold text-brand-700">₹{totalRevenue}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{cancelledCount} cancelled</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-2xl p-4 bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search passenger, phone, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Trip Selector */}
          <select
            value={selectedTripFilter}
            onChange={(e) => setSelectedTripFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-brand-500 w-1/2 md:w-auto"
          >
            <option value="all">All Transit Trips ({trips.length})</option>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                Trip #{t.id} - {t.route_name}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-brand-500 w-1/2 md:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="boarded">Boarded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Manifest Table */}
      <div className="glass-panel rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4 font-semibold">Seat & Token</th>
                <th className="py-3 px-4 font-semibold">Passenger Details</th>
                <th className="py-3 px-4 font-semibold">Route & Corridor</th>
                <th className="py-3 px-4 font-semibold">Boarding ➔ Drop Checkpoints</th>
                <th className="py-3 px-4 font-semibold">Fare</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading manifest records...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No passenger reservations match current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isCancelled = b.booking_status === 'cancelled';
                  const isBoarded = b.booking_status === 'boarded';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          Seat #{b.seat_number}
                        </div>
                        <div className="font-mono text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 inline-block mt-0.5">
                          {b.boarding_token}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.passenger_name}</div>
                        <div className="text-[11px] text-slate-500">{b.passenger_email}</div>
                        {b.passenger_phone && (
                          <div className="text-[10px] text-slate-400">{b.passenger_phone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{b.route_name}</div>
                        <div className="text-[10px] text-slate-500">
                          Trip #{b.trip_id} • {b.plate_number} (Driver: {b.driver_name})
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                          <span className="font-medium text-emerald-700">{b.pickup_stop_name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-rose-700">{b.drop_stop_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">₹{b.fare}</span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge status={b.booking_status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isCancelled && !isBoarded ? (
                          <button
                            onClick={() => setCancellingBooking(b)}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-medium border border-rose-200 transition"
                          >
                            Cancel Pass
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Cancel Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cancel Passenger Seat?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel <strong>{cancellingBooking.passenger_name}</strong>'s reservation for <strong>Seat #{cancellingBooking.seat_number}</strong>?
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Route: <strong>{cancellingBooking.route_name}</strong></div>
              <div>Token: <span className="font-mono">{cancellingBooking.boarding_token}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Keep
              </button>
              <button
                onClick={handleAdminCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
