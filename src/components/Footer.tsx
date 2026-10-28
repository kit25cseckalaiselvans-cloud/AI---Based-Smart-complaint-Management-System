import React from 'react';
import { Shield, Sparkles, Phone, Lock, CheckCircle2, Layers } from 'lucide-react';

interface FooterProps {
  onOpenArchitecture: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenArchitecture }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: System Title & Emblem */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-white font-bold text-sm leading-tight">
                AI Smart Grievance Redressal
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed as a Java + AI + Relational Database + Web Portal system for public grievance classification and transparent citizen redressal.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Identity Verification & Privacy Compliant</span>
            </div>
          </div>

          {/* Col 2: System Architecture & Tech Stack */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">
              System Specifications
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Spring Boot REST Controller Layer</li>
              <li>• Gemini 3.8 Flash AI Model Integration</li>
              <li>• PostgreSQL / MySQL Complaint History Schema</li>
              <li>• Citizen & Officer Interactive Dashboards</li>
              <li>
                <button
                  onClick={onOpenArchitecture}
                  className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center pt-1"
                >
                  <Layers className="w-3 h-3 mr-1" /> View Full Java & SQL Blueprint
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Grievance Redressal Standards */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">
              Statutory Redressal Standards
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Street Lights & Power: 24 - 48 Hours</li>
              <li>• Drinking Water Supply: 12 - 24 Hours</li>
              <li>• Road Maintenance & Potholes: 3 - 7 Working Days</li>
              <li>• Garbage & Sanitation: 24 Hours</li>
              <li>• Revenue & Land Disputes: 15 Working Days</li>
            </ul>
          </div>

          {/* Col 4: Official Emergency & Citizen Helplines */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">
              Emergency Helplines
            </h4>
            <div className="space-y-1 text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>State Grievance CM Helpline: <strong>1100</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Electricity Consumer Care (TANGEDCO): <strong>1912</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Central CPGRAMS Portal: <strong>1800-11-0031</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>National Cyber Crime Helpline: <strong>1930</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
          <div>
            AI-Based Smart Complaint Management System • Prototype & Specification Demo
          </div>
          <div className="flex items-center space-x-4">
            <span>Server: Port 3000 Active</span>
            <span>•</span>
            <span>Gemini 3.8 Flash AI Model</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
