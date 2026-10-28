export const JAVA_CONTROLLER_CODE = `package com.smartgrievance.controller;

import com.smartgrievance.entity.Complaint;
import com.smartgrievance.dto.ComplaintRequest;
import com.smartgrievance.dto.AiClassificationResponse;
import com.smartgrievance.service.ComplaintService;
import com.smartgrievance.service.AiClassificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private AiClassificationService aiClassificationService;

    /**
     * Module 3 & 4: Receive Citizen Complaint, Send to AI, Save to DB
     */
    @PostMapping
    public ResponseEntity<Complaint> registerComplaint(@RequestBody ComplaintRequest request) {
        // Step 1: Validate citizen complaint payload
        complaintService.validate(request);

        // Step 2: Send complaint description to AI Model
        AiClassificationResponse aiResult = aiClassificationService.classify(request.getDescription());

        // Step 3: Match department and auto-assign
        Complaint complaint = complaintService.createWithAiRouting(request, aiResult);

        return ResponseEntity.ok(complaint);
    }

    /**
     * Module 5: Standalone AI category suggestion endpoint
     */
    @PostMapping("/ai-classify")
    public ResponseEntity<AiClassificationResponse> predictCategory(@RequestBody String description) {
        AiClassificationResponse aiResult = aiClassificationService.classify(description);
        return ResponseEntity.ok(aiResult);
    }

    /**
     * Module 6: Officer / Admin re-classification & reassignment
     */
    @PatchMapping("/{id}/reassign")
    public ResponseEntity<Complaint> reassignCategory(
            @PathVariable String id,
            @RequestParam String newCategory,
            @RequestParam String departmentId,
            @RequestParam String officerRemarks) {
        Complaint updated = complaintService.reassignDepartment(id, newCategory, departmentId, officerRemarks);
        return ResponseEntity.ok(updated);
    }

    /**
     * Module 7 & 8: Update status & append to Complaint History Audit Trail
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam String officerRemarks,
            @RequestParam String updatedBy) {
        Complaint updated = complaintService.transitionStatus(id, status, officerRemarks, updatedBy);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Complaint>> getCitizenComplaints(@PathVariable String citizenId) {
        return ResponseEntity.ok(complaintService.findByCitizenId(citizenId));
    }
}
`;

export const JAVA_AI_SERVICE_CODE = `package com.smartgrievance.service;

import com.smartgrievance.dto.AiClassificationResponse;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiClassificationService {

    @Value("\${gemini.api.key}")
    private String geminiApiKey;

    public AiClassificationResponse classify(String complaintDescription) {
        // Invokes Gemini 3.8 Flash model with structured JSON Schema
        String prompt = "Analyze citizen complaint text and output category and department: " + complaintDescription;
        
        // Output format:
        // {
        //   "category": "Street Lights",
        //   "recommendedDepartment": "Electricity Board / TANGEDCO",
        //   "confidence": 98,
        //   "urgency": "High"
        // }
        return executeGeminiClassification(prompt);
    }
}
`;

export const SQL_SCHEMA_CODE = `-- ==========================================================
-- AI-Based Smart Complaint Management System Database Schema
-- Compatible with MySQL 8+ / PostgreSQL 15+
-- ==========================================================

-- 1. Users Table (Module 1)
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    citizen_id VARCHAR(30) UNIQUE NOT NULL,     -- e.g. 'TN-CIT-000102'
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT,
    identity_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'CITIZEN',          -- 'CITIZEN', 'OFFICER', 'ADMIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table (Module 6)
CREATE TABLE departments (
    department_id VARCHAR(50) PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    email VARCHAR(150)
);

-- 3. Officers Table (Module 6 & 7)
CREATE TABLE officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(department_id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'FIELD_OFFICER',
    district VARCHAR(100),
    badge_number VARCHAR(50)
);

-- 4. Complaints Table (Module 3, 4, 5, 6, 7)
CREATE TABLE complaints (
    complaint_id VARCHAR(50) PRIMARY KEY,       -- e.g. 'CMP-2026-000458'
    citizen_id VARCHAR(30) REFERENCES users(citizen_id),
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,             -- AI Category (e.g. Roads, Street Lights)
    ai_prediction JSON,                         -- Full AI output: confidence, reasoning, urgency
    department_id VARCHAR(50) REFERENCES departments(department_id),
    officer_id VARCHAR(50) REFERENCES officers(officer_id),
    status VARCHAR(30) DEFAULT 'PENDING',       -- PENDING, IN_PROGRESS, RESOLVED, REJECTED
    priority VARCHAR(20) DEFAULT 'Medium',
    district VARCHAR(100) NOT NULL,
    taluk VARCHAR(100),
    area VARCHAR(150),
    attachment_url VARCHAR(500),
    contact_info VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- 5. Complaint History / Audit Trail (Module 8)
CREATE TABLE complaint_history (
    history_id VARCHAR(50) PRIMARY KEY,
    complaint_id VARCHAR(50) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    updated_by VARCHAR(150) NOT NULL,
    remarks TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Identity Proof Table (Module 2)
CREATE TABLE identity_verification (
    verification_id VARCHAR(50) PRIMARY KEY,
    citizen_id VARCHAR(30) REFERENCES users(citizen_id),
    document_type VARCHAR(50) NOT NULL,         -- 'Aadhaar Card', 'Voter ID', 'Driving License'
    document_reference VARCHAR(100) NOT NULL,   -- e.g. masked reference 'XXXX-XXXX-8921'
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput citizen status tracking
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_dept ON complaints(department_id);
CREATE INDEX idx_history_complaint ON complaint_history(complaint_id);
`;
