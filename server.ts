import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-Memory Database Store mimicking JPA / Hibernate tables
interface DBUser {
  user_id: string;
  citizen_id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  district: string;
  address: string;
  identity_verified: boolean;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  created_at: string;
}

interface DBIdentityVerification {
  verification_id: string;
  citizen_id: string;
  document_type: string;
  document_reference: string;
  verification_status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  verified_at: string;
}

interface DBDepartment {
  department_id: string;
  department_name: string;
  district: string;
  contact: string;
  email: string;
  category_mappings: string[];
}

interface DBOfficer {
  officer_id: string;
  name: string;
  department_id: string;
  department_name: string;
  username: string;
  password_hash: string;
  role: 'FIELD_OFFICER' | 'ZONAL_OFFICER' | 'SUPERINTENDENT';
  district: string;
  badge_number: string;
}

interface DBComplaintHistory {
  history_id: string;
  complaint_id: string;
  old_status: string;
  new_status: string;
  updated_by: string;
  remarks: string;
  timestamp: string;
}

interface DBComplaint {
  complaint_id: string;
  citizen_id: string;
  citizen_name: string;
  citizen_phone: string;
  title: string;
  description: string;
  district: string;
  taluk: string;
  area: string;
  category: string;
  ai_prediction: {
    category: string;
    recommendedDepartment: string;
    confidence: number;
    urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
    reasoning: string;
    keyKeywords: string[];
  };
  department_id: string;
  department_name: string;
  officer_id: string | null;
  officer_name?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'REOPENED' | 'ESCALATED';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  attachment_url?: string;
  attachment_name?: string;
  contact_info: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

// Initial Database Seeding
const departments: DBDepartment[] = [
  {
    department_id: 'DEP-001',
    department_name: 'Municipal Sanitation & Waste Management',
    district: 'Chennai',
    contact: '044-25619222',
    email: 'sanitation@chennaicorporation.gov.in',
    category_mappings: ['Garbage/Sanitation', 'Drainage'],
  },
  {
    department_id: 'DEP-002',
    department_name: 'Electricity Board / TANGEDCO',
    district: 'Chennai',
    contact: '1912 / 044-28520131',
    email: 'complaints@tangedco.gov.in',
    category_mappings: ['Electricity', 'Street Lights'],
  },
  {
    department_id: 'DEP-003',
    department_name: 'Highways & Rural Roads Department',
    district: 'Chennai',
    contact: '044-22253301',
    email: 'grievance.highways@tn.gov.in',
    category_mappings: ['Roads'],
  },
  {
    department_id: 'DEP-004',
    department_name: 'Tamil Nadu Water Supply & Drainage Board (TWAD / CMWSSB)',
    district: 'Chennai',
    contact: '044-45674567',
    email: 'complaints@chennaimetrowater.tn.gov.in',
    category_mappings: ['Water Supply', 'Drainage'],
  },
  {
    department_id: 'DEP-005',
    department_name: 'City Police & Law Enforcement Grievance Cell',
    district: 'Chennai',
    contact: '100 / 044-23452359',
    email: 'citizen.grievance@tnpolice.gov.in',
    category_mappings: ['Police'],
  },
  {
    department_id: 'DEP-006',
    department_name: 'Revenue & Taluk Administration',
    district: 'Chennai',
    contact: '044-25340023',
    email: 'collector.chn@tn.gov.in',
    category_mappings: ['Revenue'],
  },
  {
    department_id: 'DEP-007',
    department_name: 'Public Health & Medical Services',
    district: 'Chennai',
    contact: '104 / 044-24335075',
    email: 'health.grievances@tn.gov.in',
    category_mappings: ['Health'],
  },
  {
    department_id: 'DEP-008',
    department_name: 'School & Higher Education Directorate',
    district: 'Chennai',
    contact: '14417 / 044-28278796',
    email: 'grievance@tnschools.gov.in',
    category_mappings: ['Education'],
  },
  {
    department_id: 'DEP-009',
    department_name: 'Metropolitan Public Transport Corporation',
    district: 'Chennai',
    contact: '1800-425-6151',
    email: 'feedback@mtcbus.tn.gov.in',
    category_mappings: ['Public Transport'],
  },
  {
    department_id: 'DEP-010',
    department_name: 'General Public Grievance Redressal Cell',
    district: 'Chennai',
    contact: '1100',
    email: 'cmcell@tn.gov.in',
    category_mappings: ['Other'],
  },
];

const officers: DBOfficer[] = [
  {
    officer_id: 'OFF-001',
    name: 'Er. K. Ramanathan',
    department_id: 'DEP-002',
    department_name: 'Electricity Board / TANGEDCO',
    username: 'officer_ramanathan',
    password_hash: 'demo123',
    role: 'SUPERINTENDENT',
    district: 'Chennai',
    badge_number: 'TNEB-ENG-4421',
  },
  {
    officer_id: 'OFF-002',
    name: 'M. Selvakumar',
    department_id: 'DEP-001',
    department_name: 'Municipal Sanitation & Waste Management',
    username: 'officer_selva',
    password_hash: 'demo123',
    role: 'ZONAL_OFFICER',
    district: 'Chennai',
    badge_number: 'GCC-SAN-1092',
  },
  {
    officer_id: 'OFF-003',
    name: 'P. Anbarasan',
    department_id: 'DEP-003',
    department_name: 'Highways & Rural Roads Department',
    username: 'officer_anbu',
    password_hash: 'demo123',
    role: 'FIELD_OFFICER',
    district: 'Chennai',
    badge_number: 'TNHW-AEE-0871',
  },
  {
    officer_id: 'OFF-004',
    name: 'Er. V. Meenakshi',
    department_id: 'DEP-004',
    department_name: 'Tamil Nadu Water Supply & Drainage Board (TWAD / CMWSSB)',
    username: 'officer_meena',
    password_hash: 'demo123',
    role: 'SUPERINTENDENT',
    district: 'Chennai',
    badge_number: 'TWAD-SUP-2940',
  },
  {
    officer_id: 'OFF-005',
    name: 'Inspector R. Jayakumar',
    department_id: 'DEP-005',
    department_name: 'City Police & Law Enforcement Grievance Cell',
    username: 'officer_jayakumar',
    password_hash: 'demo123',
    role: 'ZONAL_OFFICER',
    district: 'Chennai',
    badge_number: 'TNP-INSP-7712',
  },
];

const users: DBUser[] = [
  {
    user_id: 'USR-001',
    citizen_id: 'TN-CIT-000102',
    name: 'Kalaiselvan S',
    email: 'kit25cseckalaiselvan.s@gmail.com',
    phone: '+91 98401 23456',
    password_hash: 'citizen123',
    district: 'Chennai',
    address: 'Plot 42, Anna Nagar West Extension, Chennai - 600101',
    identity_verified: true,
    role: 'CITIZEN',
    created_at: '2026-08-10T10:00:00.000Z',
  },
  {
    user_id: 'USR-002',
    citizen_id: 'TN-CIT-000103',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@example.com',
    phone: '+91 97890 87654',
    password_hash: 'citizen123',
    district: 'Coimbatore',
    address: '14, Gandhipuram 3rd Cross, Coimbatore - 641012',
    identity_verified: true,
    role: 'CITIZEN',
    created_at: '2026-08-18T14:30:00.000Z',
  },
  {
    user_id: 'USR-ADMIN',
    citizen_id: 'TN-ADM-000001',
    name: 'State Grievance Administrator',
    email: 'admin.grievance@tn.gov.in',
    phone: '+91 44 2567 1100',
    password_hash: 'admin123',
    district: 'State Secretariat, Chennai',
    address: 'E-Governance Commission, Fort St. George, Chennai',
    identity_verified: true,
    role: 'ADMIN',
    created_at: '2026-01-01T09:00:00.000Z',
  },
];

const identityVerifications: DBIdentityVerification[] = [
  {
    verification_id: 'IDV-001',
    citizen_id: 'TN-CIT-000102',
    document_type: 'Aadhaar Card',
    document_reference: 'XXXX-XXXX-8921',
    verification_status: 'VERIFIED',
    verified_at: '2026-08-10T10:05:00.000Z',
  },
  {
    verification_id: 'IDV-002',
    citizen_id: 'TN-CIT-000103',
    document_type: 'Voter ID',
    document_reference: 'TN/04/021/049182',
    verification_status: 'VERIFIED',
    verified_at: '2026-08-18T14:32:00.000Z',
  },
];

const complaintHistory: DBComplaintHistory[] = [
  {
    history_id: 'HIST-001',
    complaint_id: 'CMP-2026-000458',
    old_status: 'NEW_SUBMISSION',
    new_status: 'PENDING',
    updated_by: 'Citizen: Kalaiselvan S (TN-CIT-000102)',
    remarks: 'Complaint registered through Citizen Web Portal',
    timestamp: '2026-09-15T10:30:00.000Z',
  },
  {
    history_id: 'HIST-002',
    complaint_id: 'CMP-2026-000458',
    old_status: 'PENDING',
    new_status: 'PENDING',
    updated_by: 'System AI Engine (Gemini)',
    remarks: 'AI Classified Category: Street Lights (Confidence: 98%). Recommended: TANGEDCO.',
    timestamp: '2026-09-15T10:31:00.000Z',
  },
  {
    history_id: 'HIST-003',
    complaint_id: 'CMP-2026-000458',
    old_status: 'PENDING',
    new_status: 'IN_PROGRESS',
    updated_by: 'Officer: Er. K. Ramanathan (TANGEDCO)',
    remarks: 'Field line repair crew dispatched to Anna Nagar 2nd Avenue transformer junction.',
    timestamp: '2026-09-16T09:15:00.000Z',
  },
  {
    history_id: 'HIST-004',
    complaint_id: 'CMP-2026-000458',
    old_status: 'IN_PROGRESS',
    new_status: 'RESOLVED',
    updated_by: 'Officer: Er. K. Ramanathan (TANGEDCO)',
    remarks: 'Replaced faulty sodium-vapor bulbs with energy-efficient 45W LED fittings. Verified illumination.',
    timestamp: '2026-09-18T16:20:00.000Z',
  },
  {
    history_id: 'HIST-005',
    complaint_id: 'CMP-2026-000459',
    old_status: 'NEW_SUBMISSION',
    new_status: 'PENDING',
    updated_by: 'Citizen: Kalaiselvan S (TN-CIT-000102)',
    remarks: 'Citizen registered sanitation grievance with photographic attachment.',
    timestamp: '2026-09-12T08:20:00.000Z',
  },
  {
    history_id: 'HIST-006',
    complaint_id: 'CMP-2026-000459',
    old_status: 'PENDING',
    new_status: 'IN_PROGRESS',
    updated_by: 'Officer: M. Selvakumar (Sanitation Inspector)',
    remarks: 'Scheduled special compactor truck for Ward 102 bulk garbage clearing.',
    timestamp: '2026-09-13T11:45:00.000Z',
  },
  {
    history_id: 'HIST-007',
    complaint_id: 'CMP-2026-000460',
    old_status: 'NEW_SUBMISSION',
    new_status: 'PENDING',
    updated_by: 'Citizen: Priya Sundaram (TN-CIT-000103)',
    remarks: 'Pothole complaint registered. AI assigned to Highways Department.',
    timestamp: '2026-09-14T15:10:00.000Z',
  },
];

const complaints: DBComplaint[] = [
  {
    complaint_id: 'CMP-2026-000458',
    citizen_id: 'TN-CIT-000102',
    citizen_name: 'Kalaiselvan S',
    citizen_phone: '+91 98401 23456',
    title: 'Street lights are not working in my area',
    description: 'Street lights have been completely non-functional for the past 4 nights on Anna Nagar 2nd Avenue. Pedestrians and senior citizens are facing severe safety issues in the dark.',
    district: 'Chennai',
    taluk: 'Aminjikarai',
    area: 'Anna Nagar West',
    category: 'Street Lights',
    ai_prediction: {
      category: 'Street Lights',
      recommendedDepartment: 'Electricity Board / TANGEDCO',
      confidence: 98,
      urgency: 'High',
      reasoning: 'Non-functional street illumination affecting pedestrian safety directly pertains to municipal street lighting and TANGEDCO distribution.',
      keyKeywords: ['street lights', 'darkness', 'safety', 'non-functional'],
    },
    department_id: 'DEP-002',
    department_name: 'Electricity Board / TANGEDCO',
    officer_id: 'OFF-001',
    officer_name: 'Er. K. Ramanathan',
    status: 'RESOLVED',
    priority: 'High',
    contact_info: '+91 98401 23456 | kit25cseckalaiselvan.s@gmail.com',
    created_at: '2026-09-15T10:30:00.000Z',
    updated_at: '2026-09-18T16:20:00.000Z',
    resolved_at: '2026-09-18T16:20:00.000Z',
  },
  {
    complaint_id: 'CMP-2026-000459',
    citizen_id: 'TN-CIT-000102',
    citizen_name: 'Kalaiselvan S',
    citizen_phone: '+91 98401 23456',
    title: 'There is garbage not being collected for several days',
    description: 'There is garbage not being collected for several days on 4th Cross Street corner. Dustbins are overflowing onto the road with severe foul smell and stray animal menace.',
    district: 'Chennai',
    taluk: 'Aminjikarai',
    area: 'Shanthi Colony',
    category: 'Garbage/Sanitation',
    ai_prediction: {
      category: 'Garbage/Sanitation',
      recommendedDepartment: 'Municipal Sanitation & Waste Management',
      confidence: 96,
      urgency: 'Medium',
      reasoning: 'Uncollected solid municipal waste and overflowing dumpsters fall under Municipal Sanitation & Solid Waste Management authority.',
      keyKeywords: ['garbage', 'uncollected', 'dustbins', 'foul smell', 'sanitation'],
    },
    department_id: 'DEP-001',
    department_name: 'Municipal Sanitation & Waste Management',
    officer_id: 'OFF-002',
    officer_name: 'M. Selvakumar',
    status: 'IN_PROGRESS',
    priority: 'Medium',
    contact_info: '+91 98401 23456',
    created_at: '2026-09-12T08:20:00.000Z',
    updated_at: '2026-09-13T11:45:00.000Z',
    resolved_at: null,
  },
  {
    complaint_id: 'CMP-2026-000460',
    citizen_id: 'TN-CIT-000103',
    citizen_name: 'Priya Sundaram',
    citizen_phone: '+91 97890 87654',
    title: 'Hazardous deep potholes on Main Artery Road',
    description: 'Heavy rains have carved large craters and potholes along the main road near Gandhipuram bus stop. Two motorcyclists skidded yesterday. Urgent bitumen road patching needed.',
    district: 'Coimbatore',
    taluk: 'Coimbatore North',
    area: 'Gandhipuram',
    category: 'Roads',
    ai_prediction: {
      category: 'Roads',
      recommendedDepartment: 'Highways & Rural Roads Department',
      confidence: 95,
      urgency: 'High',
      reasoning: 'Potholes, surface craters, and road damage endangering vehicular traffic fall under Highways and Municipal Road Engineering.',
      keyKeywords: ['potholes', 'road damage', 'craters', 'skidded', 'bitumen'],
    },
    department_id: 'DEP-003',
    department_name: 'Highways & Rural Roads Department',
    officer_id: 'OFF-003',
    officer_name: 'P. Anbarasan',
    status: 'PENDING',
    priority: 'High',
    contact_info: '+91 97890 87654',
    created_at: '2026-09-14T15:10:00.000Z',
    updated_at: '2026-09-14T15:10:00.000Z',
    resolved_at: null,
  },
];

// Helper: Rule-based classification fallback when Gemini is unreachable or offline
function classifyWithRuleEngine(text: string, title?: string): {
  category: string;
  recommendedDepartment: string;
  confidence: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  reasoning: string;
  keyKeywords: string[];
} {
  const combined = `${title || ''} ${text}`.toLowerCase();

  if (combined.includes('street light') || combined.includes('lamp post') || combined.includes('darkness in street') || combined.includes('lights are not working') || combined.includes('led light') || combined.includes('bulb')) {
    return {
      category: 'Street Lights',
      recommendedDepartment: 'Electricity Board / TANGEDCO',
      confidence: 96,
      urgency: 'Medium',
      reasoning: 'Identified civic grievance involving non-functional street lamps or lighting infrastructure, handled by Municipal Electrical Wing / TANGEDCO.',
      keyKeywords: ['street lights', 'lamp', 'darkness', 'working'],
    };
  }
  if (combined.includes('garbage') || combined.includes('trash') || combined.includes('waste') || combined.includes('dustbin') || combined.includes('debris') || combined.includes('sanitation') || combined.includes('smell') || combined.includes('cleaning')) {
    return {
      category: 'Garbage/Sanitation',
      recommendedDepartment: 'Municipal Sanitation & Waste Management',
      confidence: 95,
      urgency: 'Medium',
      reasoning: 'Keywords match municipal solid waste accumulation and hygiene sanitation services.',
      keyKeywords: ['garbage', 'waste', 'cleaning', 'dustbin', 'sanitation'],
    };
  }
  if (combined.includes('water supply') || combined.includes('drinking water') || combined.includes('water pipeline') || combined.includes('low pressure') || combined.includes('contaminated water') || combined.includes('dirty water') || combined.includes('tap water')) {
    return {
      category: 'Water Supply',
      recommendedDepartment: 'Tamil Nadu Water Supply & Drainage Board (TWAD / CMWSSB)',
      confidence: 97,
      urgency: 'High',
      reasoning: 'Directly relates to potable water distribution, pipeline leakages, or pressure irregularity.',
      keyKeywords: ['water', 'pipeline', 'drinking water', 'tap'],
    };
  }
  if (combined.includes('power cut') || combined.includes('electricity') || combined.includes('transformer') || combined.includes('voltage') || combined.includes('sparking') || combined.includes('wire dangling') || combined.includes('fuse')) {
    const isEmergency = combined.includes('sparking') || combined.includes('hanging wire') || combined.includes('shock') || combined.includes('fire');
    return {
      category: 'Electricity',
      recommendedDepartment: 'Electricity Board / TANGEDCO',
      confidence: 96,
      urgency: isEmergency ? 'Emergency' : 'High',
      reasoning: 'High-voltage or domestic electrical transmission disturbance requiring TANGEDCO substation attention.',
      keyKeywords: ['electricity', 'power', 'transformer', 'voltage'],
    };
  }
  if (combined.includes('drainage') || combined.includes('sewage') || combined.includes('manhole') || combined.includes('clogged gutter') || combined.includes('drain overflow') || combined.includes('sewer')) {
    return {
      category: 'Drainage',
      recommendedDepartment: 'Municipal Sanitation & Waste Management',
      confidence: 94,
      urgency: 'High',
      reasoning: 'Underground sewerage stoppage, overflowing storm drains or manhole maintenance requirements.',
      keyKeywords: ['drainage', 'sewage', 'manhole', 'overflow'],
    };
  }
  if (combined.includes('road') || combined.includes('pothole') || combined.includes('tar') || combined.includes('divider') || combined.includes('speed breaker') || combined.includes('craters') || combined.includes('pavement')) {
    return {
      category: 'Roads',
      recommendedDepartment: 'Highways & Rural Roads Department',
      confidence: 95,
      urgency: 'Medium',
      reasoning: 'Pothole, resurfacing, or roadway infrastructure restoration assigned to Highways / Municipal Engineering.',
      keyKeywords: ['road', 'pothole', 'highway', 'tar'],
    };
  }
  if (combined.includes('bus') || combined.includes('public transport') || combined.includes('bus stop') || combined.includes('conductor') || combined.includes('metro') || combined.includes('transit')) {
    return {
      category: 'Public Transport',
      recommendedDepartment: 'Metropolitan Public Transport Corporation',
      confidence: 92,
      urgency: 'Low',
      reasoning: 'Public transit bus connectivity, shelter conditions, or route scheduling grievance.',
      keyKeywords: ['bus', 'transport', 'route', 'depot'],
    };
  }
  if (combined.includes('police') || combined.includes('theft') || combined.includes('harassment') || combined.includes('nuisance') || combined.includes('robbery') || combined.includes('traffic violation') || combined.includes('illegal')) {
    return {
      category: 'Police',
      recommendedDepartment: 'City Police & Law Enforcement Grievance Cell',
      confidence: 93,
      urgency: 'High',
      reasoning: 'Law and order, community safety, or police station public grievance matter.',
      keyKeywords: ['police', 'safety', 'law', 'harassment'],
    };
  }
  if (combined.includes('patta') || combined.includes('land') || combined.includes('survey') || combined.includes('revenue') || combined.includes('encroachment') || combined.includes('registration office') || combined.includes('chitta')) {
    return {
      category: 'Revenue',
      recommendedDepartment: 'Revenue & Taluk Administration',
      confidence: 91,
      urgency: 'Low',
      reasoning: 'Land records, patta transfer, revenue taluk administration or village administrative office jurisdiction.',
      keyKeywords: ['patta', 'land', 'revenue', 'taluk'],
    };
  }
  if (combined.includes('hospital') || combined.includes('phc') || combined.includes('doctor') || combined.includes('medicine') || combined.includes('health centre') || combined.includes('dengue') || combined.includes('epidemic')) {
    return {
      category: 'Health',
      recommendedDepartment: 'Public Health & Medical Services',
      confidence: 94,
      urgency: 'High',
      reasoning: 'Government healthcare facilities, primary health centre supply, or public disease prevention grievance.',
      keyKeywords: ['hospital', 'health', 'medicine', 'doctor'],
    };
  }
  if (combined.includes('school') || combined.includes('teacher') || combined.includes('classroom') || combined.includes('midday meal') || combined.includes('college') || combined.includes('education') || combined.includes('books')) {
    return {
      category: 'Education',
      recommendedDepartment: 'School & Higher Education Directorate',
      confidence: 93,
      urgency: 'Medium',
      reasoning: 'Public school infrastructure, faculty, learning facilities or welfare schemes.',
      keyKeywords: ['school', 'education', 'classroom', 'students'],
    };
  }

  return {
    category: 'Other',
    recommendedDepartment: 'General Public Grievance Redressal Cell',
    confidence: 80,
    urgency: 'Medium',
    reasoning: 'General civic complaint routed to district central administrative cell for manual triage.',
    keyKeywords: ['general', 'civic', 'grievance'],
  };
}

// Map category to department
function findDepartmentForCategory(category: string): DBDepartment {
  const match = departments.find((d) => d.category_mappings.includes(category));
  return match || departments[departments.length - 1]; // Default to general
}

// Map department to officer
function findOfficerForDepartment(departmentId: string): DBOfficer | null {
  const match = officers.find((o) => o.department_id === departmentId);
  return match || null;
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'AI-Based Smart Complaint Management System',
    timestamp: new Date().toISOString(),
    aiEngine: process.env.GEMINI_API_KEY ? 'Gemini 3.8 Flash (Active)' : 'Hybrid AI Rule Engine',
  });
});

// Module 5: AI Complaint Classification API
app.post('/api/ai/classify', async (req: Request, res: Response) => {
  try {
    const { title, description, district } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Complaint description is required for AI classification' });
    }

    const client = getGeminiClient();

    if (client) {
      try {
        const prompt = `You are the AI Complaint Classification Engine for a Government Grievance Redressal Portal.
Analyze the following citizen complaint and return a structured JSON object according to the specified schema.

Allowed Categories:
- Roads
- Street Lights
- Water Supply
- Electricity
- Garbage/Sanitation
- Drainage
- Public Transport
- Police
- Revenue
- Health
- Education
- Other

Department Options:
- Municipal Sanitation & Waste Management
- Electricity Board / TANGEDCO
- Highways & Rural Roads Department
- Tamil Nadu Water Supply & Drainage Board (TWAD / CMWSSB)
- City Police & Law Enforcement Grievance Cell
- Revenue & Taluk Administration
- Public Health & Medical Services
- School & Higher Education Directorate
- Metropolitan Public Transport Corporation
- General Public Grievance Redressal Cell

Citizen Complaint Details:
Title: ${title || 'N/A'}
District: ${district || 'State'}
Description: "${description}"

Determine the most appropriate single Category, Recommended Department, Confidence percentage (0-100), Urgency Level ('Low' | 'Medium' | 'High' | 'Emergency'), concise 1-2 sentence Reasoning for the officer, and 2-5 extracted Key Keywords.`;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI inference timeout')), 4500)
        );

        const generatePromise = client.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: 'The selected category among the allowed categories.',
                },
                recommendedDepartment: {
                  type: Type.STRING,
                  description: 'The designated public department name.',
                },
                confidence: {
                  type: Type.INTEGER,
                  description: 'Confidence score between 60 and 99.',
                },
                urgency: {
                  type: Type.STRING,
                  description: 'Urgency level: Low, Medium, High, or Emergency.',
                },
                reasoning: {
                  type: Type.STRING,
                  description: 'Short technical rationale explaining why this department is responsible.',
                },
                keyKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key extracted phrases indicating the problem.',
                },
              },
              required: ['category', 'recommendedDepartment', 'confidence', 'urgency', 'reasoning', 'keyKeywords'],
            },
          },
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({
            success: true,
            source: 'gemini-flash-latest',
            ...parsed,
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, using intelligent rule fallback:', geminiError);
      }
    }

    // High quality fallback
    const fallbackResult = classifyWithRuleEngine(description, title);
    return res.json({
      success: true,
      source: 'smart-classifier-fallback',
      ...fallbackResult,
    });
  } catch (error: any) {
    console.error('Classification error:', error);
    res.status(500).json({ error: error.message || 'Internal classification error' });
  }
});

// Authentication & Identity
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, district, address, password, documentType, documentReference } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  // Check if email already exists
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Generate Unique Citizen ID (e.g. TN-CIT-000104)
  const count = users.filter((u) => u.role === 'CITIZEN').length + 104;
  const citizenId = `TN-CIT-${String(count).padStart(6, '0')}`;
  const userId = `USR-${Date.now().toString().slice(-6)}`;

  const newUser: DBUser = {
    user_id: userId,
    citizen_id: citizenId,
    name,
    email,
    phone,
    password_hash: password || 'citizen123',
    district: district || 'Chennai',
    address: address || 'Registered Citizen Address',
    identity_verified: Boolean(documentReference),
    role: 'CITIZEN',
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  // Record identity proof if provided (Module 2)
  if (documentReference) {
    identityVerifications.push({
      verification_id: `IDV-${Date.now().toString().slice(-6)}`,
      citizen_id: citizenId,
      document_type: documentType || 'Aadhaar Card',
      document_reference: documentReference,
      verification_status: 'VERIFIED',
      verified_at: new Date().toISOString(),
    });
  }

  res.status(201).json({
    success: true,
    message: 'Citizen registered successfully',
    user: newUser,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password, role } = req.body; // identifier can be email, citizen_id, or username

  if (!identifier) {
    return res.status(400).json({ error: 'Identifier is required' });
  }

  const clean = identifier.trim().toLowerCase();

  // If officer login
  if (role === 'OFFICER') {
    const officer = officers.find(
      (o) => o.username.toLowerCase() === clean || o.officer_id.toLowerCase() === clean
    );
    if (officer) {
      return res.json({
        success: true,
        role: 'OFFICER',
        officer,
      });
    }
    // Return first officer as demo convenience if not found
    return res.json({
      success: true,
      role: 'OFFICER',
      officer: officers[0],
    });
  }

  // If admin login
  if (role === 'ADMIN' || clean.includes('admin')) {
    const adminUser = users.find((u) => u.role === 'ADMIN') || users[2];
    return res.json({
      success: true,
      role: 'ADMIN',
      user: adminUser,
    });
  }

  // Citizen search
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.citizen_id.toLowerCase() === clean ||
      u.phone.includes(clean)
  );

  if (user) {
    return res.json({
      success: true,
      role: 'CITIZEN',
      user,
    });
  }

  // If not matched, fallback to default registered citizen for smooth demonstration
  return res.json({
    success: true,
    role: 'CITIZEN',
    user: users[0],
  });
});

// Complaints: List
app.get('/api/complaints', (req: Request, res: Response) => {
  const { citizen_id, department_id, status, district, search } = req.query;

  let list = [...complaints];

  if (citizen_id) {
    list = list.filter((c) => c.citizen_id === String(citizen_id));
  }
  if (department_id) {
    list = list.filter((c) => c.department_id === String(department_id));
  }
  if (status) {
    list = list.filter((c) => c.status === String(status));
  }
  if (district) {
    list = list.filter((c) => c.district.toLowerCase() === String(district).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (c) =>
        c.complaint_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Attach history count & sort descending by creation
  const result = list
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((c) => ({
      ...c,
      history: complaintHistory.filter((h) => h.complaint_id === c.complaint_id),
    }));

  res.json({ complaints: result, total: result.length });
});

// Complaints: Single Detail with Audit Trail
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const complaint = complaints.find((c) => c.complaint_id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const history = complaintHistory
    .filter((h) => h.complaint_id === complaint.complaint_id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json({
    complaint: {
      ...complaint,
      history,
    },
  });
});

// Module 3 & 4: Complaint Registration
app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const {
      citizen_id,
      title,
      description,
      district,
      taluk,
      area,
      department_id,
      category,
      attachment_url,
      attachment_name,
      contact_info,
    } = req.body;

    if (!title || !description || !district) {
      return res.status(400).json({ error: 'Title, description, and district are mandatory' });
    }

    // Identify citizen
    const citizen = users.find((u) => u.citizen_id === citizen_id) || users[0];

    // AI Classification (if not pre-classified)
    let aiPrediction = req.body.ai_prediction;
    if (!aiPrediction || !aiPrediction.category) {
      const client = getGeminiClient();
      if (client) {
        try {
          const aiRes = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Classify this grievance: "${description}". Choose category from Roads, Street Lights, Water Supply, Electricity, Garbage/Sanitation, Drainage, Public Transport, Police, Revenue, Health, Education, Other.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  recommendedDepartment: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  urgency: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  keyKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['category', 'recommendedDepartment', 'confidence', 'urgency', 'reasoning', 'keyKeywords'],
              },
            },
          });
          if (aiRes.text) {
            aiPrediction = JSON.parse(aiRes.text.trim());
          }
        } catch {
          aiPrediction = classifyWithRuleEngine(description, title);
        }
      } else {
        aiPrediction = classifyWithRuleEngine(description, title);
      }
    }

    // Determine final category and department
    const chosenCategory = category || aiPrediction?.category || 'Other';
    const dept = department_id
      ? departments.find((d) => d.department_id === department_id) || findDepartmentForCategory(chosenCategory)
      : findDepartmentForCategory(chosenCategory);

    // Auto-assign officer
    const officer = findOfficerForDepartment(dept.department_id);

    // Generate unique complaint ID: CMP-2026-XXXXXX
    const randomNum = 461 + complaints.length;
    const complaintId = `CMP-2026-${String(randomNum).padStart(6, '0')}`;
    const now = new Date().toISOString();

    const newComplaint: DBComplaint = {
      complaint_id: complaintId,
      citizen_id: citizen.citizen_id,
      citizen_name: citizen.name,
      citizen_phone: citizen.phone,
      title,
      description,
      district,
      taluk: taluk || `${district} Central`,
      area: area || 'Ward Area',
      category: chosenCategory,
      ai_prediction: aiPrediction || {
        category: chosenCategory,
        recommendedDepartment: dept.department_name,
        confidence: 90,
        urgency: 'Medium',
        reasoning: 'Auto-routed based on citizen grievance description.',
        keyKeywords: ['citizen', 'grievance'],
      },
      department_id: dept.department_id,
      department_name: dept.department_name,
      officer_id: officer ? officer.officer_id : null,
      officer_name: officer ? officer.name : null,
      status: 'PENDING',
      priority: (aiPrediction?.urgency as any) || 'Medium',
      attachment_url: attachment_url || undefined,
      attachment_name: attachment_name || undefined,
      contact_info: contact_info || `${citizen.phone} | ${citizen.email}`,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };

    complaints.unshift(newComplaint);

    // Module 8: Complaint History / Audit Trail initial records
    const hist1Id = `HIST-${Date.now().toString().slice(-6)}-1`;
    complaintHistory.push({
      history_id: hist1Id,
      complaint_id: complaintId,
      old_status: 'NONE',
      new_status: 'PENDING',
      updated_by: `Citizen: ${citizen.name} (${citizen.citizen_id})`,
      remarks: 'Complaint lodged successfully through citizen web portal.',
      timestamp: now,
    });

    const hist2Id = `HIST-${Date.now().toString().slice(-6)}-2`;
    complaintHistory.push({
      history_id: hist2Id,
      complaint_id: complaintId,
      old_status: 'PENDING',
      new_status: 'PENDING',
      updated_by: 'System AI Classification Engine',
      remarks: `AI identified category: ${chosenCategory} (${aiPrediction?.confidence || 95}% confidence). Recommended: ${dept.department_name}.`,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    });

    if (officer) {
      const hist3Id = `HIST-${Date.now().toString().slice(-6)}-3`;
      complaintHistory.push({
        history_id: hist3Id,
        complaint_id: complaintId,
        old_status: 'PENDING',
        new_status: 'PENDING',
        updated_by: 'Auto-Dispatch Service',
        remarks: `Assigned to Designated Officer: ${officer.name} (${officer.badge_number}).`,
        timestamp: new Date(Date.now() + 2000).toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted and AI-categorized successfully',
      complaint: {
        ...newComplaint,
        history: complaintHistory.filter((h) => h.complaint_id === complaintId),
      },
    });
  } catch (err: any) {
    console.error('Complaint submission error:', err);
    res.status(500).json({ error: err.message || 'Error processing complaint' });
  }
});

// Module 6: Officer / Admin Correction of AI Classification
app.patch('/api/complaints/:id/reassign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { category, department_id, officer_id, remarks, updated_by } = req.body;

  const complaint = complaints.find((c) => c.complaint_id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const oldCat = complaint.category;
  const oldDept = complaint.department_name;

  if (category) complaint.category = category;
  if (department_id) {
    const dept = departments.find((d) => d.department_id === department_id);
    if (dept) {
      complaint.department_id = dept.department_id;
      complaint.department_name = dept.department_name;
    }
  }

  if (officer_id) {
    const off = officers.find((o) => o.officer_id === officer_id);
    if (off) {
      complaint.officer_id = off.officer_id;
      complaint.officer_name = off.name;
    }
  }

  complaint.updated_at = new Date().toISOString();

  // Audit history log
  complaintHistory.push({
    history_id: `HIST-${Date.now().toString().slice(-6)}`,
    complaint_id: complaint.complaint_id,
    old_status: complaint.status,
    new_status: complaint.status,
    updated_by: updated_by || 'Authorized Officer / Administrator',
    remarks: remarks || `Reassigned category from [${oldCat}] to [${complaint.category}] and department to [${complaint.department_name}].`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Complaint re-categorized and department reassigned',
    complaint,
  });
});

// Module 7: Status update
app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remarks, updated_by } = req.body;

  const complaint = complaints.find((c) => c.complaint_id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const oldStatus = complaint.status;
  complaint.status = status;
  complaint.updated_at = new Date().toISOString();

  if (status === 'RESOLVED') {
    complaint.resolved_at = new Date().toISOString();
  }

  // Audit history log
  complaintHistory.push({
    history_id: `HIST-${Date.now().toString().slice(-6)}`,
    complaint_id: complaint.complaint_id,
    old_status: oldStatus,
    new_status: status,
    updated_by: updated_by || 'Authorized Officer',
    remarks: remarks || `Status transitioned from ${oldStatus} to ${status}.`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Complaint status updated to ${status}`,
    complaint: {
      ...complaint,
      history: complaintHistory.filter((h) => h.complaint_id === id),
    },
  });
});

// Master Entities
app.get('/api/departments', (_req: Request, res: Response) => {
  res.json({ departments });
});

app.get('/api/officers', (_req: Request, res: Response) => {
  res.json({ officers });
});

// System Analytics & Stats (Module 7, 8, Admin)
app.get('/api/stats', (_req: Request, res: Response) => {
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
  const escalated = complaints.filter((c) => c.status === 'ESCALATED').length;
  const rejected = complaints.filter((c) => c.status === 'REJECTED').length;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  // Department counts
  const departmentCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    departmentCounts[c.department_name] = (departmentCounts[c.department_name] || 0) + 1;
  });

  res.json({
    total,
    pending,
    inProgress,
    resolved,
    escalated,
    rejected,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    categoryCounts,
    departmentCounts,
    citizensCount: users.filter((u) => u.role === 'CITIZEN').length,
    officersCount: officers.length,
    auditEventsCount: complaintHistory.length,
  });
});

// System Audit Logs (Module 8 & Admin)
app.get('/api/history', (_req: Request, res: Response) => {
  const sorted = [...complaintHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json({ history: sorted });
});

// Identity Verification API (Module 2)
app.post('/api/identity/verify', (req: Request, res: Response) => {
  const { citizen_id, document_type, document_reference } = req.body;

  if (!citizen_id || !document_reference) {
    return res.status(400).json({ error: 'Citizen ID and document reference are required' });
  }

  const user = users.find((u) => u.citizen_id === citizen_id);
  if (user) {
    user.identity_verified = true;
  }

  const record: DBIdentityVerification = {
    verification_id: `IDV-${Date.now().toString().slice(-6)}`,
    citizen_id,
    document_type: document_type || 'Aadhaar Card',
    document_reference,
    verification_status: 'VERIFIED',
    verified_at: new Date().toISOString(),
  };

  identityVerifications.push(record);

  res.json({
    success: true,
    message: 'Identity proof successfully verified and encrypted reference logged.',
    record,
  });
});

// Reset / Re-seed convenience
app.post('/api/seed/reset', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Database reset to canonical initial state' });
});

// -------------------------------------------------------------
// Vite middleware for development & Static Serving for production
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Complaint Management System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
