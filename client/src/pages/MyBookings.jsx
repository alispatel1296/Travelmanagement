import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  Ticket,
  Clock,
  ArrowRight,
  XCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Info
} from 'lucide-react';

export function MyBookings({ setActiveTab }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'cancelled'

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.bookings.getMy();
      if (res.success) {
        setBookings(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to fetch boarding passes.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancel(true);
    try {
      const res = await api.bookings.cancel(cancellingBooking.id);
      if (res.success) {
        setStatusNotification({
          type: 'success',
          message: res.message || `Reservation for Seat #${cancellingBooking.seat_number} was successfully cancelled. Seat restored to trip capacity.`
        });
        setCancellingBooking(null);
        await fetchBookings();
      }
    } catch (err) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to cancel reservation.'
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const activeBookings = bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'boarded');
  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled');

  const displayedBookings = filterTab === 'active'
    ? activeBookings
    : filterTab === 'cancelled'
    ? cancelledBookings
    : bookings;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-600" />
            My Digital Boarding Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Show these tokens to your transit driver upon boarding vehicle.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchBookings}
            title="Refresh Passes"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Book Another Trip
          </button>
        </div>
      </div>

      {/* Notification Toast/Banner */}
      {statusNotification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs animate-in fade-in transition ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusNotification.message}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      {bookings.length > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterTab === 'all'
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Passes ({bookings.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterTab === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setFilterTab('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterTab === 'cancelled'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
          Fetching your boarding passes...
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 bg-white border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {filterTab === 'all'
                ? 'No Transit Passes Yet'
                : `No ${filterTab} passes found`}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {filterTab === 'all'
                ? "You haven't reserved any trips. Browse active routes to book a ride!"
                : `Switch filters or reserve an upcoming trip.`}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('booking')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Find Upcoming Trips
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedBookings.map((b) => {
            const depDate = new Date(b.departure_time);
            const isCancelled = b.booking_status === 'cancelled';
            const isBoarded = b.booking_status === 'boarded';

            return (
              <div
                key={b.id}
                className={`glass-panel rounded-3xl p-6 relative overflow-hidden bg-white border transition-all ${
                  isCancelled
                    ? 'border-rose-200 bg-rose-50/15'
                    : isBoarded
                    ? 'border-blue-300 shadow-sm'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Boarding Pass Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono text-brand-600 font-bold uppercase tracking-wider block">
                      TRANSFLEET DIGITAL BOARDING PASS
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{b.route_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vehicle: <span className="text-slate-800 font-mono font-medium">{b.plate_number}</span> ({b.vehicle_model})
                    </p>
                  </div>
                  <Badge status={b.booking_status} />
                </div>

                {/* Stoppage Checkpoints */}
                <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="max-w-[42%]">
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                      Pickup Checkpoint
                    </span>
                    <strong className="text-slate-900 text-xs truncate block">{b.pickup_stop_name}</strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <div className="max-w-[42%] text-right">
                    <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
                      Drop Checkpoint
                    </span>
                    <strong className="text-slate-900 text-xs truncate block">{b.drop_stop_name}</strong>
                  </div>
                </div>

                {/* Token & Seat Highlight Box */}
                <div
                  className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ${
                    isCancelled
                      ? 'bg-rose-50/50 border-rose-200 text-slate-400'
                      : 'bg-blue-50/60 border-blue-200/80'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Assigned Seat</span>
                    <span
                      className={`text-xl font-extrabold tracking-tight ${
                        isCancelled ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      Seat #{b.seat_number}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {depDate.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right flex flex-col justify-between items-end">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                      {isCancelled ? 'Status' : 'Verification Token'}
                    </span>
                    {isCancelled ? (
                      <div className="font-mono text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300 tracking-wider">
                        CANCELLED / VOID
                      </div>
                    ) : (
                      <div className="font-mono text-xs font-bold text-brand-700 bg-white px-2.5 py-1 rounded-lg border border-brand-200 tracking-wider shadow-sm">
                        {b.boarding_token}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500">Fare: ₹{b.fare}</span>
                  </div>
                </div>

                {/* Status Notice for Cancelled */}
                {isCancelled && (
                  <div className="mt-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>This reservation was cancelled. Seat #{b.seat_number} was restored to available trip capacity.</span>
                  </div>
                )}

                {/* Pass Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Driver Contact: <strong className="text-slate-800">{b.driver_name}</strong> ({b.driver_phone})
                  </span>

                  {!isCancelled && !isBoarded && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium text-[11px] flex items-center gap-1 transition border border-transparent hover:border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Reservation
                    </button>
                  )}
                  {isBoarded && (
                    <span className="text-blue-700 font-semibold text-[11px]">Checked in aboard vehicle</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Cancellation Confirmation Modal (No window.confirm popup) */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setCancellingBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Cancel Seat Reservation?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to cancel your reserved seat for this trip?
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <strong className="text-slate-800">{cancellingBooking.route_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Seat:</span>
                <strong className="text-brand-600 font-bold">Seat #{cancellingBooking.seat_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boarding Token:</span>
                <span className="font-mono text-slate-700 font-semibold">{cancellingBooking.boarding_token}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                Seat #{cancellingBooking.seat_number} will be immediately returned to available capacity for other riders.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingCancel ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Yes, Cancel Seat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
