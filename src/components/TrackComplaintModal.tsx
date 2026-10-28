import React, { useState } from 'react';
import { Search, Compass, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Complaint } from '../types';

interface TrackComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: Complaint[];
  initialComplaintId?: string;
}

export const TrackComplaintModal: React.FC<TrackComplaintModalProps> = ({
  isOpen,
  onClose,
  complaints,
  initialComplaintId = '',
}) => {
  const [complaintIdInput, setComplaintIdInput] = useState(initialComplaintId);
  const [searchedId, setSearchedId] = useState(initialComplaintId);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedId(complaintIdInput.trim());
  };

  const foundComplaint = complaints.find(
    (c) => c.complaint_id.toLowerCase() === searchedId.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Module 7 & 8: Real-Time Grievance Tracker & Audit Trail
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={complaintIdInput}
                onChange={(e) => setComplaintIdInput(e.target.value)}
                placeholder="Enter Complaint ID (e.g. CMP-2026-000458)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Track Now
            </button>
          </form>

          {/* Preset quick buttons */}
          <div className="flex items-center space-x-2 mt-2.5 text-[11px] text-slate-500">
            <span>Quick test:</span>
            {complaints.slice(0, 3).map((c) => (
              <button
                key={c.complaint_id}
                onClick={() => {
                  setComplaintIdInput(c.complaint_id);
                  setSearchedId(c.complaint_id);
                }}
                className="font-mono text-blue-600 hover:underline bg-slate-100 px-1.5 py-0.5 rounded"
              >
                {c.complaint_id}
              </button>
            ))}
          </div>
        </div>

        {/* Result Area */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
          {searchedId && !foundComplaint && (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Complaint Not Found</p>
              <p className="text-xs text-slate-400">
                No complaint record exists with ID: <span className="font-mono">{searchedId}</span>. Please verify the ID.
              </p>
            </div>
          )}

          {!searchedId && (
            <div className="py-12 text-center text-slate-400">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Enter a Complaint ID to inspect live progress</p>
            </div>
          )}

          {foundComplaint && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    {foundComplaint.complaint_id}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      foundComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : foundComplaint.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {foundComplaint.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{foundComplaint.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{foundComplaint.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <div>
                    Dept: <strong>{foundComplaint.department_name}</strong>
                  </div>
                  <div>
                    Location: <strong>{foundComplaint.area}, {foundComplaint.district}</strong>
                  </div>
                </div>
              </div>

              {/* Audit Trail Timeline */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                  Audit History Records
                </h5>
                <div className="space-y-3">
                  {foundComplaint.history?.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{h.updated_by}</span>
                        <span className="text-slate-400 font-mono">
                          {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-blue-700 font-semibold text-[11px]">
                        Status: {h.new_status}
                      </div>
                      <p className="text-slate-600 pt-0.5">{h.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
