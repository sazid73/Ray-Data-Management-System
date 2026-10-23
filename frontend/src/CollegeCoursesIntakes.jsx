import React, { useState, useEffect } from 'react';
import './CollegeCoursesIntakes.css';
import { api } from './api';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Built-in realistic course curriculum & standard UK requirements data
const defaultIntakeCoursesData = [
  // GBS Courses
  {
    id: 'gbs-1',
    college: 'GBS',
    courseName: 'BSc (Hons) Construction Management with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'Sep 26'],
    academicReq: 'Minimum 48 UCAS tariff points OR 2+ years relevant site/work experience route',
    englishReq: 'In-house English test (Pass 60%) or IELTS 5.5 / GCSE English Grade C/4',
    residencyReq: 'UK Settled / Pre-Settled / Indefinite Leave to Remain (ILR) / British Citizen',
    interviewReq: 'Internal Academic Admissions & Suitability Interview',
    workRouteEligible: true,
    notes: 'Morning, evening and weekend flexible batches available across London, Birmingham, Manchester & Leeds campuses.'
  },
  {
    id: 'gbs-2',
    college: 'GBS',
    courseName: 'BA (Hons) Business & Management (Level 6 Top-Up)',
    level: 'Level 6 (Top-Up)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: 'HND (Level 5) in Business, Foundation Degree (FdA) 240 credits or equivalent',
    englishReq: 'Proof of previous UK study at Level 5 or in-house English assessment',
    residencyReq: 'UK Citizen / Pre-Settled / Settled status',
    interviewReq: 'Brief 15-min Course Suitability Interview',
    workRouteEligible: false,
    notes: 'Direct 1-year honours degree completion.'
  },
  {
    id: 'gbs-3',
    college: 'GBS',
    courseName: 'BSc (Hons) Health, Wellbeing and Social Care with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: 'Standard GCSEs or 2+ years care sector / community support work experience route',
    englishReq: 'In-house diagnostic English test or Level 2 Functional Skills English',
    residencyReq: 'UK Settled / Pre-Settled / British National',
    interviewReq: 'Academic & Values-based Interview',
    workRouteEligible: true,
    notes: 'High demand course. SFE eligible for tuition fee and maintenance loan.'
  },
  {
    id: 'gbs-4',
    college: 'GBS',
    courseName: 'BSc (Hons) Computing with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: '32-48 UCAS points or relevant IT/technical employment route',
    englishReq: 'In-house English assessment or GCSE English C/4',
    residencyReq: 'UK Settled / Pre-Settled / ILR',
    interviewReq: 'Technical & Motivational Interview',
    workRouteEligible: true,
    notes: 'Covers software development, networking and cybersecurity foundations.'
  },
  {
    id: 'gbs-5',
    college: 'GBS',
    courseName: 'HND in Business (Level 4/5)',
    level: 'Level 4/5 Higher National Diploma',
    availableIntakes: ['2026 June', '2026 Sep', 'May 26', 'Sep 26'],
    academicReq: 'Level 3 qualification (1 A-Level/BTEC) or mature student route with CV',
    englishReq: 'Internal English Diagnostic Test',
    residencyReq: 'UK Home Fee Status / SFE eligible',
    interviewReq: 'Admissions Suitability Interview',
    workRouteEligible: true,
    notes: 'Pearson Edexcel accredited diploma with direct progression to Level 6 top-up.'
  },

  // Arden Courses
  {
    id: 'arden-1',
    college: 'Arden',
    courseName: 'BA (Hons) Business Management with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: '32 UCAS points or minimum 2 years non-standard managerial/work experience',
    englishReq: 'Internal Arden English Test (Score 6.0 equiv) or GCSE Grade C/4',
    residencyReq: 'UK Settled / Pre-Settled / British Citizen',
    interviewReq: 'Blended Learning Diagnostic & Admissions Check',
    workRouteEligible: true,
    notes: 'Blended format: 2 days in class per week + online learning.'
  },
  {
    id: 'arden-2',
    college: 'Arden',
    courseName: 'BSc (Hons) Accounting and Finance with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: '32 UCAS points or 2+ years administrative/finance workplace background',
    englishReq: 'Arden English test or GCSE English & Maths grade C/4',
    residencyReq: 'UK Home Fee status / ILR / Pre-Settled',
    interviewReq: 'Admissions interview with numeracy verification',
    workRouteEligible: true,
    notes: 'ACCA and CIMA syllabus exemptions available upon graduation.'
  },
  {
    id: 'arden-3',
    college: 'Arden',
    courseName: 'BSc (Hons) Health and Care Management with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: 'Mature entry route (21+) with 2 years work experience or 32 UCAS points',
    englishReq: 'Arden internal test or IELTS 6.0',
    residencyReq: 'UK Settled / Pre-Settled / British Passport',
    interviewReq: 'Health & Care suitability interview',
    workRouteEligible: true,
    notes: 'Designed for aspiring health administrators, clinical team leaders and social managers.'
  },
  {
    id: 'arden-4',
    college: 'Arden',
    courseName: 'BSc (Hons) Computing (Top-Up)',
    level: 'Level 6 (Top-Up)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: 'HND Computing, Foundation Degree in IT or 240 credits in computing discipline',
    englishReq: 'Level 5 UK qualification evidence or Arden English Test',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Portfolio & transcript review interview',
    workRouteEligible: false,
    notes: 'Final 120 credits for full BSc honours award.'
  },

  // LCCA Courses
  {
    id: 'lcca-1',
    college: 'LCCA',
    courseName: 'BA (Hons) Business Management and Entrepreneurship',
    level: 'Level 4 / Degree',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: 'Level 3 qualification (64 UCAS points) or 3+ years self-employed/business work route',
    englishReq: 'In-house English test or GCSE C/4',
    residencyReq: 'UK Settled / Pre-Settled / ILR',
    interviewReq: 'Portfolio / Business idea pitch and admissions interview',
    workRouteEligible: true,
    notes: 'Central London campus, strong focus on start-ups and digital commerce.'
  },
  {
    id: 'lcca-2',
    college: 'LCCA',
    courseName: 'Foundation Degree (FdA) Hospitality and Event Management',
    level: 'Level 4/5 (Foundation Degree)',
    availableIntakes: ['2026 June', '2026 Sep', 'May 26', 'Sep 26'],
    academicReq: '1 A-Level, BTEC Level 3 or 2 years hospitality/catering work experience',
    englishReq: 'Internal English diagnostic test',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Candidate suitability conversation',
    workRouteEligible: true,
    notes: 'Practical event planning projects and industry guest speakers.'
  },

  // OLC Courses
  {
    id: 'olc-1',
    college: 'OLC',
    courseName: 'Cert HE Business Management with Foundation Year',
    level: 'Level 3/4 CertHE',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: 'No formal qualifications required for mature learners (21+) with work route',
    englishReq: 'OLC in-house English assessment test',
    residencyReq: 'UK Settled / Pre-Settled / British National',
    interviewReq: 'Supportive admissions interview',
    workRouteEligible: true,
    notes: 'University of Bolton partnership. Step-by-step academic ladder.'
  },
  {
    id: 'olc-2',
    college: 'OLC',
    courseName: 'Cert HE Integrated Health, Social Care & Wellbeing with Foundation Year',
    level: 'Level 3/4 CertHE',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: 'GCSE equivalents or relevant care employment history (1-2 years)',
    englishReq: 'OLC internal English test',
    residencyReq: 'UK Settled / Pre-Settled / ILR',
    interviewReq: 'Values & care background assessment interview',
    workRouteEligible: true,
    notes: 'Available across Bolton, Manchester and London study centres.'
  },

  // LSC Courses
  {
    id: 'lsc-1',
    college: 'LSC',
    courseName: 'CertHE Business with Foundation Year',
    level: 'Level 3/4 CertHE',
    availableIntakes: ['2026 June', '2026 Sep', 'May 26', 'Sep 26'],
    academicReq: 'High School completion or 2+ years general work route',
    englishReq: 'LSC internal English test (55% pass mark)',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Admissions & Compliance Interview',
    workRouteEligible: true,
    notes: 'Fast-track degree pathway with multiple daytime & weekend schedules.'
  },
  {
    id: 'lsc-2',
    college: 'LSC',
    courseName: 'CertHE Public Health with Foundation Year',
    level: 'Level 3/4 CertHE',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: 'Level 2 qualifications or health community work history',
    englishReq: 'LSC English test or GCSE C/4',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Candidate motivation interview',
    workRouteEligible: true,
    notes: 'Focuses on epidemiology, public wellness and healthcare systems.'
  },

  // QA Courses
  {
    id: 'qa-1',
    college: 'QA',
    courseName: 'BSc (Hons) Construction Management with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: '32 UCAS points or 2+ years construction trade / site background',
    englishReq: 'QA internal English password test',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'QA academic interview & ID verification',
    workRouteEligible: true,
    notes: 'Solent University & Northumbria University partnerships.'
  },
  {
    id: 'qa-2',
    college: 'QA',
    courseName: 'BSc (Hons) Data Science with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: '48 UCAS points or numerical / IT workplace route',
    englishReq: 'QA password test or IELTS 6.0',
    residencyReq: 'UK Home Fee Status / SFE eligible',
    interviewReq: 'Analytical aptitude and admissions interview',
    workRouteEligible: true,
    notes: 'Includes Python, SQL, statistical modeling and business intelligence.'
  },

  // CECOS Courses
  {
    id: 'cecos-1',
    college: 'CECOS',
    courseName: 'BSc Business Management with Foundation',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26'],
    academicReq: 'Secondary school education or 2+ years relevant commercial route',
    englishReq: 'CECOS internal diagnostic English test',
    residencyReq: 'UK Settled / Pre-Settled / British Citizen',
    interviewReq: 'Oral interview with admissions officer',
    workRouteEligible: true,
    notes: 'London campus with supportive tutor coaching.'
  },
  {
    id: 'cecos-2',
    college: 'CECOS',
    courseName: 'BSc Health and Social Care with Foundation',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'May 26', 'Sep 26'],
    academicReq: 'GCSE equivalents or 2 years healthcare/voluntary work experience',
    englishReq: 'CECOS English assessment',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Suitability & compliance interview',
    workRouteEligible: true,
    notes: 'Approved for full student loan financing.'
  },

  // UKMC Courses
  {
    id: 'ukmc-1',
    college: 'UKMC',
    courseName: 'BSc (Hons) Health & Social Care with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'May 26', 'Sep 26'],
    academicReq: '32 UCAS points or mature entry route with CV & reference',
    englishReq: 'UKMC internal language assessment',
    residencyReq: 'UK Settled / Pre-Settled / ILR',
    interviewReq: 'College admissions interview',
    workRouteEligible: true,
    notes: 'Campuses in London and Manchester.'
  },
  {
    id: 'ukmc-2',
    college: 'UKMC',
    courseName: 'BA (Hons) Business Management with Foundation Year',
    level: 'Level 3/4 (Foundation)',
    availableIntakes: ['2026 June', '2026 Sep', 'Sep 26'],
    academicReq: 'Level 3 or 2 years employment history',
    englishReq: 'In-house test or GCSE English C/4',
    residencyReq: 'UK Settled / Pre-Settled',
    interviewReq: 'Course advisor interview',
    workRouteEligible: true,
    notes: 'Covers marketing, leadership, finance and entrepreneurship.'
  }
];

const CollegeCoursesIntakes = ({ currentUserRole, currentUser, currentUserData }) => {
  const [coursesData, setCoursesData] = useState(defaultIntakeCoursesData);
  const [runningIntakesList, setRunningIntakesList] = useState(['All Running Intakes', '2026 June', '2026 Sep', '2026 May', 'May 26', 'Sep 26']);
  const [selectedIntake, setSelectedIntake] = useState('All Running Intakes');
  const [selectedCollege, setSelectedCollege] = useState('All Colleges');
  const [searchTerm, setSearchTerm] = useState('');
  const [workRouteFilter, setWorkRouteFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  
  // Modal for Edit / Add course requirements
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);

  const canEdit = currentUserRole === 'admin' 
    || currentUserData?.role === 'super_admin'
    || currentUserData?.abilities?.includes('super_admin') 
    || currentUserData?.abilities?.includes('manage_settings');

  // Load persistent configurations from Supabase grid_cells
  useEffect(() => {
    // 1. Fetch running intakes from targets
    api.getTargets().then(targets => {
      if (targets && targets.length > 0) {
        const activeIntakes = targets.filter(t => t.isActive !== false).map(t => t.intake);
        const unique = Array.from(new Set(activeIntakes.filter(Boolean)));
        if (unique.length > 0) {
          setRunningIntakesList(['All Running Intakes', ...unique]);
        }
      }
    }).catch(e => console.warn('Could not load targets for intakes:', e));

    // 2. Fetch courses & requirements config from Supabase grid_cells
    fetch(`${API_BASE}/api/grid`)
      .then(res => res.json())
      .then(data => {
        const storedReqs = data['INTAKE_COURSE_REQUIREMENTS'];
        if (storedReqs && storedReqs.slots && storedReqs.slots[0] && storedReqs.slots[0].text) {
          try {
            const parsed = JSON.parse(storedReqs.slots[0].text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCoursesData(parsed);
            }
          } catch (e) {
            console.error('Failed to parse INTAKE_COURSE_REQUIREMENTS:', e);
          }
        }
      })
      .catch(e => console.error('Error fetching course requirements:', e));
  }, []);

  const collegesList = ['All Colleges', 'GBS', 'Arden', 'LCCA', 'OLC', 'LSC', 'QA', 'CECOS', 'UKMC', 'VCAD'];

  const getCollegeBadgeStyle = (college) => {
    switch (college) {
      case 'GBS': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' };
      case 'Arden': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'LCCA': return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: '1px solid rgba(234, 179, 8, 0.4)' };
      case 'OLC': return { bg: 'rgba(20, 184, 166, 0.15)', text: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.4)' };
      case 'LSC': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' };
      case 'QA': case 'QA-Solent/Lmet': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.4)' };
      case 'CECOS': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)' };
      case 'UKMC': return { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.4)' };
      case 'VCAD': return { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.4)' };
      default: return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.4)' };
    }
  };

  // Filtered course results
  const filteredCourses = coursesData.filter(course => {
    // 1. Intake filter
    if (selectedIntake !== 'All Running Intakes') {
      const hasIntake = course.availableIntakes && course.availableIntakes.some(
        i => i.toLowerCase().trim() === selectedIntake.toLowerCase().trim()
      );
      if (!hasIntake) return false;
    }

    // 2. College filter
    if (selectedCollege !== 'All Colleges') {
      if (course.college.toLowerCase() !== selectedCollege.toLowerCase()) {
        return false;
      }
    }

    // 3. Work route filter
    if (workRouteFilter === 'Work Route Accepted') {
      if (!course.workRouteEligible) return false;
    }

    // 4. Level filter
    if (levelFilter !== 'All') {
      if (!course.level.toLowerCase().includes(levelFilter.toLowerCase())) return false;
    }

    // 5. Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = course.courseName.toLowerCase().includes(q);
      const matchCol = course.college.toLowerCase().includes(q);
      const matchReq = (course.academicReq + ' ' + course.englishReq + ' ' + (course.notes || '')).toLowerCase().includes(q);
      if (!matchName && !matchCol && !matchReq) return false;
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingCourse({
      id: 'course-' + Date.now(),
      college: selectedCollege !== 'All Colleges' ? selectedCollege : 'GBS',
      courseName: '',
      level: 'Level 3/4 (Foundation)',
      availableIntakes: runningIntakesList.filter(i => i !== 'All Running Intakes'),
      academicReq: 'Standard Entry / 2+ years relevant experience route',
      englishReq: 'In-house diagnostic English test (60%)',
      residencyReq: 'UK Settled / Pre-Settled / British Citizen',
      interviewReq: 'Internal Suitability Interview',
      workRouteEligible: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse({ ...course });
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse.courseName.trim()) {
      alert('Please enter a course name.');
      return;
    }

    setSaving(true);
    let updated;
    const exists = coursesData.some(c => c.id === editingCourse.id);
    if (exists) {
      updated = coursesData.map(c => c.id === editingCourse.id ? editingCourse : c);
    } else {
      updated = [editingCourse, ...coursesData];
    }

    setCoursesData(updated);
    setIsModalOpen(false);

    try {
      await fetch(`${API_BASE}/api/grid/INTAKE_COURSE_REQUIREMENTS`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: '',
          textColor: '',
          slots: [{ text: JSON.stringify(updated) }]
        })
      });

      // Log activity
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toLocaleString(),
          user: currentUser || 'Admin',
          action: 'Course Requirements',
          details: `Updated course and requirements: ${editingCourse.courseName} (${editingCourse.college})`
        })
      }).catch(e => console.error(e));
    } catch (err) {
      console.error('Failed to save course data:', err);
      alert('Failed to save requirements to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to remove this course entry?')) return;
    const updated = coursesData.filter(c => c.id !== id);
    setCoursesData(updated);

    try {
      await fetch(`${API_BASE}/api/grid/INTAKE_COURSE_REQUIREMENTS`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: '',
          textColor: '',
          slots: [{ text: JSON.stringify(updated) }]
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="college-courses-container">
      {/* Header Card */}
      <div className="intakes-header-card">
        <div className="intakes-header-title">
          <h2>
            <span>🏛️</span> College Courses & Running Intakes Requirements
          </h2>
          <p>
            Check currently active intake sessions, available college courses, academic qualifications, and admission requirements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {canEdit && (
            <button 
              onClick={handleOpenAddModal}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>➕</span> Add Course / Intake
            </button>
          )}
        </div>
      </div>

      {/* Running Intake Selector Pills */}
      <div className="intakes-filters-bar">
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🗓️</span> Running Intakes:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {runningIntakesList.map(intake => (
            <button
              key={intake}
              className={`intake-pill-btn ${selectedIntake === intake ? 'active' : ''}`}
              onClick={() => setSelectedIntake(intake)}
            >
              {intake === 'All Running Intakes' ? '🌐 All Running Intakes' : `⚡ ${intake}`}
            </button>
          ))}
        </div>
      </div>

      {/* College Horizontal Tabs */}
      <div>
        <div className="college-tabs-scroller">
          {collegesList.map(col => {
            const isActive = selectedCollege === col;
            const style = col === 'All Colleges' ? {} : getCollegeBadgeStyle(col);
            return (
              <button
                key={col}
                className={`college-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCollege(col)}
                style={!isActive && col !== 'All Colleges' ? { color: style.text } : {}}
              >
                {col === 'All Colleges' ? '🏛️ All Colleges' : col}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter & Search Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
            <input 
              type="text"
              placeholder="Search course, college, requirements..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.6rem 1rem 0.6rem 2.2rem',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                minWidth: '280px'
              }}
            />
          </div>

          {/* Work Route Accepted filter */}
          <select 
            value={workRouteFilter} 
            onChange={e => setWorkRouteFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.6rem 0.9rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="All">All Routes</option>
            <option value="Work Route Accepted">💼 Work Route Accepted</option>
          </select>

          {/* Level Filter */}
          <select 
            value={levelFilter} 
            onChange={e => setLevelFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.6rem 0.9rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="All">All Levels</option>
            <option value="Foundation">Level 3/4 Foundation</option>
            <option value="Top-Up">Level 6 Top-Up</option>
            <option value="HND">HND / Level 5</option>
          </select>
        </div>

        {/* Count overview */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Showing <span style={{ color: '#6366f1' }}>{filteredCourses.length}</span> course programs
          {selectedIntake !== 'All Running Intakes' && ` for ${selectedIntake}`}
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Courses Found</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No courses match the selected intake "{selectedIntake}" or college filter "{selectedCollege}".
          </p>
        </div>
      ) : (
        <div className="courses-grid-view">
          {filteredCourses.map(course => {
            const badgeStyle = getCollegeBadgeStyle(course.college);
            return (
              <div key={course.id} className="course-card">
                <div>
                  <div className="course-card-header">
                    <span 
                      className="course-college-badge"
                      style={{ background: badgeStyle.bg, color: badgeStyle.text, border: badgeStyle.border }}
                    >
                      {course.college}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      {course.level}
                    </span>
                  </div>

                  <h3 className="course-card-title">{course.courseName}</h3>

                  {/* Available Running Intakes */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Available Running Intakes:
                    </div>
                    <div className="course-intakes-tags">
                      {course.availableIntakes && course.availableIntakes.map(intake => (
                        <span 
                          key={intake} 
                          className={`intake-badge ${selectedIntake === intake ? 'running' : 'upcoming'}`}
                        >
                          ⚡ {intake}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Requirements Breakdown Box */}
                <div className="requirements-box">
                  <div className="req-item">
                    <span className="req-label">🎓 Academic:</span>
                    <span className="req-value">{course.academicReq}</span>
                  </div>
                  <div className="req-item">
                    <span className="req-label">🗣️ English:</span>
                    <span className="req-value">{course.englishReq}</span>
                  </div>
                  <div className="req-item">
                    <span className="req-label">🇬🇧 Status:</span>
                    <span className="req-value">{course.residencyReq}</span>
                  </div>
                  <div className="req-item">
                    <span className="req-label">💬 Interview:</span>
                    <span className="req-value">{course.interviewReq}</span>
                  </div>
                  {course.notes && (
                    <div className="req-item" style={{ marginTop: '0.2rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>💡 <em>{course.notes}</em></span>
                    </div>
                  )}
                </div>

                {/* Footer with Route badge & Admin Edit options */}
                <div className="course-card-footer">
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.3rem', 
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: course.workRouteEligible ? '#10b981' : '#6b7280'
                  }}>
                    {course.workRouteEligible ? '✅ Work Route Accepted' : '📄 Direct / Standard Entry'}
                  </span>

                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleOpenEditModal(course)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#6366f1',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Course Modal */}
      {isModalOpen && editingCourse && (
        <div className="course-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="course-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                {coursesData.some(c => c.id === editingCourse.id) ? 'Edit Course & Entry Requirements' : 'Add New Course Requirements'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="course-form-group">
                  <label>College Campus *</label>
                  <select 
                    className="course-form-select"
                    value={editingCourse.college}
                    onChange={e => setEditingCourse({ ...editingCourse, college: e.target.value })}
                  >
                    {collegesList.filter(c => c !== 'All Colleges').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="course-form-group">
                  <label>Degree Level / Qualification</label>
                  <input 
                    type="text"
                    className="course-form-input"
                    value={editingCourse.level}
                    onChange={e => setEditingCourse({ ...editingCourse, level: e.target.value })}
                    placeholder="e.g. Level 3/4 (Foundation) or Level 6 Top-Up"
                  />
                </div>
              </div>

              <div className="course-form-group">
                <label>Course Title *</label>
                <input 
                  type="text"
                  className="course-form-input"
                  value={editingCourse.courseName}
                  onChange={e => setEditingCourse({ ...editingCourse, courseName: e.target.value })}
                  placeholder="e.g. BSc (Hons) Business Management"
                  required
                />
              </div>

              {/* Running Intakes Checkboxes */}
              <div className="course-form-group">
                <label>Available Running Intakes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', background: 'var(--bg-color)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {runningIntakesList.filter(i => i !== 'All Running Intakes').map(intake => {
                    const isChecked = editingCourse.availableIntakes?.includes(intake);
                    return (
                      <label key={intake} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const cur = editingCourse.availableIntakes || [];
                            if (e.target.checked) {
                              setEditingCourse({ ...editingCourse, availableIntakes: [...cur, intake] });
                            } else {
                              setEditingCourse({ ...editingCourse, availableIntakes: cur.filter(i => i !== intake) });
                            }
                          }}
                        />
                        <span>{intake}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="course-form-group">
                <label>Academic Requirements</label>
                <input 
                  type="text"
                  className="course-form-input"
                  value={editingCourse.academicReq}
                  onChange={e => setEditingCourse({ ...editingCourse, academicReq: e.target.value })}
                  placeholder="e.g. 32-48 UCAS points or 2+ years work experience route"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="course-form-group">
                  <label>English Requirements</label>
                  <input 
                    type="text"
                    className="course-form-input"
                    value={editingCourse.englishReq}
                    onChange={e => setEditingCourse({ ...editingCourse, englishReq: e.target.value })}
                    placeholder="e.g. In-house English Test or IELTS 5.5"
                  />
                </div>

                <div className="course-form-group">
                  <label>Residency / Status</label>
                  <input 
                    type="text"
                    className="course-form-input"
                    value={editingCourse.residencyReq}
                    onChange={e => setEditingCourse({ ...editingCourse, residencyReq: e.target.value })}
                    placeholder="e.g. UK Settled / Pre-Settled / ILR"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="course-form-group">
                  <label>Interview Requirements</label>
                  <input 
                    type="text"
                    className="course-form-input"
                    value={editingCourse.interviewReq}
                    onChange={e => setEditingCourse({ ...editingCourse, interviewReq: e.target.value })}
                    placeholder="e.g. Course Suitability Interview"
                  />
                </div>

                <div className="course-form-group" style={{ justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.2rem' }}>
                    <input 
                      type="checkbox"
                      checked={editingCourse.workRouteEligible}
                      onChange={e => setEditingCourse({ ...editingCourse, workRouteEligible: e.target.checked })}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Work Route Experience Accepted</span>
                  </label>
                </div>
              </div>

              <div className="course-form-group">
                <label>Important Notes / Shift Schedule</label>
                <textarea 
                  className="course-form-textarea"
                  value={editingCourse.notes || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, notes: e.target.value })}
                  placeholder="e.g. Morning, Evening or Weekend classes available. SFE funded."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#6366f1',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Requirements'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeCoursesIntakes;
