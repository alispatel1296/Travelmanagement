import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Truck, Plus, Trash2, X, Zap, RefreshCw, AlertCircle } from 'lucide-react';

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    vehicle_type: 'Bus',
    capacity: 35,
    fuel_type: 'Electric',
    mileage_km: 5000,
    status: 'active'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.vehicles.getAll(filterStatus ? `status=${filterStatus}` : '');
      if (res.success) setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.vehicles.create(formData);
      if (res.success) {
        setSuccessMsg('Vehicle added to fleet successfully!');
        setIsModalOpen(false);
        setFormData({
          plate_number: '',
          model: '',
          vehicle_type: 'Bus',
          capacity: 35,
          fuel_type: 'Electric',
          mileage_km: 5000,
          status: 'active'
        });
        fetchVehicles();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.vehicles.update(id, { status: newStatus });
      fetchVehicles();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to retire and remove this vehicle from fleet?')) return;
    try {
      await api.vehicles.delete(id);
      fetchVehicles();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-600" />
            Fleet Assets & Maintenance Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor vehicle health, capacity limits, mileage, and maintenance statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Roadworthy</option>
            <option value="maintenance">In Maintenance</option>
            <option value="idle">Idle / Standby</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Register Vehicle
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
          <Zap className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Vehicles Table Card */}
      <div className="glass-panel rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">License Plate</th>
                <th className="py-3 px-4 font-semibold">Vehicle Model & Type</th>
                <th className="py-3 px-4 font-semibold">Fuel / Energy</th>
                <th className="py-3 px-4 font-semibold">Capacity</th>
                <th className="py-3 px-4 font-semibold">Odometer</th>
                <th className="py-3 px-4 font-semibold">Status / Quick Toggle</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading fleet records...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No vehicles found matching current filter.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {v.plate_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{v.model}</div>
                      <div className="text-[11px] text-slate-500">{v.vehicle_type} Class</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${v.fuel_type === 'Electric' ? 'text-teal-700' : 'text-slate-700'}`}>
                        {v.fuel_type === 'Electric' && <Zap className="w-3 h-3 text-teal-600" />}
                        {v.fuel_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {v.capacity} Passengers
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {Number(v.mileage_km).toLocaleString()} km
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge status={v.status} />
                        <select
                          value={v.status}
                          onChange={(e) => handleStatusChange(v.id, e.target.value)}
                          className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] text-slate-700 focus:outline-none focus:border-brand-500"
                        >
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="idle">Idle</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
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
              <Truck className="w-5 h-5 text-brand-600" />
              Register New Fleet Vehicle
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Add a bus, shuttle, or corporate van to the active dispatch pool.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">License Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-01-AB-9876"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volvo Electric B11R"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Shuttle">Shuttle</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    min="4"
                    max="80"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Energy / Fuel</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Electric">Electric (EV)</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mileage_km}
                    onChange={(e) => setFormData({ ...formData, mileage_km: e.target.value })}
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
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
