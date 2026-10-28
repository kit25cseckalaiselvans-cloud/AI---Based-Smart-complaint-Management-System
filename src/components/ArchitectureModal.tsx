import React, { useState } from 'react';
import { Layers, Copy, Check, Code, Database, Cpu, Globe, ArrowRight } from 'lucide-react';
import {
  JAVA_CONTROLLER_CODE,
  JAVA_AI_SERVICE_CODE,
  SQL_SCHEMA_CODE,
} from '../data/springBootBlueprint';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DIAGRAM' | 'CONTROLLER' | 'AI_SERVICE' | 'SQL'>('DIAGRAM');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Java + AI + Database + Web Portal Architecture
              </h3>
              <p className="text-xs text-slate-400">
                System specification, Spring Boot REST endpoints, and relational database schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 px-5 py-3 bg-slate-900 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('DIAGRAM')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center ${
              activeTab === 'DIAGRAM'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('CONTROLLER')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center ${
              activeTab === 'CONTROLLER'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Code className="w-3.5 h-3.5 mr-1.5" />
            ComplaintController.java
          </button>
          <button
            onClick={() => setActiveTab('AI_SERVICE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center ${
              activeTab === 'AI_SERVICE'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 mr-1.5" />
            AiClassificationService.java
          </button>
          <button
            onClick={() => setActiveTab('SQL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center ${
              activeTab === 'SQL'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Database className="w-3.5 h-3.5 mr-1.5" />
            schema.sql (PostgreSQL/MySQL)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs font-mono space-y-4">
          {activeTab === 'DIAGRAM' && (
            <div className="space-y-4 font-sans">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-3">
                  End-to-End Execution Flow (Module 9)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="font-bold text-white text-xs">1. Citizen</div>
                    <div className="text-[10px] text-slate-400 mt-1">Web Portal Input</div>
                  </div>
                  <div className="flex items-center justify-center text-slate-600">
                    <ArrowRight className="w-4 h-4 hidden md:block" />
                  </div>
                  <div className="p-3 bg-slate-900 border border-blue-800/50 rounded-lg">
                    <div className="font-bold text-blue-400 text-xs">2. Java Backend</div>
                    <div className="text-[10px] text-slate-400 mt-1">Spring Boot / REST API</div>
                  </div>
                  <div className="flex items-center justify-center text-slate-600">
                    <ArrowRight className="w-4 h-4 hidden md:block" />
                  </div>
                  <div className="p-3 bg-slate-900 border border-amber-800/50 rounded-lg">
                    <div className="font-bold text-amber-400 text-xs">3. AI Model</div>
                    <div className="text-[10px] text-slate-400 mt-1">Category & Dept Routing</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center mt-3">
                  <div className="p-3 bg-slate-900 border border-emerald-800/50 rounded-lg md:col-start-3">
                    <div className="font-bold text-emerald-400 text-xs">4. Database</div>
                    <div className="text-[10px] text-slate-400 mt-1">Users, Complaints & Audit History</div>
                  </div>
                  <div className="flex items-center justify-center text-slate-600">
                    <ArrowRight className="w-4 h-4 hidden md:block" />
                  </div>
                  <div className="p-3 bg-slate-900 border border-purple-800/50 rounded-lg">
                    <div className="font-bold text-purple-400 text-xs">5. Officer Dashboard</div>
                    <div className="text-[10px] text-slate-400 mt-1">Investigation & Resolution</div>
                  </div>
                </div>
              </div>

              {/* Technology Matrix */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Layered Technology Architecture
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Frontend Web Portal</div>
                    <div className="font-bold text-white mt-0.5">React 19, Tailwind CSS</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Backend Server</div>
                    <div className="font-bold text-amber-400 mt-0.5">Java / Spring Boot REST</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">AI Model</div>
                    <div className="font-bold text-blue-400 mt-0.5">Gemini 3.8 Flash + Rules</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Relational Database</div>
                    <div className="font-bold text-emerald-400 mt-0.5">PostgreSQL / MySQL / JPA</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Identity & Security</div>
                    <div className="font-bold text-purple-400 mt-0.5">Unique ID + Audit Ledger</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Port / Hosting</div>
                    <div className="font-bold text-slate-200 mt-0.5">Port 3000 Ingress</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONTROLLER' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JAVA_CONTROLLER_CODE)}
                className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy Java'}
              </button>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {JAVA_CONTROLLER_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'AI_SERVICE' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JAVA_AI_SERVICE_CODE)}
                className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy Java'}
              </button>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {JAVA_AI_SERVICE_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'SQL' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(SQL_SCHEMA_CODE)}
                className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy DDL'}
              </button>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {SQL_SCHEMA_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Complies with Section 4 database tables and Section 10 tech stack.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
