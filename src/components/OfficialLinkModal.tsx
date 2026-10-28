import React from 'react';
import { ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OfficialLink } from '../types';

interface OfficialLinkModalProps {
  link: OfficialLink | null;
  onClose: () => void;
}

export const OfficialLinkModal: React.FC<OfficialLinkModalProps> = ({ link, onClose }) => {
  if (!link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-amber-800 tracking-wider">
              External Official Government Portal Notice
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              You are navigating to an Official Government Web Service
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>{link.title}</span>
            <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {link.portalCode}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">{link.description}</p>
          <div className="font-mono text-slate-500 text-[11px] truncate pt-1 border-t border-slate-200">
            Destination: {link.url}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Transparency Notice:</strong> This AI-Based Smart Complaint Management System is an automated civic interface. Official administrative actions, legal filings, and certified statutory redressals are administered by the respective Government authorities.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Stay on Portal
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
          >
            Continue to Official Portal
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
