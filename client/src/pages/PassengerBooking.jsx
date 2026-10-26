import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  Ticket,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Ban
} from 'lucide-react';

export function PassengerBooking({ setActiveTab }) {
  const [trips, setTrips] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripStops, setTripStops] = useState([]);
  const [pickupStopId, setPickupStopId] = useState('');
  const [dropStopId, setDropStopId] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, bookingsRes] = await Promise.all([
        api.trips.getAll(),
        api.bookings.getMy()
      ]);

      if (tripsRes.success) {
        setTrips(tripsRes.data.filter(t => t.status !== 'completed' && t.status !== 'cancelled'));
      }
      if (bookingsRes.success) {
        setUserBookings(bookingsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map active booking for each trip
  const activeBookingsByTrip = {};
  userBookings.forEach(b => {
    if (b.booking_status === 'confirmed' || b.booking_status === 'boarded') {
      activeBookingsByTrip[b.trip_id] = b;
    }
  });

  const handleOpenBooking = async (trip) => {
    // Prevent duplicate booking
    if (activeBookingsByTrip[trip.id]) {
      return;
    }

    setSelectedTrip(trip);
    setErrorMsg('');
    try {
      const res = await api.routes.getById(trip.route_id);
      if (res.success && res.data.stops) {
        // Ensure sorted by stop_order ASC
        const sortedStops = [...res.data.stops].sort((a, b) => a.stop_order - b.stop_order);
        setTripStops(sortedStops);

        if (sortedStops.length >= 2) {
          // Pickup: default to first stop
          const firstStop = sortedStops[0];
          setPickupStopId(firstStop.id);
          // Drop: default to last stop
          const lastStop = sortedStops[sortedStops.length - 1];
          setDropStopId(lastStop.id);
        } else if (sortedStops.length === 1) {
          setPickupStopId(sortedStops[0].id);
          setDropStopId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Determine available pickup stops (cannot pick the very last stop, since vehicle travels one-way)
  const maxStopOrder = tripStops.length > 0 ? Math.max(...tripStops.map(s => s.stop_order)) : 0;
  const availablePickupStops = tripStops.filter(s => s.stop_order < maxStopOrder);

  // Determine available drop-off stops strictly downstream (after) the selected pickup stop
  const currentPickupObj = tripStops.find(s => Number(s.id) === Number(pickupStopId));
  const availableDropStops = currentPickupObj
    ? tripStops.filter(s => s.stop_order > currentPickupObj.stop_order)
    : [];

  const handlePickupChange = (newId) => {
    setPickupStopId(newId);
    setErrorMsg('');
    const newPickupObj = tripStops.find(s => Number(s.id) === Number(newId));
    if (newPickupObj) {
      const validDrops = tripStops.filter(s => s.stop_order > newPickupObj.stop_order);
      // If current dropStopId is not strictly downstream, reset to the furthest drop stop
      if (!validDrops.some(s => Number(s.id) === Number(dropStopId))) {
        setDropStopId(validDrops.length > 0 ? validDrops[validDrops.length - 1].id : '');
      }
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!pickupStopId || !dropStopId) {
      setErrorMsg('Please select both pickup and drop-off checkpoints.');
      return;
    }

    const pickupObj = tripStops.find(s => Number(s.id) === Number(pickupStopId));
    const dropObj = tripStops.find(s => Number(s.id) === Number(dropStopId));

    if (!pickupObj || !dropObj) {
      setErrorMsg('Selected stops are invalid for this route.');
      return;
    }

    if (pickupObj.stop_order >= dropObj.stop_order) {
      setErrorMsg(
        `One-way transit rule: Drop-off checkpoint ("${dropObj.stop_name}", Stop #${dropObj.stop_order}) must be after pickup checkpoint ("${pickupObj.stop_name}", Stop #${pickupObj.stop_order}).`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.bookings.create({
        trip_id: selectedTrip.id,
        pickup_stop_id: Number(pickupStopId),
        drop_stop_id: Number(dropStopId)
      });

      if (res.success) {
        setBookingSuccess(res.data);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrips = trips.filter(t =>
    t.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-brand-600 to-indigo-700 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-3">
            <Ticket className="w-3.5 h-3.5 text-blue-200" />
            Passenger Transit Reservation Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Find Your Route & Reserve Seats
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-2">
            Instant digital boarding pass issuance with strict one-way route sequencing and one-seat-per-passenger guarantee.
          </p>

          <div className="mt-5 relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by destination, campus, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-transparent text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 shadow"
            />
          </div>
        </div>
      </div>

      {/* Available Trips */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Active & Upcoming Departures ({filteredTrips.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Scanning transit schedules & your active passes...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs bg-white border border-slate-200">
            No transit runs match your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrips.map((trip) => {
              const depTime = new Date(trip.departure_time);
              const isFull = trip.available_seats <= 0;
              const activeBooking = activeBookingsByTrip[trip.id];

              return (
                <div
                  key={trip.id}
                  className={`glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4 bg-white border shadow-sm transition-all ${
                    activeBooking ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-brand-600 font-semibold block">
                          TRIP #{trip.id} • {trip.vehicle_type}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{trip.route_name}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge status={trip.status} />
                        {activeBooking && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Seat #{activeBooking.seat_number} Reserved
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">From</span>
                        <strong>{trip.origin}</strong>
                      </div>
                      <ArrowRight className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">To</span>
                        <strong>{trip.destination}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Departure</span>
                        <span className="font-semibold text-slate-800">
                          {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Seats Open</span>
                        <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isFull ? 'Sold Out' : `${trip.available_seats} Left`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Fare</span>
                        <span className="font-bold text-slate-900">₹{trip.fare}</span>
                      </div>
                    </div>
                  </div>

                  {activeBooking ? (
                    <button
                      onClick={() => setActiveTab('my-bookings')}
                      className="w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Already Reserved (Seat #{activeBooking.seat_number}) • View Boarding Pass
                    </button>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => handleOpenBooking(trip)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      {isFull ? 'Trip Fully Booked' : 'Select Stops & Reserve Seat'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => { setSelectedTrip(null); setBookingSuccess(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Ticket className="w-5 h-5 text-brand-600" />
                  Reserve Boarding Pass
                </h2>
                <p className="text-xs text-slate-500 mb-3">{selectedTrip.route_name}</p>

                {/* One-way rule badge */}
                <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>One-way transit enabled: Checkpoints are strictly sequenced forward from origin to destination.</span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Boarding Checkpoint (Pickup) *
                    </label>
                    <select
                      value={pickupStopId}
                      onChange={(e) => handlePickupChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                    >
                      {availablePickupStops.map(s => (
                        <option key={s.id} value={s.id}>
                          Stop #{s.stop_order}: {s.stop_name} (+{s.minutes_from_origin}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Disembarkation Point (Drop-off) *
                    </label>
                    <select
                      value={dropStopId}
                      onChange={(e) => { setDropStopId(e.target.value); setErrorMsg(''); }}
                      disabled={availableDropStops.length === 0}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {availableDropStops.length === 0 ? (
                        <option value="">No subsequent stops available</option>
                      ) : (
                        availableDropStops.map(s => (
                          <option key={s.id} value={s.id}>
                            Stop #{s.stop_order}: {s.stop_name} (+{s.minutes_from_origin}m)
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Showing only stops downstream of Stop #{currentPickupObj?.stop_order || 1}.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Vehicle</span>
                      <strong className="text-slate-800">{selectedTrip.plate_number} ({selectedTrip.vehicle_model})</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Seat Available</span>
                      <strong className="text-emerald-700">{selectedTrip.available_seats} remaining</strong>
                    </div>
                    <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-800">Total Ticket Fare</span>
                      <span className="font-bold text-base text-brand-600">₹{selectedTrip.fare}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTrip(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || availableDropStops.length === 0}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {submitting ? 'Confirming...' : 'Confirm & Generate Pass'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Boarding Pass Preview */
              <div className="text-center space-y-4 py-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Seat Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your digital transit pass has been issued.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-brand-700 font-bold">
                      Boarding Verification Token
                    </span>
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {bookingSuccess.boarding_token}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Assigned Seat</span>
                      <strong className="text-slate-900 text-base">Seat #{bookingSuccess.seat_number}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Trip Ref</span>
                      <strong className="text-slate-700">Run #{bookingSuccess.trip_id}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedTrip(null); setBookingSuccess(null); }}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrip(null);
                      setBookingSuccess(null);
                      setActiveTab('my-bookings');
                    }}
                    className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm"
                  >
                    View All My Passes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
