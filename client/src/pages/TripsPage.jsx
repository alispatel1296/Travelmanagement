import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Calendar, Plus, Clock, Truck, MapPin, X, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

export function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
    driver_id: '',
    departure_time: '',
    fare: 45.00
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTripsAndPrereqs = async () => {
    setLoading(true);
    try {
      const [tripsRes, routesRes, vehiclesRes, driversRes] = await Promise.all([
        api.trips.getAll(filterStatus ? `status=${filterStatus}` : ''),
        api.routes.getAll(),
        api.vehicles.getAll('status=active'),
        api.auth.getDrivers()
      ]);

      if (tripsRes.success) setTrips(tripsRes.data);
      if (routesRes.success) setRoutes(routesRes.data);
      if (vehiclesRes.success) setVehicles(resVehiclesOnlyActive(vehiclesRes.data));
      if (driversRes.success) setDrivers(driversRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resVehiclesOnlyActive = (list) => {
    return list.filter(v => v.status === 'active');
  };

  useEffect(() => {
    fetchTripsAndPrereqs();
  }, [filterStatus]);

  const handleOpenModal = () => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    const localIso = new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({
      route_id: routes[0]?.id || '',
      vehicle_id: vehicles[0]?.id || '',
      driver_id: drivers[0]?.id || '',
      departure_time: localIso,
      fare: 45.00
    });
    setIsModalOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.trips.create(formData);
      if (res.success) {
        setSuccessMsg('Trip scheduled successfully and seats opened for reservation!');
        setIsModalOpen(false);
        fetchTripsAndPrereqs();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAdvanceStop = async (tripId) => {
    try {
      const res = await api.trips.advanceStop(tripId);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchTripsAndPrereqs();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      const res = await api.trips.updateStatus(tripId, newStatus);
      if (res.success) {
        setSuccessMsg(res.message || `Trip status updated to ${newStatus}.`);
        fetchTripsAndPrereqs();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            Scheduled Transit Dispatches & Trips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Allocate roadworthy vehicles, assign licensed drivers, track live corridor milestones, and complete runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="">All Trip Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_transit">In Transit (Live)</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Run
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-700">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="font-bold text-rose-700">×</button>
        </div>
      )}

      {/* Trips Cards / List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500 text-xs">Loading scheduled trips...</div>
        ) : trips.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">No trips match current filters.</div>
        ) : (
          trips.map((trip) => {
            const depDate = new Date(trip.departure_time);
            const isCompleted = trip.status === 'completed';
            const isCancelled = trip.status === 'cancelled';
            const isInTransit = trip.status === 'in_transit';

            return (
              <div key={trip.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-brand-600 uppercase tracking-wider">
                        Trip #{trip.id} • {trip.route_name.split(':')[0]}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{trip.route_name}</h3>
                    </div>
                    <Badge status={trip.status} />
                  </div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Departure</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-500">{depDate.toLocaleDateString()}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Assigned Vehicle</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Truck className="w-3.5 h-3.5 text-teal-600" />
                        {trip.plate_number}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">{trip.vehicle_model}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Available Seats</span>
                      <span className="font-bold text-brand-600 text-sm mt-0.5 block">
                        {trip.available_seats} / {trip.total_capacity}
                      </span>
                      <span className="text-[10px] text-slate-500">Fare: ₹{trip.fare}</span>
                    </div>
                  </div>

                  {/* Live Progress Indicator */}
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-slate-500">Current Checkpoint:</span>
                      <span className="font-semibold text-slate-800">
                        {trip.current_stop_name || 'Origin Depot'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600">Driver: <strong>{trip.driver_name}</strong></span>
                  </div>
                </div>

                {/* Dispatcher Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-medium text-slate-500">Dispatcher Control:</span>
                  <div className="flex items-center gap-1.5">
                    {trip.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(trip.id, 'in_transit')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shadow-sm transition flex items-center gap-1"
                      >
                        Start Trip (In Transit)
                      </button>
                    )}

                    {isInTransit && (
                      <>
                        <button
                          onClick={() => handleAdvanceStop(trip.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-semibold border border-brand-200 transition flex items-center gap-1"
                          title="Advance to next stop along corridor"
                        >
                          <Navigation className="w-3 h-3" />
                          Advance Stop
                        </button>
                        <button
                          onClick={() => handleStatusChange(trip.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-sm transition flex items-center gap-1"
                          title="Mark trip as completed"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Complete Run
                        </button>
                      </>
                    )}

                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleStatusChange(trip.id, 'cancelled')}
                        className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[11px] transition"
                        title="Cancel this run"
                      >
                        Cancel Run
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ✓ Run Finished & Recorded
                      </span>
                    )}

                    {isCancelled && (
                      <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        ✕ Trip Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-brand-600" />
              Schedule Transit Trip
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Bind a designated route with an active vehicle and licensed driver.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Transit Route *</label>
                <select
                  required
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Corridor --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.origin} ➔ {r.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Active Vehicle *</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Roadworthy Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.model} ({v.capacity} seats, {v.fuel_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Driver *</label>
                <select
                  required
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Assigned Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ticket Fare (₹)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm"
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
