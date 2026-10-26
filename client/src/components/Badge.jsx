import React from 'react';

export function Badge({ status }) {
  const getStyles = () => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'active':
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'in_transit':
      case 'boarded':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 animate-pulse';
      case 'scheduled':
      case 'idle':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'maintenance':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'electric':
      case 'ev':
        return 'bg-teal-50 text-teal-700 border-teal-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = () => {
    return String(status).replace('_', ' ').toUpperCase();
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
      {formatText()}
    </span>
  );
}
