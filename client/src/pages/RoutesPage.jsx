import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Plus, Trash2, ArrowRight, X, Clock, Navigation, AlertCircle, CheckCircle } from 'lucide-react';

export function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState(20);
  const [durationMins, setDurationMins] = useState(40);
  const [stops, setStops] = useState([
    { stop_name: '', minutes_from_origin: 15 }
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await api.routes.getAll();
      if (res.success) setRoutes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAddStopField = () => {
    setStops([...stops, { stop_name: '', minutes_from_origin: (stops.length + 1) * 15 }]);
  };

  const handleRemoveStopField = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const assembledStops = [
        { stop_name: origin, minutes_from_origin: 0 },
        ...stops.filter(s => s.stop_name.trim() !== ''),
        { stop_name: destination, minutes_from_origin: Number(durationMins) }
      ];

      const payload = {
        route_name: routeName,
        origin,
        destination,
        distance_km: Number(distanceKm),
        estimated_duration_mins: Number(durationMins),
        stops: assembledStops
      };

      const res = await api.routes.create(payload);
      if (res.success) {
        setSuccessMsg('Route and sequenced stops created successfully!');
        setIsModalOpen(false);
        setRouteName('');
        setOrigin('');
        setDestination('');
        setStops([{ stop_name: '', minutes_from_origin: 15 }]);
        fetchRoutes();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transit corridor and its stops?')) return;
    try {
      await api.routes.delete(id);
      fetchRoutes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-600" />
            Transit Routes & Multi-Stop Dispatch Lines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Define point-to-point itineraries and sequenced boarding checkpoints.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Transit Line
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">Loading route corridors...</div>
        ) : routes.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">No transit routes created yet.</div>
        ) : (
          routes.map((route) => (
            <div key={route.id} className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{route.route_name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Navigation className="w-3.5 h-3.5 text-brand-600" /> {route.distance_km} km
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> ~{route.estimated_duration_mins} mins
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(route.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Route"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sequenced Stops Timeline */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Stops Sequence ({route.stops?.length || 0} designated checkpoints)
                  </p>
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-200">
                    {route.stops?.map((stop, idx) => (
                      <div key={stop.id || idx} className="relative flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`absolute -left-6 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ring-4 ring-white ${
                            idx === 0
                              ? 'bg-emerald-600 text-white'
                              : idx === route.stops.length - 1
                              ? 'bg-rose-600 text-white'
                              : 'bg-brand-600 text-white'
                          }`}>
                            {stop.stop_order}
                          </span>
                          <span className="font-medium text-slate-800">{stop.stop_name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          +{stop.minutes_from_origin}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Origin: <strong className="text-slate-800">{route.origin}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                <span>Terminus: <strong className="text-slate-800">{route.destination}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-brand-600" />
              Configure New Transit Route
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Establish a new corridor with designated pickup/drop-off checkpoints.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Route Identifier / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Line 303: Tech Park Shuttle Express"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Origin Point *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Metro"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Terminus *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Hub Gate 2"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Distance (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Est. Duration (minutes)</label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Intermediate Stops */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-700 font-semibold">Intermediate Designated Stops</label>
                  <button
                    type="button"
                    onClick={handleAddStopField}
                    className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-2">
                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Intermediate Stop #${idx + 1}`}
                        value={stop.stop_name}
                        onChange={(e) => handleStopChange(idx, 'stop_name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Offset (m)"
                        title="Minutes from departure"
                        value={stop.minutes_from_origin}
                        onChange={(e) => handleStopChange(idx, 'minutes_from_origin', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStopField(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
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
                  Create Transit Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
