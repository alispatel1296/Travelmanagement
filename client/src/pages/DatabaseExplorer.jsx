import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Table, RefreshCw, Key, Layers, Terminal, ExternalLink } from 'lucide-react';

export function DatabaseExplorer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.database.getTables();
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setTableLoading(true);
    try {
      const res = await api.database.getTableData(tableName);
      if (res.success) {
        setTableData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-600" />
            MySQL Database Explorer (`transfleet_db`)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Direct real-time inspection of relational tables, columns, foreign keys, and live records.
          </p>
        </div>

        <button
          onClick={() => { fetchTables(); fetchTableData(selectedTable); }}
          className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${tableLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* SQL Tools Info Box */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <strong className="block text-blue-950 font-semibold">Where is this stored?</strong>
            <p className="text-blue-800 text-[11px] mt-0.5">
              These tables are hosted locally in MySQL on port 3306 in database <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">transfleet_db</code>.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200">
          CLI: mysql -u root -e "USE transfleet_db; SELECT * FROM users;"
        </div>
      </div>

      {/* Table Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="text-xs text-slate-400">Loading tables...</div>
        ) : (
          tables.map((t) => {
            const isSelected = selectedTable === t.table_name;
            return (
              <button
                key={t.table_name}
                onClick={() => setSelectedTable(t.table_name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="font-mono">{t.table_name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.row_count} rows
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Table Content & Schema Inspector */}
      {tableData && (
        <div className="space-y-4">
          {/* Schema Columns Pill Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Table Schema: <code className="font-mono text-brand-700">{selectedTable}</code>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {tableData.columns?.map((col) => (
                <div
                  key={col.field}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center gap-1.5"
                >
                  {col.key === 'PRI' && <Key className="w-3 h-3 text-amber-600" title="Primary Key" />}
                  {col.key === 'MUL' && <span className="text-[9px] font-bold text-purple-600 font-mono" title="Foreign Key">FK</span>}
                  <strong className="text-slate-800 font-mono">{col.field}</strong>
                  <span className="text-slate-400 text-[10px] font-mono">({col.type})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Records Data Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 font-mono">
                SELECT * FROM {selectedTable} ({tableData.rows?.length || 0} records)
              </span>
              <span className="text-[11px] text-slate-400">Showing latest records first</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-600">
                  <tr>
                    {tableData.columns?.map((col) => (
                      <th key={col.field} className="py-2.5 px-3 font-semibold font-mono whitespace-nowrap">
                        {col.field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={tableData.columns?.length || 5} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                        Querying MySQL table...
                      </td>
                    </tr>
                  ) : tableData.rows?.length === 0 ? (
                    <tr>
                      <td colSpan={tableData.columns?.length || 5} className="py-8 text-center text-slate-400">
                        No rows found in this table.
                      </td>
                    </tr>
                  ) : (
                    tableData.rows?.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50 transition">
                        {tableData.columns?.map((col) => {
                          const val = row[col.field];
                          const isPassHash = col.field === 'password_hash';
                          return (
                            <td key={col.field} className="py-2.5 px-3 whitespace-nowrap text-slate-700 max-w-xs truncate">
                              {isPassHash ? (
                                <span className="text-slate-400 text-[10px]" title={val}>
                                  $2a$10$...{String(val).slice(-10)} (bcrypt)
                                </span>
                              ) : val === null ? (
                                <span className="text-slate-300 italic">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
