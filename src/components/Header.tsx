import React from 'react';
import { Shield, Sparkles, Building2, UserCheck, Layers, Search, LogOut } from 'lucide-react';
import { UserRole, User, Officer } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User | null;
  currentOfficer: Officer | null;
  onOpenArchitecture: () => void;
  onOpenTracker: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  currentUser,
  currentOfficer,
  onOpenArchitecture,
  onOpenTracker,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Official Saffron-White-Green top decorative indicator line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-inner border border-amber-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                  Public Grievance Portal
                </span>
                <span className="hidden sm:inline-flex items-center text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Powered
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                AI-Based Smart Complaint Management System
              </h1>
              <p className="hidden md:block text-xs text-slate-400">
                Automated Department Routing • Real-Time Audit Trail • Citizen Redressal
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Track Button */}
            <button
              id="quick-track-btn"
              onClick={onOpenTracker}
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Track by Complaint ID"
            >
              <Search className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
              <span className="hidden sm:inline">Track Status</span>
            </button>

            {/* Architecture / Spring Boot Specs */}
            <button
              id="architecture-btn"
              onClick={onOpenArchitecture}
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/50 transition"
              title="View Java Spring Boot + AI System Architecture"
            >
              <Layers className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
              <span className="hidden md:inline">Java + AI Architecture</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                id="role-citizen-btn"
                onClick={() => setCurrentRole('CITIZEN')}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentRole === 'CITIZEN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                <span>Citizen</span>
              </button>
              <button
                id="role-officer-btn"
                onClick={() => setCurrentRole('OFFICER')}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentRole === 'OFFICER'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 mr-1" />
                <span>Officer</span>
              </button>
              <button
                id="role-admin-btn"
                onClick={() => setCurrentRole('ADMIN')}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentRole === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 mr-1" />
                <span>Admin</span>
              </button>
            </div>

            {/* User Details / Sign-in */}
            {currentUser && currentRole === 'CITIZEN' && (
              <div className="hidden lg:flex items-center pl-2 border-l border-slate-700 text-right">
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">{currentUser.name}</div>
                  <div className="text-[11px] font-mono text-amber-400">{currentUser.citizen_id}</div>
                </div>
              </div>
            )}

            {currentOfficer && currentRole === 'OFFICER' && (
              <div className="hidden lg:flex items-center pl-2 border-l border-slate-700 text-right">
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">{currentOfficer.name}</div>
                  <div className="text-[11px] text-emerald-400">{currentOfficer.badge_number}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
