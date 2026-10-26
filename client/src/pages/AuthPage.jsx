import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, Lock, Mail, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('passenger');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name, email, password, phone, role });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Tagline */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto shadow-md">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Trans<span className="text-brand-600">Fleet</span> Operations
          </h1>
          <p className="text-xs text-slate-500">
            Intelligent Transit, Fleet Management & Real-Time Passenger Dispatch
          </p>
        </div>

        {/* Credentials Form */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(''); }}
              className={`font-semibold pb-1 border-b-2 transition ${
                !isRegister ? 'text-brand-600 border-brand-600' : 'text-slate-500 border-transparent hover:text-slate-900'
              }`}
            >
              Sign In with Account
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(''); }}
              className={`font-semibold pb-1 border-b-2 transition ${
                isRegister ? 'text-brand-600 border-brand-600' : 'text-slate-500 border-transparent hover:text-slate-900'
              }`}
            >
              Create New Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Register As</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
                  >
                    <option value="passenger">Passenger (Commuter / Student)</option>
                    <option value="driver">Fleet Driver (Licensed Operator)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>{isRegister ? 'Complete Registration' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
