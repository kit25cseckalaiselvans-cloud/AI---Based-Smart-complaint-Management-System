export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export type ComplaintStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REOPENED'
  | 'ESCALATED';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Emergency';

export const COMPLAINT_CATEGORIES = [
  'Roads',
  'Street Lights',
  'Water Supply',
  'Electricity',
  'Garbage/Sanitation',
  'Drainage',
  'Public Transport',
  'Police',
  'Revenue',
  'Health',
  'Education',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface User {
  user_id: string;
  citizen_id: string; // e.g. TN-CIT-000102
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  identity_verified: boolean;
  role: UserRole;
  created_at: string;
}

export interface IdentityVerification {
  verification_id: string;
  citizen_id: string;
  document_type: 'Aadhaar Card' | 'Voter ID' | 'Driving License' | 'Ration Card' | 'Passport';
  document_reference: string;
  verification_status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  verified_at: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  district: string;
  contact: string;
  email: string;
  category_mappings: string[];
}

export interface Officer {
  officer_id: string;
  name: string;
  department_id: string;
  department_name?: string;
  username: string;
  role: 'FIELD_OFFICER' | 'ZONAL_OFFICER' | 'SUPERINTENDENT';
  district: string;
  badge_number: string;
}

export interface ComplaintHistory {
  history_id: string;
  complaint_id: string;
  old_status: string;
  new_status: string;
  updated_by: string;
  remarks: string;
  timestamp: string;
}

export interface AiPrediction {
  category: ComplaintCategory | string;
  recommendedDepartment: string;
  confidence: number;
  urgency: PriorityLevel;
  reasoning: string;
  keyKeywords: string[];
}

export interface Complaint {
  complaint_id: string; // e.g. CMP-2026-000458
  citizen_id: string;
  citizen_name: string;
  citizen_phone: string;
  title: string;
  description: string;
  district: string;
  taluk: string;
  area: string;
  category: ComplaintCategory | string;
  ai_prediction: AiPrediction;
  department_id: string;
  department_name: string;
  officer_id: string | null;
  officer_name?: string | null;
  status: ComplaintStatus;
  priority: PriorityLevel;
  attachment_url?: string;
  attachment_name?: string;
  contact_info: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  history: ComplaintHistory[];
}

export interface OfficialLink {
  title: string;
  category: 'Citizen Services' | 'Grievance Portal' | 'Voter Services' | 'Police Services' | 'District Administration';
  description: string;
  url: string;
  isExternalGov: boolean;
  portalCode: string;
}
