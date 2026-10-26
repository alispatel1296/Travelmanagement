import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200/80',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
    purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
    teal: 'bg-teal-50 text-teal-600 border-teal-200/80'
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {trend && <span className="text-emerald-600 font-semibold">{trend}</span>}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
}
