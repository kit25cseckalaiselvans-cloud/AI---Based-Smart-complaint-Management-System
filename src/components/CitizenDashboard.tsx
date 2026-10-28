import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw,
  MapPin,
  Building,
  User,
  CheckCircle,
  Compass,
  ArrowRight,
  Tag,
} from 'lucide-react';
import {
  Complaint,
  User as UserType,
  ComplaintCategory,
  Department,
  COMPLAINT_CATEGORIES,
  AiPrediction,
} from '../types';
import { TN_DISTRICTS, SAMPLE_COMPLAINTS_FOR_DEMO, OFFICIAL_LINKS } from '../data/mockData';

interface CitizenDashboardProps {
  currentUser: UserType;
  complaints: Complaint[];
  departments: Department[];
  onComplaintCreated: (newComplaint: Complaint) => void;
  onSelectComplaintForTracking: (complaintId: string) => void;
  onOpenOfficialLinkModal: (link: any) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  complaints,
  departments,
  onComplaintCreated,
  onSelectComplaintForTracking,
  onOpenOfficialLinkModal,
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'MY_COMPLAINTS' | 'TRACK' | 'PROFILE' | 'OFFICIAL_LINKS'>('REGISTER');

  // Complaint Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(currentUser.district || 'Chennai');
  const [taluk, setTaluk] = useState('Aminjikarai');
  const [area, setArea] = useState('Anna Nagar West');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>('Street Lights');
  const [contactInfo, setContactInfo] = useState(`${currentUser.phone} | ${currentUser.email}`);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // AI Classification State
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AiPrediction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<Complaint | null>(null);

  // Tracking Search Input
  const [searchComplaintId, setSearchComplaintId] = useState('');

  // Identity Verification State in Profile
  const [docType, setDocType] = useState<'Aadhaar Card' | 'Voter ID' | 'Driving License'>('Aadhaar Card');
  const [docRef, setDocRef] = useState('XXXX-XXXX-8921');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);
  const [docVerifiedSuccess, setDocVerifiedSuccess] = useState(false);

  // Filter complaints for this citizen
  const citizenComplaints = complaints.filter((c) => c.citizen_id === currentUser.citizen_id);

  // Handle AI Auto-Classification
  const handleTriggerAiClassification = async () => {
    if (!description.trim()) {
      alert('Please enter a complaint description first so the AI can analyze it.');
      return;
    }

    setIsAiClassifying(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          district,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const pred: AiPrediction = {
          category: data.category,
          recommendedDepartment: data.recommendedDepartment,
          confidence: data.confidence,
          urgency: data.urgency,
          reasoning: data.reasoning,
          keyKeywords: data.keyKeywords || [],
        };
        setAiPrediction(pred);

        // Auto-select category and matching department
        if (COMPLAINT_CATEGORIES.includes(data.category as any)) {
          setSelectedCategory(data.category as any);
        }
        const matchedDept = departments.find(
          (d) =>
            d.department_name.toLowerCase().includes(data.recommendedDepartment.toLowerCase()) ||
            data.recommendedDepartment.toLowerCase().includes(d.department_name.toLowerCase()) ||
            d.category_mappings.includes(data.category)
        );
        if (matchedDept) {
          setSelectedDepartmentId(matchedDept.department_id);
        }
      }
    } catch (err) {
      console.error('AI classification failed:', err);
    } finally {
      setIsAiClassifying(false);
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !district) {
      alert('Please fill all mandatory fields: Title, Description, and District.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: currentUser.citizen_id,
          title,
          description,
          district,
          taluk,
          area,
          department_id: selectedDepartmentId || undefined,
          category: selectedCategory,
          ai_prediction: aiPrediction || undefined,
          attachment_name: attachmentName || undefined,
          attachment_url: attachmentPreview || undefined,
          contact_info: contactInfo,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setSubmissionSuccess(data.complaint);
        onComplaintCreated(data.complaint);
        // Reset form
        setTitle('');
        setDescription('');
        setAiPrediction(null);
        setAttachmentName('');
        setAttachmentPreview(null);
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mock Attachment
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // One-click demo template applicator
  const applySampleComplaint = (sample: (typeof SAMPLE_COMPLAINTS_FOR_DEMO)[0]) => {
    setTitle(sample.title);
    setDescription(sample.description);
    setDistrict(sample.district);
    setArea(sample.area);
    if (COMPLAINT_CATEGORIES.includes(sample.category as any)) {
      setSelectedCategory(sample.category as any);
    }
    setAiPrediction(null);
  };

  // Handle Identity Verification simulation
  const handleVerifyIdentity = async () => {
    setIsVerifyingDoc(true);
    try {
      const res = await fetch('/api/identity/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: currentUser.citizen_id,
          document_type: docType,
          document_reference: docRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocVerifiedSuccess(true);
        setTimeout(() => setDocVerifiedSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Doc verify error:', err);
    } finally {
      setIsVerifyingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Citizen ID Header Card (Module 1 & 2) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/80 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-semibold text-blue-300 tracking-wider">
                  Citizen Dashboard
                </span>
                <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Identity Verified
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentUser.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300 font-mono">
                <span>Citizen ID: <strong className="text-amber-400">{currentUser.citizen_id}</strong></span>
                <span>•</span>
                <span>District: <strong className="text-slate-200">{currentUser.district}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-200">{currentUser.phone}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700">
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[80px]">
              <div className="text-lg font-bold text-white">{citizenComplaints.length}</div>
              <div className="text-[11px] text-slate-400">Total Filed</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-950/50 border border-amber-800/50 text-center min-w-[80px]">
              <div className="text-lg font-bold text-amber-400">
                {citizenComplaints.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-[11px] text-amber-300/80">Active</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-center min-w-[80px]">
              <div className="text-lg font-bold text-emerald-400">
                {citizenComplaints.filter((c) => c.status === 'RESOLVED').length}
              </div>
              <div className="text-[11px] text-emerald-300/80">Resolved</div>
            </div>
          </div>
        </div>

        {/* Citizen Navigation Tabs (Module 6 Specification) */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-700/80">
          <button
            id="tab-register-complaint"
            onClick={() => setActiveTab('REGISTER')}
            className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'REGISTER'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Register Complaint
          </button>
          <button
            id="tab-my-complaints"
            onClick={() => setActiveTab('MY_COMPLAINTS')}
            className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'MY_COMPLAINTS'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            My Complaints ({citizenComplaints.length})
          </button>
          <button
            id="tab-track-complaint"
            onClick={() => setActiveTab('TRACK')}
            className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'TRACK'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Track Complaint & Audit Trail
          </button>
          <button
            id="tab-profile"
            onClick={() => setActiveTab('PROFILE')}
            className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'PROFILE'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Profile & Identity Proof
          </button>
          <button
            id="tab-official-links"
            onClick={() => setActiveTab('OFFICIAL_LINKS')}
            className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'OFFICIAL_LINKS'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Official Government Links
          </button>
        </div>
      </div>

      {/* Success Notification Banner after submission */}
      {submissionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 text-emerald-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-950">
                Complaint Registered Successfully! Complaint ID: <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{submissionSuccess.complaint_id}</span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                AI classified as <strong>{submissionSuccess.category}</strong> and routed to <strong>{submissionSuccess.department_name}</strong>. Initial audit entry recorded.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onSelectComplaintForTracking(submissionSuccess.complaint_id);
              setActiveTab('TRACK');
            }}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            View Audit Trail <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      )}

      {/* TAB 1: REGISTER COMPLAINT (Module 3, 4, 5) */}
      {activeTab === 'REGISTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Complaint Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Module 3: Citizen Complaint Registration</h3>
                <p className="text-xs text-slate-500">
                  Fill in grievance details. The department is auto-suggested by AI from your description.
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                Citizen ID: {currentUser.citizen_id}
              </span>
            </div>

            {/* Demo Quick Presets */}
            <div className="mb-5 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                Quick Test Prompts (1-Click Fill from Real Grievances):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_COMPLAINTS_FOR_DEMO.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySampleComplaint(sample)}
                    className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-2.5 py-1 rounded-md transition font-medium text-left"
                  >
                    {sample.category}: {sample.title.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Complaint Title *
                </label>
                <input
                  id="complaint-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Street lights are not working in my area"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                  required
                />
              </div>

              {/* Description & AI Trigger Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Complaint Description *
                  </label>
                  <button
                    type="button"
                    id="ai-analyze-btn"
                    onClick={handleTriggerAiClassification}
                    disabled={isAiClassifying || !description.trim()}
                    className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md transition disabled:opacity-50"
                  >
                    {isAiClassifying ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Auto-Classify with AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="complaint-desc-input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue with specific location details, duration, severity, and hazards..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Tip: The Java backend passes this text to the AI model to identify category and department.
                </p>
              </div>

              {/* Location: District, Taluk, Area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <select
                    id="complaint-district-select"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    required
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Taluk
                  </label>
                  <input
                    id="complaint-taluk-input"
                    type="text"
                    value={taluk}
                    onChange={(e) => setTaluk(e.target.value)}
                    placeholder="e.g. Aminjikarai"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Area / Ward
                  </label>
                  <input
                    id="complaint-area-input"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Anna Nagar 2nd Ave"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Department Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Complaint Category
                    </label>
                    {aiPrediction && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        AI Recommended
                      </span>
                    )}
                  </div>
                  <select
                    id="complaint-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  >
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Assigned Department
                    </label>
                    {aiPrediction && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                        Auto-Matched
                      </span>
                    )}
                  </div>
                  <select
                    id="complaint-department-select"
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">Auto-Route by AI Category</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attachment Support & Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attachment (Photo / Document)
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center px-3 py-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 transition">
                      <UploadCloud className="w-4 h-4 mr-2 text-slate-400" />
                      {attachmentName ? attachmentName.slice(0, 24) : 'Upload photo of issue'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </label>
                    {attachmentName && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentName('');
                          setAttachmentPreview(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Information
                  </label>
                  <input
                    id="complaint-contact-input"
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  id="submit-complaint-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Registering & Generating Complaint ID...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: AI Live Inference Card (Module 5) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Module 5: AI Classifier Engine</h4>
                  <p className="text-[11px] text-slate-400">Automated classification & recommendation</p>
                </div>
              </div>

              {aiPrediction ? (
                <div className="space-y-3 pt-2 border-t border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Identified Category:</span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">
                      {aiPrediction.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Confidence Score:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {aiPrediction.confidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Urgency Assessment:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        aiPrediction.urgency === 'Emergency'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : aiPrediction.urgency === 'High'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {aiPrediction.urgency}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Recommended Department:</span>
                    <div className="text-xs font-semibold text-slate-200 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      {aiPrediction.recommendedDepartment}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1">AI Rationale / Reasoning:</span>
                    <div className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed italic">
                      "{aiPrediction.reasoning}"
                    </div>
                  </div>

                  {aiPrediction.keyKeywords && aiPrediction.keyKeywords.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-400 block mb-1">Key Extracted Terms:</span>
                      <div className="flex flex-wrap gap-1">
                        {aiPrediction.keyKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-xs">
                    Enter your grievance and click <strong>"Auto-Classify with AI"</strong> or select a sample prompt to see instant categorization.
                  </p>
                </div>
              )}
            </div>

            {/* Workflow Diagram Reference (Module 4) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center">
                <Compass className="w-4 h-4 mr-1.5 text-blue-600" />
                Module 4: Processing Workflow
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>Citizen enters complaint form</li>
                <li>Backend receives complaint</li>
                <li>AI analyzes text & category</li>
                <li>Matching Department selected</li>
                <li>Unique Complaint ID generated</li>
                <li>Saved to Database with initial History</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY COMPLAINTS LIST (Module 1, 7) */}
      {activeTab === 'MY_COMPLAINTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Personal Complaint History</h3>
              <p className="text-xs text-slate-500">
                All grievances registered under Citizen ID: <strong className="text-slate-800 font-mono">{currentUser.citizen_id}</strong>
              </p>
            </div>
            <button
              onClick={() => setActiveTab('REGISTER')}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              File New Complaint
            </button>
          </div>

          {citizenComplaints.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No complaints filed yet</p>
              <p className="text-xs text-slate-400">You haven't submitted any complaints under this account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citizenComplaints.map((c) => (
                <div
                  key={c.complaint_id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.complaint_id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Category: <strong className="text-slate-700">{c.category}</strong></span>
                      <span>Area: <strong className="text-slate-700">{c.area}</strong></span>
                    </div>
                    <div>
                      <span>Department: <strong className="text-slate-700">{c.department_name}</strong></span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Lodged: {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => {
                          onSelectComplaintForTracking(c.complaint_id);
                          setActiveTab('TRACK');
                        }}
                        className="inline-flex items-center font-bold text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Track Audit Trail <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRACK COMPLAINT & AUDIT TRAIL (Module 7 & 8) */}
      {activeTab === 'TRACK' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Module 7 & 8: Complaint Status Tracking & Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Every action, AI classification, department assignment, and officer remarks are recorded in a permanent audit log.
            </p>
          </div>

          {/* Search bar for complaint ID */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="track-complaint-search-input"
              type="text"
              value={searchComplaintId}
              onChange={(e) => setSearchComplaintId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CMP-2026-000458)"
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (citizenComplaints.length > 0) {
                    setSearchComplaintId(citizenComplaints[0].complaint_id);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Use Latest
              </button>
            </div>
          </div>

          {/* Display Complaint Detail & Timeline */}
          {(() => {
            const activeComplaint = complaints.find(
              (c) =>
                c.complaint_id.toLowerCase() === searchComplaintId.trim().toLowerCase() ||
                (citizenComplaints.length > 0 && !searchComplaintId && c.complaint_id === citizenComplaints[0].complaint_id)
            );

            if (!activeComplaint) {
              return (
                <div className="py-12 text-center text-slate-400">
                  <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Enter a valid Complaint ID to view the full audit trail</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching: <button onClick={() => setSearchComplaintId('CMP-2026-000458')} className="text-blue-600 underline font-mono">CMP-2026-000458</button> or <button onClick={() => setSearchComplaintId('CMP-2026-000459')} className="text-blue-600 underline font-mono">CMP-2026-000459</button>
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Complaint Overview Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded">
                        {activeComplaint.complaint_id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {activeComplaint.category}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        activeComplaint.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : activeComplaint.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      Status: {activeComplaint.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{activeComplaint.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{activeComplaint.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Department:</span>
                      <span className="font-semibold text-slate-800">{activeComplaint.department_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Officer In Charge:</span>
                      <span className="font-semibold text-slate-800">{activeComplaint.officer_name || 'Automated Queue'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jurisdiction / Area:</span>
                      <span className="font-semibold text-slate-800">{activeComplaint.area}, {activeComplaint.district}</span>
                    </div>
                  </div>
                </div>

                {/* Status Stepper Progression */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Status Lifecycle Pipeline
                  </h4>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
                      style={{
                        width:
                          activeComplaint.status === 'RESOLVED'
                            ? '100%'
                            : activeComplaint.status === 'IN_PROGRESS'
                            ? '50%'
                            : '10%',
                      }}
                    />

                    {/* Step 1: Pending */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow">
                        ✓
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-1.5">Submitted</span>
                      <span className="text-[10px] text-slate-400">Pending Review</span>
                    </div>

                    {/* Step 2: In Progress */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                          activeComplaint.status === 'IN_PROGRESS' || activeComplaint.status === 'RESOLVED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {activeComplaint.status === 'RESOLVED' ? '✓' : '2'}
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-1.5">In Progress</span>
                      <span className="text-[10px] text-slate-400">Officer Dispatched</span>
                    </div>

                    {/* Step 3: Resolved */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                          activeComplaint.status === 'RESOLVED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {activeComplaint.status === 'RESOLVED' ? '✓' : '3'}
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-1.5">Resolved</span>
                      <span className="text-[10px] text-slate-400">Grievance Closed</span>
                    </div>
                  </div>
                </div>

                {/* Complete Complaint History / Audit Trail (Module 8 Specification) */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
                    <span>Audit Trail Log (Module 8)</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      Immutable Historical Records ({activeComplaint.history?.length || 0})
                    </span>
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activeComplaint.history && activeComplaint.history.length > 0 ? (
                      activeComplaint.history.map((hist, idx) => (
                        <div key={hist.history_id || idx} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-1">
                              <span className="font-bold text-slate-900">
                                {hist.updated_by}
                              </span>
                              <span className="text-slate-400 font-mono">
                                {new Date(hist.timestamp).toLocaleDateString()} {new Date(hist.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 pt-0.5">
                              <span className="text-[11px] font-semibold text-blue-700">
                                Status: {hist.new_status}
                              </span>
                            </div>
                            <p className="text-slate-700 pt-1 text-xs leading-relaxed">
                              {hist.remarks}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No audit records found.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: PROFILE & IDENTITY VERIFICATION (Module 1, 2) */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Citizen Profile Details</h3>
              <p className="text-xs text-slate-500">Personal credentials and contact address</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{currentUser.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Citizen ID (Unique)</span>
                <span className="font-mono font-bold text-amber-700 text-sm">{currentUser.citizen_id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Registered Email</span>
                <span className="font-medium text-slate-800">{currentUser.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-medium text-slate-800">{currentUser.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Address</span>
                <span className="font-medium text-slate-800">{currentUser.address}</span>
              </div>
            </div>
          </div>

          {/* Module 2: Identity Verification Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Module 2: Identity Verification</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Privacy-preserving citizen document verification
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-semibold">Verification Status:</span>
                <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                  VERIFIED
                </span>
              </div>
              <div className="text-xs text-emerald-800">
                Document Type: <strong>Aadhaar Card Reference</strong>
              </div>
              <div className="text-xs font-mono text-emerald-900">
                Reference ID: <strong>XXXX-XXXX-8921</strong>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1">
                🔒 Privacy Rule Adhered: Only the minimum necessary identity reference is collected with restricted access.
              </p>
            </div>

            {/* Test re-verify or link alternative ID */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Update Identity Proof Reference
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Aadhaar Card">Aadhaar Card Reference</option>
                <option value="Voter ID">Voter ID (EPIC Card)</option>
                <option value="Driving License">Driving License</option>
              </select>
              <input
                type="text"
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                placeholder="e.g. XXXX-XXXX-8921"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyIdentity}
                disabled={isVerifyingDoc}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition"
              >
                {isVerifyingDoc ? 'Verifying Reference...' : 'Update Verified Reference'}
              </button>
              {docVerifiedSuccess && (
                <p className="text-xs text-emerald-600 font-semibold text-center">
                  ✓ Identity reference updated successfully!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICIAL GOVERNMENT LINKS (Section 5) */}
      {activeTab === 'OFFICIAL_LINKS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Section 5: Official Government Services & Links</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified official state and central portals. A safety confirmation modal is displayed before leaving this application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_LINKS.map((link, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      {link.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {link.portalCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{link.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{link.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <button
                    onClick={() => onOpenOfficialLinkModal(link)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Continue to Official Portal
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
