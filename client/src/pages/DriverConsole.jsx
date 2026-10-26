import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  UserCheck,
  Navigation,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export function DriverConsole() {
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTripDetails, setActiveTripDetails] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenResult, setTokenResult] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const fetchDriverTrips = async () => {
    setLoading(true);
    try {
      const res = await api.trips.getDriverTrips();
      if (res.success) {
        setAssignedTrips(res.data);
        if (res.data.length > 0) {
          loadTripDetail(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTripDetail = async (tripId) => {
    try {
      const res = await api.trips.getById(tripId);
      if (res.success) {
        setActiveTripDetails(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDriverTrips();
  }, []);

  const handleAdvanceStop = async (tripId) => {
    setAdvancing(true);
    try {
      const res = await api.trips.advanceStop(tripId);
      if (res.success) {
        await loadTripDetail(tripId);
        const updatedList = await api.trips.getDriverTrips();
        if (updatedList.success) setAssignedTrips(updatedList.data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setTokenError('');
    setTokenResult(null);
    try {
      const res = await api.bookings.verifyToken(tokenInput.trim());
      if (res.success) {
        setTokenResult(res);
        setTokenInput('');
      }
    } catch (err) {
      setTokenError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Driver Dispatch & Transit Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time checkpoint progression and passenger boarding verification.
          </p>
        </div>

        <button
          onClick={fetchDriverTrips}
          className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Trip & Progression */}
        <div className="lg:col-span-2 space-y-6">
          {loading && !activeTripDetails ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 bg-white border border-slate-200">
              Loading assigned dispatch runs...
            </div>
          ) : !activeTripDetails ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 bg-white border border-slate-200">
              No active or scheduled trips assigned to your profile today.
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 bg-white border border-slate-200/90 shadow-sm">
              {/* Trip Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-600">TRIP #{activeTripDetails.id}</span>
                    <Badge status={activeTripDetails.status} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">{activeTripDetails.route_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vehicle: <strong className="text-slate-800">{activeTripDetails.plate_number}</strong> ({activeTripDetails.vehicle_model})
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Booked Passengers</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {activeTripDetails.capacity - activeTripDetails.available_seats} / {activeTripDetails.capacity}
                  </span>
                </div>
              </div>

              {/* Interactive Route Stop Sequence */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-600" />
                  Route Stops & Live Checkpoints
                </h3>

                <div className="space-y-3">
                  {activeTripDetails.stops?.map((stop) => {
                    const isCurrent = stop.id === activeTripDetails.current_stop_id;
                    const isCompleted = stop.stop_order < (activeTripDetails.current_stop_order || 1);

                    return (
                      <div
                        key={stop.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-blue-50/70 border-blue-300 shadow-sm ring-1 ring-blue-300'
                            : isCompleted
                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isCurrent
                                ? 'bg-brand-600 text-white animate-bounce'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : stop.stop_order}
                          </div>

                          <div>
                            <span className={`text-sm font-semibold ${isCurrent ? 'text-slate-900' : ''}`}>
                              {stop.stop_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              +{stop.minutes_from_origin} mins offset from origin
                            </span>
                          </div>
                        </div>

                        <div>
                          {isCurrent && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              ACTIVE LOCATION
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] font-medium text-emerald-700">Passed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stop Progression Trigger */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Click to broadcast real-time stop arrival to passengers:
                </p>

                {activeTripDetails.status !== 'completed' && activeTripDetails.status !== 'cancelled' ? (
                  <button
                    disabled={advancing}
                    onClick={() => handleAdvanceStop(activeTripDetails.id)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    {advancing ? 'Updating Fleet GPS...' : 'Advance to Next Checkpoint'}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">This trip is completed.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Ticket Verification Scanner */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-4 bg-white border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Passenger Check-In Scanner
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Verify digital boarding tokens presented by riders at vehicle door.
            </p>

            <form onSubmit={handleVerifyToken} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Boarding Token *</label>
                <input
                  type="text"
                  placeholder="e.g. TF-XXXX-XXXX"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono uppercase focus:outline-none focus:border-brand-500 text-xs shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Validate & Check In
              </button>
            </form>

            {/* Verification Result */}
            {tokenResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {tokenResult.already_boarded ? 'Pass Already Validated' : 'Pass Verified & Boarded!'}
                </div>
                <div className="text-[11px] text-slate-700 space-y-1 pt-1 border-t border-emerald-200/60">
                  <p>Passenger: <strong>{tokenResult.data.passenger_name}</strong></p>
                  <p>Seat Allocation: <strong className="text-slate-900 text-xs">Seat #{tokenResult.data.seat_number}</strong></p>
                  <p>Disembark at: <strong>{tokenResult.data.drop_stop}</strong></p>
                </div>
              </div>
            )}

            {tokenError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{tokenError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
