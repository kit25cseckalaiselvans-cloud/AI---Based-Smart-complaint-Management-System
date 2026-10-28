import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CitizenDashboard } from './components/CitizenDashboard';
import { OfficerDashboard } from './components/OfficerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureModal } from './components/ArchitectureModal';
import { TrackComplaintModal } from './components/TrackComplaintModal';
import { OfficialLinkModal } from './components/OfficialLinkModal';
import { Footer } from './components/Footer';
import {
  UserRole,
  User,
  Officer,
  Department,
  Complaint,
  ComplaintHistory,
  OfficialLink,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_OFFICERS,
  INITIAL_DEPARTMENTS,
  INITIAL_COMPLAINTS,
  INITIAL_COMPLAINT_HISTORY,
} from './data/mockData';

export default function App() {
  // Current view role
  const [currentRole, setCurrentRole] = useState<UserRole>('CITIZEN');

  // Active user / officer entities
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [currentOfficer, setCurrentOfficer] = useState<Officer>(INITIAL_OFFICERS[0]);

  // Master State loaded from backend API
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [officers, setOfficers] = useState<Officer[]>(INITIAL_OFFICERS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [auditHistory, setAuditHistory] = useState<ComplaintHistory[]>(INITIAL_COMPLAINT_HISTORY);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Navigation state
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState<string>('');
  const [selectedOfficialLink, setSelectedOfficialLink] = useState<OfficialLink | null>(null);

  // Fetch initial data from server API
  const fetchAllData = async () => {
    try {
      const [resComplaints, resDepts, resOfficers, resHistory] = await Promise.all([
        fetch('/api/complaints'),
        fetch('/api/departments'),
        fetch('/api/officers'),
        fetch('/api/audit-history'),
      ]);

      if (resComplaints.ok) {
        const data = await resComplaints.json();
        if (data.complaints) setComplaints(data.complaints);
      }
      if (resDepts.ok) {
        const data = await resDepts.json();
        if (data.departments) setDepartments(data.departments);
      }
      if (resOfficers.ok) {
        const data = await resOfficers.json();
        if (data.officers) setOfficers(data.officers);
      }
      if (resHistory.ok) {
        const data = await resHistory.json();
        if (data.history) setAuditHistory(data.history);
      }
    } catch (err) {
      console.warn('Backend fetch fallback to seed data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // When a new complaint is registered
  const handleComplaintCreated = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);

    // Create immediate audit entry
    const newHist: ComplaintHistory = {
      history_id: `HIST-${Date.now()}`,
      complaint_id: newComplaint.complaint_id,
      old_status: null,
      new_status: 'PENDING',
      updated_by: `Citizen: ${currentUser.name} (${currentUser.citizen_id})`,
      remarks: `Complaint lodged via Citizen Web Portal with AI auto-classification: ${newComplaint.category}.`,
      timestamp: new Date().toISOString(),
    };
    setAuditHistory((prev) => [newHist, ...prev]);
  };

  // When an officer or admin updates the status
  const handleStatusUpdated = (complaintId: string, newStatus: string, remarks: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.complaint_id === complaintId) {
          const oldStatus = c.status;
          const updatedHistory = [
            ...(c.history || []),
            {
              history_id: `HIST-${Date.now()}`,
              complaint_id: complaintId,
              old_status: oldStatus,
              new_status: newStatus as any,
              updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
              remarks,
              timestamp: new Date().toISOString(),
            },
          ];
          return {
            ...c,
            status: newStatus as any,
            updated_at: new Date().toISOString(),
            resolved_at: newStatus === 'RESOLVED' ? new Date().toISOString() : c.resolved_at,
            history: updatedHistory,
          };
        }
        return c;
      })
    );

    // Append to global audit log
    const histEntry: ComplaintHistory = {
      history_id: `HIST-${Date.now()}`,
      complaint_id: complaintId,
      old_status: null,
      new_status: newStatus as any,
      updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
      remarks,
      timestamp: new Date().toISOString(),
    };
    setAuditHistory((prev) => [histEntry, ...prev]);
  };

  // When an officer corrects the AI classification / reassigns
  const handleReassigned = (
    complaintId: string,
    newCategory: string,
    newDepartmentId: string,
    remarks: string
  ) => {
    const dept = departments.find((d) => d.department_id === newDepartmentId);
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.complaint_id === complaintId) {
          const updatedHistory = [
            ...(c.history || []),
            {
              history_id: `HIST-${Date.now()}`,
              complaint_id: complaintId,
              old_status: c.status,
              new_status: c.status,
              updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
              remarks: `Category corrected to '${newCategory}' and reassigned to '${dept?.department_name || newDepartmentId}'. ${remarks}`,
              timestamp: new Date().toISOString(),
            },
          ];
          return {
            ...c,
            category: newCategory as any,
            department_id: newDepartmentId,
            department_name: dept?.department_name || c.department_name,
            updated_at: new Date().toISOString(),
            history: updatedHistory,
          };
        }
        return c;
      })
    );

    const histEntry: ComplaintHistory = {
      history_id: `HIST-${Date.now()}`,
      complaint_id: complaintId,
      old_status: null,
      new_status: 'IN_PROGRESS',
      updated_by: `Officer: ${currentOfficer.name} (${currentOfficer.badge_number})`,
      remarks: `Reassigned to ${dept?.department_name || newDepartmentId} (${newCategory}). ${remarks}`,
      timestamp: new Date().toISOString(),
    };
    setAuditHistory((prev) => [histEntry, ...prev]);
  };

  const handleOpenTracker = (complaintId?: string) => {
    if (complaintId) {
      setActiveTrackingId(complaintId);
    }
    setIsTrackModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentUser={currentUser}
        currentOfficer={currentOfficer}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        onOpenTracker={() => handleOpenTracker()}
        onOpenAuth={() => {}}
        onLogout={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'CITIZEN' && (
          <CitizenDashboard
            currentUser={currentUser}
            complaints={complaints}
            departments={departments}
            onComplaintCreated={handleComplaintCreated}
            onSelectComplaintForTracking={(id) => handleOpenTracker(id)}
            onOpenOfficialLinkModal={(link) => setSelectedOfficialLink(link)}
          />
        )}

        {currentRole === 'OFFICER' && (
          <OfficerDashboard
            currentOfficer={currentOfficer}
            complaints={complaints}
            departments={departments}
            onStatusUpdated={handleStatusUpdated}
            onReassigned={handleReassigned}
            onViewAuditTrail={(id) => handleOpenTracker(id)}
          />
        )}

        {currentRole === 'ADMIN' && (
          <AdminDashboard
            complaints={complaints}
            departments={departments}
            officers={officers}
            users={users}
            auditHistory={auditHistory}
            onViewAuditTrail={(id) => handleOpenTracker(id)}
            onRefreshData={fetchAllData}
          />
        )}
      </main>

      {/* Interactive System Architecture Inspector Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      {/* Quick Track Modal */}
      <TrackComplaintModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        complaints={complaints}
        initialComplaintId={activeTrackingId}
      />

      {/* Official Government Links Modal */}
      <OfficialLinkModal
        link={selectedOfficialLink}
        onClose={() => setSelectedOfficialLink(null)}
      />

      {/* Footer with statutory standards & emergency lines */}
      <Footer onOpenArchitecture={() => setIsArchitectureModalOpen(true)} />
    </div>
  );
}
