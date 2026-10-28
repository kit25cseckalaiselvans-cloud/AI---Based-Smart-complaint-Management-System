import React, { useState } from 'react';
import {
  Shield,
  Users,
  Building2,
  PieChart,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  History,
  AlertTriangle,
  ArrowRight,
  Database,
  Briefcase,
} from 'lucide-react';
import { Complaint, User, Officer, Department, ComplaintHistory, COMPLAINT_CATEGORIES } from '../types';

interface AdminDashboardProps {
  complaints: Complaint[];
  departments: Department[];
  officers: Officer[];
  users: User[];
  auditHistory: ComplaintHistory[];
  onViewAuditTrail: (complaintId: string) => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  departments,
  officers,
  users,
  auditHistory,
  onViewAuditTrail,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPLAINTS' | 'CITIZENS' | 'OFFICERS' | 'DEPARTMENTS' | 'AUDIT'>('OVERVIEW');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Stats calculations
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
  const escalated = complaints.filter((c) => c.status === 'ESCALATED').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesDept = selectedDeptFilter === 'ALL' || c.department_id === selectedDeptFilter;
    const matchesSearch =
      !complaintSearch ||
      c.complaint_id.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.citizen_name.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(complaintSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Export complaints as CSV
  const handleExportCSV = () => {
    const headers = [
      'Complaint ID',
      'Citizen ID',
      'Citizen Name',
      'Title',
      'Category',
      'Department',
      'Officer',
      'Status',
      'Priority',
      'District',
      'Created At',
      'Resolved At',
    ];
    const rows = complaints.map((c) => [
      `"${c.complaint_id}"`,
      `"${c.citizen_id}"`,
      `"${c.citizen_name}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.department_name}"`,
      `"${c.officer_name || 'N/A'}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${c.district}"`,
      `"${c.created_at}"`,
      `"${c.resolved_at || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grievances_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/50 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-semibold text-purple-300 tracking-wider">
                  Module 8: State Administration Portal
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                  Super Admin
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Central Grievance Redressal Command Center
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                E-Governance Commission • Overall System Governance, AI Routing Audits & Inter-Departmental Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV Report
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-purple-800/40">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'OVERVIEW'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 mr-1.5" />
            Analytics & AI Overview
          </button>
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'COMPLAINTS'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Complaints Master ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('CITIZENS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'CITIZENS'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Citizens Directory ({users.filter((u) => u.role === 'CITIZEN').length})
          </button>
          <button
            onClick={() => setActiveTab('OFFICERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'OFFICERS'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Officers Roster ({officers.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              activeTab === 'AUDIT'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Master Audit Trail ({auditHistory.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Grievances
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 font-mono">{total}</div>
              <div className="text-xs text-slate-500 mt-1">Registered across state</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Pending Triage
              </span>
              <div className="text-3xl font-black text-amber-600 mt-1 font-mono">{pending}</div>
              <div className="text-xs text-slate-500 mt-1">Awaiting officer action</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                In Active Progress
              </span>
              <div className="text-3xl font-black text-blue-600 mt-1 font-mono">{inProgress}</div>
              <div className="text-xs text-slate-500 mt-1">Field teams dispatched</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Resolution Rate
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1 font-mono">{resolutionRate}%</div>
              <div className="text-xs text-slate-500 mt-1">{resolved} cases fully closed</div>
            </div>
          </div>

          {/* AI Category Distribution breakdown & Department Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">AI Complaint Category Distribution</h3>
              </div>
              <div className="space-y-3">
                {COMPLAINT_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat}</span>
                        <span className="font-mono text-slate-500 font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Department Caseload</h3>
              </div>
              <div className="space-y-3">
                {departments.map((dept) => {
                  const count = complaints.filter((c) => c.department_id === dept.department_id).length;
                  return (
                    <div
                      key={dept.department_id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{dept.department_name}</div>
                        <div className="text-[11px] text-slate-500">Contact: {dept.contact}</div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-purple-100 text-purple-800">
                        {count} Active Cases
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLAINTS MASTER */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">All System Complaints</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search ID, title, citizen..."
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-y border-slate-200">
                  <th className="p-3">Complaint ID</th>
                  <th className="p-3">Citizen & District</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">{c.complaint_id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{c.citizen_name}</div>
                      <div className="text-[11px] text-slate-500">{c.district}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{c.category}</td>
                    <td className="p-3 text-slate-600">{c.department_name}</td>
                    <td className="p-3">
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onViewAuditTrail(c.complaint_id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View Trail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CITIZENS DIRECTORY */}
      {activeTab === 'CITIZENS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Registered Citizen Accounts (Module 1 & 2)</h3>
            <p className="text-xs text-slate-500">Verified Citizen IDs and privacy-compliant identity proofs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-y border-slate-200">
                  <th className="p-3">Citizen ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email & Contact</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Identity Proof Status</th>
                  <th className="p-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter((u) => u.role === 'CITIZEN')
                  .map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-amber-700">{u.citizen_id}</td>
                      <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600">
                        <div>{u.email}</div>
                        <div className="text-[11px] text-slate-400">{u.phone}</div>
                      </td>
                      <td className="p-3 text-slate-700">{u.district}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Proof
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICERS ROSTER */}
      {activeTab === 'OFFICERS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Grievance Redressal Officers Roster</h3>
            <p className="text-xs text-slate-500">Authorized personnel managing investigation and resolution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officers.map((off) => (
              <div key={off.officer_id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-700">{off.badge_number}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {off.role.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{off.name}</h4>
                <div className="text-xs text-slate-600 font-medium">{off.department_name}</div>
                <div className="text-[11px] text-slate-400">Jurisdiction: {off.district}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DEPARTMENTS */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Departments & AI Category Mapping Matrix</h3>
            <p className="text-xs text-slate-500">Configured routing paths for automated classification</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d) => (
              <div key={d.department_id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-700">{d.department_id}</span>
                  <span className="text-xs text-slate-400">{d.district}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{d.department_name}</h4>
                <div className="text-xs text-slate-600">Contact: {d.contact} • {d.email}</div>
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Mapped AI Categories:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {d.category_mappings.map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MASTER AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Master System Audit Trail Log (Module 8)</h3>
            <p className="text-xs text-slate-500">
              Chronological ledger of every submission, AI decision, status transition, and officer remark
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-y border-slate-200">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Complaint ID</th>
                  <th className="p-3">Actor / Updated By</th>
                  <th className="p-3">Status Change</th>
                  <th className="p-3">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditHistory.map((h, idx) => (
                  <tr key={h.history_id || idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {h.complaint_id}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{h.updated_by}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {h.new_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-md">{h.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
