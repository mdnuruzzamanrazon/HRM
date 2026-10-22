import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Info,
  CheckCircle2,
  FileText,
  Key,
  MapPin,
  Building,
  ShieldCheck,
  Radio,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import metadata from '../../data/eventMetadata.json';

export default function EventInstructionsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('sop');
  const [language, setLanguage] = useState('bn'); // 'bn' | 'en'
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const instructions = metadata.instructions || {};

  const eventTypesList = [
    {
      category: 'Capacity Development',
      items: [
        { name: 'Training', desc: 'নির্দিষ্ট কারিকুলাম, সময়কাল এবং শেখার লক্ষ্যসহ প্রশিক্ষণ। উপস্থিতির তালিকা, মডিউল ও সেশনের Agenda রাখতে হবে (MoV)।' },
        { name: 'Orientation', desc: 'নতুন অংশগ্রহণকারীদের জন্য সংক্ষিপ্ত পরিচিতি সেশন (CEF এর থিম, outcome, প্রক্রিয়া, inclusion, human rights, governance ইত্যাদি)।' },
        { name: 'Induction', desc: 'নতুন স্টাফ বা পার্টনারদের সিস্টেম, Process ও different tools and Templates এর সাথে পরিচিত করার জন্য ফরমাল সেশন।' },
        { name: 'Learning Session', desc: 'অংশগ্রহণকারীদের মধ্যে জ্ঞান ও অভিজ্ঞতা শেয়ারের ইন্টারেক্টিভ সেশন। MoV: এজেন্ডা ও আলোচনার নোট সংরক্ষণ করতে হবে।' },
        { name: 'Exposure/Exchange Visit', desc: 'অন্য প্রকল্প এলাকা বা সংস্থায় গিয়ে শেখার ভিজিট। ইটিনেরারি, হোস্টিং অর্গানাইজেশন ও রিপোর্ট আবশ্যক।' },
        { name: 'Demonstration', desc: 'কোনো মেথড/টুল প্র্যাকটিক্যালি দেখানোর ইভেন্ট। পরিকল্পনা, উপস্থিতি এবং ফলো-আপ নথিভুক্ত রাখতে হবে।' },
        { name: 'TOT (Training of Trainers)', desc: 'নির্বাচিত অংশগ্রহণকারীদের প্রশিক্ষণ যারা পরে অন্যদের প্রশিক্ষণ দেবে। কাসকেড ট্রেনিং-এর প্রমাণ (MoV) থাকতে হবে।' },
        { name: 'Mentoring', desc: 'Organisation to Organisation ছোট গ্রুপকে নিয়মিত গাইড করা। মেন্টরিং নোট ও ফ্রিকোয়েন্সি রেকর্ড রাখতে হবে।' },
        { name: 'Peer Learning', desc: 'একই ব্যাকগ্রাউন্ড বা ভূমিকার অংশগ্রহণকারীদের মধ্যে পারস্পরিক শিখন। সেশনের সংখ্যা, আলোচনার বিষয় ও আউটপুট রাখতে হবে।' },
        { name: 'Coaching', desc: 'ব্যক্তিগত স্কিল ডেভেলপমেন্টের জন্য সরাসরি পর্যবেক্ষণ ও ফিডব্যাক। নির্ধারিত লক্ষ্য ও রেকর্ড থাকতে হবে।' },
      ],
    },
    {
      category: 'Community & Advocacy Events',
      items: [
        { name: 'Community Yard meeting', desc: 'কমিউনিটি/ইয়ার্ড পর্যায়ের অনানুষ্ঠানিক মিটিং (অধিকার, সেবা বা নাগরিক বিষয় নিয়ে আলোচনা)।' },
        { name: 'Dialogue', desc: 'সরকার বা অন্য স্টেকহোল্ডারের সাথে ফরমাল আলোচনা/সংলাপ। এজেন্ডা, আলোচিত বিষয় ও সরকারের প্রতিক্রিয়া নথিভুক্ত করতে হবে।' },
        { name: 'Conference', desc: 'বড় আকারের ফরমাল ইভেন্ট যেখানে সরকার, CSO, ডোনার, মিডিয়া বা একাডেমিয়া অংশ নেয়। এজেন্ডা ও রিপোর্ট আবশ্যক।' },
        { name: 'Seminar', desc: 'নির্দিষ্ট টপিকে একাডেমিক/ফরমাল প্রেজেন্টেশনসহ সেশন। রিপোর্ট ও Attandance/Registration তালিকা রাখতে হবে।' },
        { name: 'Workshop', desc: 'হ্যান্ডস-অন ইভেন্ট যেখানে আউটপুট (যেমন common understanding, action plan) তৈরি হয়। ডকুমেন্টেড আউটপুট আবশ্যক।' },
        { name: 'Meeting', desc: 'প্ল্যানিং, কো-অর্ডিনেশন বা সিদ্ধান্তের জন্য মিটিং। মিটিং মিনিটস ও রেজোলিউশন রাখতে হবে।' },
        { name: 'Campaign', desc: 'মেসেজ ছড়ানোর কার্যক্রম (সোশ্যাল মিডিয়া, রেডিও, ইয়ার্ড মিটিং ইত্যাদি চ্যানেলে)।' },
        { name: 'Grievance Redressal', desc: 'অভিযোগ বা সমস্যা গ্রহণ ও সমাধানের ইভেন্ট। অভিযোগ রেজিস্টার ও প্রতিক্রিয়া রেকর্ড করতে হবে।' },
        { name: 'Inclusion Session', desc: 'নারী, PWDs, সংখ্যালঘু ইত্যাদি প্রান্তিক গোষ্ঠীর অংশগ্রহণ নিশ্চিত করার সেশন। ডিসঅ্যাগ্রিগেটেড ডেটা রাখতে হবে।' },
        { name: 'Support Service Provision', desc: 'সরাসরি সেবা প্রদান (লিগ্যাল এইড, কাউন্সেলিং ইত্যাদি)। সার্ভিস রেকর্ড সংরক্ষণ করতে হবে।' },
        { name: 'SGBV Support Service', desc: 'লিঙ্গভিত্তিক সহিংসতার (SGBV) সার্ভাইভারদের জন্য বিশেষায়িত সহায়তা। গোপনীয়তা নিশ্চিতকরণ ও কেস ফাইল রাখা আবশ্যক।' },
        { name: 'Research Engagement', desc: 'রিসার্চ, ডেটা সংগ্রহ বা ফাইন্ডিং শেয়ারের কার্যক্রম।' },
        { name: 'Thematic External Meeting/Workshop', desc: 'বাইরের স্টেকহোল্ডারদের (যেমন সরকার, মিডিয়া) সাথে নির্দিষ্ট ইস্যু নিয়ে আলোচনা।' },
      ],
    },
    {
      category: 'Media & Outreach Events',
      items: [
        { name: 'Radio program', desc: 'সিভিক ইস্যু/CEF থিম নিয়ে রেডিওতে সম্প্রচার। ব্রডকাস্ট সার্টিফিকেট বা অডিও রেকর্ডিং আবশ্যক।' },
        { name: 'Community Radio Program', desc: 'লোকাল রেডিওতে সম্প্রচারিত প্রোগ্রাম। স্ক্রিপ্ট ও স্টেশন ব্রডকাস্ট সার্টিফিকেট লাগবে।' },
        { name: 'TV program', desc: 'টেলিভিশনে সম্প্রচারিত প্রোগ্রাম। ভিডিও রেকর্ড ও ব্রডকাস্টার সার্টিফিকেট রাখতে হবে।' },
        { name: 'Social Media Post/Campaign', desc: 'অনলাইনে পোস্ট বা ডিজিটাল ক্যাম্পেইন। ভিউ, লাইক, শেয়ার ইত্যাদি এনগেজমেন্ট মেট্রিক্স নিতে হবে।' },
        { name: 'IEC Material distribution', desc: 'লিফলেট, পোস্টার, বুকলেট ইত্যাদি বিতরণ। স্যাম্পল ও বিতরণ রসিদ সংরক্ষণ করতে হবে।' },
        { name: 'Mass Gathering', desc: 'বড় আকারের জনসমাগম (যেমন র‍্যালি, সাংস্কৃতিক অনুষ্ঠান)। ২০০ জনের বেশি হলে Headcount Sampling পদ্ধতি প্রয়োগ করতে হবে।' },
        { name: 'Print media campaign/story/news/Article', desc: 'সংবাদপত্র/ম্যাগাজিনে প্রকাশিত কনটেন্ট। অফলাইন সার্কুলেশন বা অনলাইন লিংক সংরক্ষণ করতে হবে।' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-6 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <BookOpen className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Official Event Tracker SOP & Instructions
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                  Standard Operating Procedures, Event ID Rules, Definitions, & Means of Verification (MoV)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="inline-flex rounded-lg bg-black/30 p-1 border border-white/20 text-xs font-semibold">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    language === 'bn' ? 'bg-white text-emerald-950 shadow-sm' : 'text-white hover:text-emerald-200'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    language === 'en' ? 'bg-white text-emerald-950 shadow-sm' : 'text-white hover:text-emerald-200'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto text-xs font-medium pb-1">
            <button
              onClick={() => setActiveSection('sop')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'sop'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              1. General SOP & MoV
            </button>

            <button
              onClick={() => setActiveSection('eventId')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'eventId'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              2. Event ID Formula
            </button>

            <button
              onClick={() => setActiveSection('types')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'types'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              3. Event Types & Definitions
            </button>

            <button
              onClick={() => setActiveSection('locations')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'locations'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              4. Bangladesh Locations & Pourashavas
            </button>

            <button
              onClick={() => setActiveSection('govPeace')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'govPeace'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              5. Gov & Conflict Rules (250 chars)
            </button>

            <button
              onClick={() => setActiveSection('reach')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === 'reach'
                  ? 'bg-white text-emerald-950 font-bold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              6. Indirect Reach & Evidence
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* SECTION 1: SOP & MoV */}
          {activeSection === 'sop' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {language === 'bn' ? 'সাধারণ পরিচালনা পদ্ধতি (General SOP)' : 'General Operating Procedure'}
                </h3>
                <div className="text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed whitespace-pre-line">
                  {language === 'bn'
                    ? instructions['General Instruction (Bangla)']
                    : instructions['General Instruction (English)']}
                </div>
              </div>

              {/* Means of Verification (MoV) Checklist */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mandatory Means of Verification (MoV) Checklist
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <span className="font-bold text-gray-900 dark:text-white block">
                      📁 Supporting Document Bundle Order:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li><strong>Top Sheet:</strong> Clearly inscribed with the unique Event ID.</li>
                      <li><strong>Event Agenda:</strong> Complete session schedule and topics.</li>
                      <li><strong>Short Event Report:</strong> Objectives, theme, discussion highlights, gov response.</li>
                      <li><strong>Attendance / Registration Sheet:</strong> Participant names, gender, CBO/CSO status.</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <span className="font-bold text-gray-900 dark:text-white block">
                      💻 Digital & Hardcopy Storage Protocol:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li><strong>Digital (KOBO / Google Forms):</strong> Preserved in secure project MEAL folder.</li>
                      <li><strong>Hardcopies:</strong> Stored in dedicated physical binder titled: <em>“Event Tracker Supporting Data”</em>.</li>
                      <li><strong>Cross-Verification:</strong> Total attendees in register must match direct participant headcount.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EVENT ID FORMULA */}
          {activeSection === 'eventId' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 p-6 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-4">
                <h3 className="text-base font-bold text-teal-900 dark:text-teal-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Event ID Formula & Specification: <code className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 font-mono text-sm">YYYYMMXXEVNN</code>
                </h3>

                <p className="text-sm text-teal-950 dark:text-teal-200 leading-relaxed whitespace-pre-line">
                  {instructions['Event/Activity ID']}
                </p>

                {/* Visual Formula Decoder */}
                <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-teal-300 dark:border-teal-700/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-3">
                    Formula Decomposition Example: <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">202511CBOR01</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">2025</span>
                      <span className="text-[11px] text-gray-500 block mt-1 font-medium">Year (YYYY)</span>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">11</span>
                      <span className="text-[11px] text-gray-500 block mt-1 font-medium">Month (MM)</span>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">CB</span>
                      <span className="text-[11px] text-gray-500 block mt-1 font-medium">Org Initials (2 Chars)</span>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">OR</span>
                      <span className="text-[11px] text-gray-500 block mt-1 font-medium">Type (2 Chars)</span>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 col-span-2 sm:col-span-1">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">01</span>
                      <span className="text-[11px] text-gray-500 block mt-1 font-medium">Seq No (2 Digits)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EVENT TYPES & DEFINITIONS */}
          {activeSection === 'types' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Official catalog of 31 standardized event types and documentation requirements:
                </span>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search event type..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {eventTypesList.map((cat, idx) => {
                  const filteredItems = cat.items.filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={idx} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                        {cat.category} ({filteredItems.length})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredItems.map((item, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:border-emerald-500 transition-colors"
                          >
                            <span className="text-xs font-bold text-gray-900 dark:text-white block mb-1">
                              {item.name}
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: BANGLADESH LOCATIONS & POURASHAVA */}
          {activeSection === 'locations' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-4">
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Special Instructions for Pourashava & City Corporation Wards
                </h3>
                <p className="text-sm text-amber-950 dark:text-amber-200 leading-relaxed whitespace-pre-line">
                  {instructions['District']}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Hierarchy Rules:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">1. District Level Event:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Select Division & District. Leave Upazila and Union blank.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">2. Upazila Level Event:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Select Division, District, & Upazila. Leave Union blank.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">3. Union Level Event:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Select all 4 tiers: Division → District → Upazila → Union.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: GOV & PEACE RULES */}
          {activeSection === 'govPeace' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Government Response Guidelines (250 Characters Max)
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {instructions['Government Response']}
                </p>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                    Guidance for Response Summary (within 250 characters):
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    {instructions['What was the response \r\n(Within 250 Caracter)'] ||
                      'Summarize the response of the most senior government official on priority CEF themes.'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Conflict Prevention & Peacebuilding Criteria
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {instructions['Does this event/activity contribute/Addresses Issues to prevent conflicts?']}
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                  <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
                    How it prevents conflict (Narrative - max 250 chars):
                  </span>
                  <p className="text-blue-800 dark:text-blue-300">
                    {instructions['If yes, How (Within 250 Carecter)']}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: INDIRECT REACH & EVIDENCE */}
          {activeSection === 'reach' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <h3 className="text-base font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Indirect Reach Criteria & Documentation Rules
                </h3>
                <p className="text-sm text-purple-950 dark:text-purple-200 leading-relaxed whitespace-pre-line">
                  {instructions['Does this event generate any indirect reach?']}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                  <span className="font-bold text-gray-900 dark:text-white block">Channels & Verification:</span>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Social Media Posts: Screenshots of analytics (views, shares, engagements).</li>
                    <li>Radio / TV Broadcasts: Station broadcast certification and script.</li>
                    <li>IEC Material Distribution: Distribution registers and sample copy.</li>
                    <li>Mass Gatherings (Rallies): Headcount sampling estimation note.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                  <span className="font-bold text-gray-900 dark:text-white block">Estimation Rationale:</span>
                  <p className="text-gray-600 dark:text-gray-300">
                    Always document the calculation formula used for audience projection (e.g., circulation figures, average household size multipliers, or digital impression logs).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Official CBDP Event Tracker Knowledge Base & Guidelines
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Done Reading
          </button>
        </div>

      </div>
    </div>
  );
}
