import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Complaint, Officer, Department, COMPLAINT_CATEGORIES, ComplaintCategory } from '../types';

interface OfficerDashboardProps {
  currentOfficer: Officer;
  complaints: Complaint[];
  departments: Department[];
  onStatusUpdated: (complaintId: string, newStatus: string, remarks: string) => void;
  onReassigned: (complaintId: string, category: string, departmentId: string, remarks: string) => void;
  onViewAuditTrail: (complaintId: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentOfficer,
  complaints,
  departments,
  onStatusUpdated,
  onReassigned,
  onViewAuditTrail,
}) => {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Status Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>('IN_PROGRESS');
  const [actionRemarks, setActionRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reclassification / Correction Modal State (Module 6)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState<ComplaintCategory>('Roads');
  const [correctedDepartmentId, setCorrectedDepartmentId] = useState('');
  const [reassignRemarks, setReassignRemarks] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      c.complaint_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Officer KPI metrics
  const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const escalatedCount = complaints.filter((c) => c.status === 'ESCALATED').length;

  const handleOpenActionModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setActionStatus(
      complaint.status === 'PENDING'
        ? 'IN_PROGRESS'
        : complaint.status === 'IN_PROGRESS'
        ? 'RESOLVED'
        : 'IN_PROGRESS'
    );
    setActionRemarks('');
    setIsActionModalOpen(true);
  };

  const handleOpenReassignModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setCorrectedCategory((complaint.category as any) || 'Roads');
    setCorrectedDepartmentId(complaint.department_id);
    setReassignRemarks('');
    setIsReassignModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !actionRemarks.trim()) {
      alert('Please enter official remarks explaining the status transition.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.complaint_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionStatus,
          remarks: actionRemarks,
          updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onStatusUpdated(selectedComplaint.complaint_id, actionStatus, actionRemarks);
        setIsActionModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsReassigning(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.complaint_id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: correctedCategory,
          department_id: correctedDepartmentId,
          remarks:
            reassignRemarks ||
            `Officer corrected AI category to ${correctedCategory} and reassigned department.`,
          updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onReassigned(selectedComplaint.complaint_id, correctedCategory, correctedDepartmentId, reassignRemarks);
        setIsReassignModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to reassign:', err);
      alert('Error reassigning complaint.');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer Banner & Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-800/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-semibold text-amber-300 tracking-wider">
                  Grievance Officer Portal
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900/70 text-amber-200 border border-amber-700 font-mono">
                  {currentOfficer.badge_number}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentOfficer.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-300">
                <span>Role: <strong>{currentOfficer.role.replace('_', ' ')}</strong></span>
                <span>•</span>
                <span>Department: <strong>{currentOfficer.department_name}</strong></span>
                <span>•</span>
                <span>Jurisdiction: <strong>{currentOfficer.district}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Block (Section 7 Specification) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-amber-800/40">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{pendingCount}</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-0.5">
              Pending Complaints
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{inProgressCount}</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-0.5">
              In Progress
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{resolvedCount}</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-0.5">
              Resolved
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{escalatedCount}</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-0.5">
              Escalated / High Priority
            </div>
          </div>
        </div>
      </div>

      {/* Main Complaints Action Queue (Section 7 Table) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Officer Grievance Redressal Queue</h3>
            <p className="text-xs text-slate-500">
              Manage incoming complaints, update investigation status with audit remarks, and override AI predictions if required.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, citizen, area..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses ({complaints.length})</option>
              <option value="PENDING">Pending ({pendingCount})</option>
              <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
              <option value="RESOLVED">Resolved ({resolvedCount})</option>
              <option value="ESCALATED">Escalated ({escalatedCount})</option>
            </select>
          </div>
        </div>

        {/* Complaints Table (Section 7 Layout: Complaint ID | Category | Status | Action) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <th className="py-3 px-3">Complaint ID</th>
                <th className="py-3 px-3">Citizen & Location</th>
                <th className="py-3 px-3">Title & AI Classification</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No complaints matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                      {c.complaint_id}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{c.citizen_name}</div>
                      <div className="text-[11px] text-slate-500">{c.area}, {c.district}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.citizen_id}</div>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={c.title}>
                        {c.title}
                      </div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100 flex items-center">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI: {c.ai_prediction?.confidence || 95}% conf
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            c.priority === 'High' || c.priority === 'Emergency'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : c.status === 'ESCALATED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {/* Update Status Button */}
                      <button
                        onClick={() => handleOpenActionModal(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
                        title="Change Status & Add Official Remarks"
                      >
                        Update Status
                      </button>

                      {/* Correct AI Classification Button (Module 6) */}
                      <button
                        onClick={() => handleOpenReassignModal(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
                        title="Module 6: Reclassify Category / Department"
                      >
                        Correct AI
                      </button>

                      {/* Audit Trail Button (Module 8) */}
                      <button
                        onClick={() => onViewAuditTrail(c.complaint_id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                        title="View Full History Log"
                      >
                        Audit Trail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: UPDATE STATUS & ADD REMARKS (Module 7 & 8) */}
      {isActionModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Update Grievance Status
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Complaint ID: {selectedComplaint.complaint_id}
                </p>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Status *
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Dispatched / Under Work)</option>
                  <option value="RESOLVED">RESOLVED (Action Completed)</option>
                  <option value="ESCALATED">ESCALATED (Requires Higher Authority)</option>
                  <option value="REJECTED">REJECTED (Out of Jurisdiction / Invalid)</option>
                  <option value="REOPENED">REOPENED (Citizen Contested)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Action Remarks / Investigation Notes *
                </label>
                <textarea
                  rows={4}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Detail action taken (e.g. Dispatched maintenance team to site, replaced 40W LED fixture, street illumination restored)."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 This entry will be appended permanently to the Complaint History audit trail.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition flex items-center"
                >
                  {isUpdatingStatus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Recording Audit Log...
                    </>
                  ) : (
                    'Record & Update Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CORRECT AI CLASSIFICATION (Module 6) */}
      {isReassignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Module 6: Correct AI Classification
                </h4>
                <p className="text-xs text-slate-500">
                  Override AI recommendation and reassign to appropriate department
                </p>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              <span className="font-bold">Current AI Classification:</span> {selectedComplaint.category} →{' '}
              {selectedComplaint.department_name}
            </div>

            <form onSubmit={handleSaveReassignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Corrected Category
                </label>
                <select
                  value={correctedCategory}
                  onChange={(e) => setCorrectedCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Department
                </label>
                <select
                  value={correctedDepartmentId}
                  onChange={(e) => setCorrectedDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correction Justification / Audit Remark
                </label>
                <textarea
                  rows={3}
                  value={reassignRemarks}
                  onChange={(e) => setReassignRemarks(e.target.value)}
                  placeholder="Reason for reclassification (e.g. Issue involves storm drainage pipeline rather than road surface damage)."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow"
                >
                  {isReassigning ? 'Reassigning...' : 'Save Reclassification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
