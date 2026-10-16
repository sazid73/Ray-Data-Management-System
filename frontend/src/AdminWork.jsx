import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from './api';
import './AdminWork.css';

const BENCHMARKS = {
  cv: 20,    // 20 mins per CV
  qa: 20,    // 20 mins per QA
  sub: 30,   // 30 mins per Sub & QC
  dailyShiftMinutes: 360 // 6.0 Hours
};

const DEFAULT_EMPLOYEES = [
  { name: 'Fatima Khan', role: 'Senior Admissions Admin' },
  { name: 'Tanvir Hasan', role: 'Documentation Specialist' },
  { name: 'Rahim Ahmed', role: 'University Submissions Officer' },
  { name: 'Ayesha Siddiqua', role: 'Admissions Executive' },
  { name: 'Nazia Sultana', role: 'Admissions Associate' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKS = [1, 2, 3, 4];

// Pre-seeded authentic initial demo logs matching the Excel workbook
const DEFAULT_INITIAL_DATA = {
  'Fatima Khan': {
    'W1_Monday': { cv: 3, qa: 4, sub: 6, misc: 'University of Manchester UCAS applications', miscM: 40 },
    'W1_Tuesday': { cv: 2, qa: 5, sub: 6, misc: 'SOP review and Warwick university follow-up', miscM: 40 },
    'W1_Wednesday': { cv: 4, qa: 4, sub: 5, misc: 'Transcript verification and agent inquiries', miscM: 50 },
    'W1_Thursday': { cv: 3, qa: 4, sub: 6, misc: 'Direct university portal filings', miscM: 30 },
    'W1_Friday': { cv: 2, qa: 5, sub: 6, misc: 'Weekly offer checking and student calls', miscM: 40 },

    'W2_Monday': { cv: 3, qa: 5, sub: 5, misc: 'Bristol and Leeds submissions', miscM: 50 },
    'W2_Tuesday': { cv: 4, qa: 4, sub: 5, misc: 'Edinburgh and Glasgow documentation QA', miscM: 50 },
    'W2_Wednesday': { cv: 2, qa: 5, sub: 6, misc: 'Kings College London portal applications', miscM: 40 },
    'W2_Thursday': { cv: 3, qa: 4, sub: 6, misc: 'Queen Mary submissions and document scans', miscM: 40 },
    'W2_Friday': { cv: 3, qa: 3, sub: 6, misc: 'Friday QC audit on issued offers', miscM: 60 },

    'W3_Monday': { cv: 4, qa: 3, sub: 6, misc: 'Birmingham city university review', miscM: 40 },
    'W3_Tuesday': { cv: 3, qa: 5, sub: 5, misc: 'Nottingham follow-up and student emails', miscM: 50 },
    'W3_Wednesday': { cv: 2, qa: 4, sub: 6, misc: 'Brunel application submissions', miscM: 60 },
    'W3_Thursday': { cv: 4, qa: 4, sub: 5, misc: 'Southampton portal processing', miscM: 40 },
    'W3_Friday': { cv: 3, qa: 4, sub: 6, misc: 'Weekly audit and offer approvals', miscM: 40 },

    'W4_Monday': { cv: 3, qa: 4, sub: 6, misc: 'UCAS portal submissions', miscM: 40 },
    'W4_Tuesday': { cv: 4, qa: 3, sub: 6, misc: 'Document scans and compliance checks', miscM: 40 },
    'W4_Wednesday': { cv: 3, qa: 5, sub: 5, misc: 'Offer letters verification', miscM: 50 },
    'W4_Thursday': { cv: 2, qa: 5, sub: 6, misc: 'Agent documentation follow up', miscM: 40 },
    'W4_Friday': { cv: 3, qa: 4, sub: 6, misc: 'Monthly closing QA report', miscM: 40 },
  },
  'Tanvir Hasan': {
    'W1_Monday': { cv: 3, qa: 4, sub: 5, misc: 'Direct applications to Ulster and Coventry', miscM: 50 },
    'W1_Tuesday': { cv: 4, qa: 3, sub: 5, misc: 'Middlesex university documentation checks', miscM: 50 },
    'W1_Wednesday': { cv: 2, qa: 5, sub: 5, misc: 'Hertfordshire submissions and CAS follow up', miscM: 50 },
    'W1_Thursday': { cv: 3, qa: 4, sub: 5, misc: 'London Met admissions portal', miscM: 50 },
    'W1_Friday': { cv: 4, qa: 3, sub: 5, misc: 'De Montfort applicant verification', miscM: 50 },
  },
  'Rahim Ahmed': {
    'W1_Monday': { cv: 3, qa: 4, sub: 5, misc: 'Northumbria document upload and verification', miscM: 50 },
    'W1_Tuesday': { cv: 3, qa: 4, sub: 5, misc: 'Bedfordshire UCAS clearance review', miscM: 50 },
    'W1_Wednesday': { cv: 4, qa: 3, sub: 5, misc: 'Greenwich university application filings', miscM: 50 },
    'W1_Thursday': { cv: 2, qa: 5, sub: 5, misc: 'Canterbury Christ Church submissions', miscM: 50 },
    'W1_Friday': { cv: 3, qa: 4, sub: 5, misc: 'Anglia Ruskin portal follow-up', miscM: 50 },
  },
  'Ayesha Siddiqua': {
    'W1_Monday': { cv: 3, qa: 3, sub: 5, misc: 'West London university checks', miscM: 50 },
    'W1_Tuesday': { cv: 2, qa: 3, sub: 4, misc: 'East London portal documentation', miscM: 40 },
    'W1_Wednesday': { cv: 3, qa: 4, sub: 5, misc: 'Roehampton documentation follow-up', miscM: 50 },
    'W1_Thursday': { cv: 3, qa: 3, sub: 5, misc: 'BPP documentation compliance review', miscM: 60 },
    'W1_Friday': { cv: 2, qa: 4, sub: 4, misc: 'Weekly summary and offer audits', miscM: 40 },
  },
  'Nazia Sultana': {
    'W1_Monday': { cv: 2, qa: 3, sub: 4, misc: 'Applicant filing and data entry checks', miscM: 40 },
    'W1_Tuesday': { cv: 2, qa: 3, sub: 4, misc: 'Document scans and email responses', miscM: 40 },
    'W1_Wednesday': { cv: 2, qa: 3, sub: 4, misc: 'Passport and transcript validation', miscM: 50 },
    'W1_Thursday': { cv: 2, qa: 3, sub: 4, misc: 'Portal checks and document filing', miscM: 40 },
    'W1_Friday': { cv: 2, qa: 2, sub: 4, misc: 'Weekly reports compilation', miscM: 40 },
  }
};

const AdminWork = ({ currentUserRole, currentUser, currentUserData }) => {
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | employeeName
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [workData, setWorkData] = useState(DEFAULT_INITIAL_DATA);
  const [saveStatus, setSaveStatus] = useState('Saved to Cloud');
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  const [filterQuery, setFilterQuery] = useState('');

  const saveTimeoutRef = useRef(null);

  // 1. Fetch live data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await api.getAdminWorkData();
        if (stored && Object.keys(stored).length > 0) {
          // If we have custom employees list or logs
          if (stored['EMPLOYEES_LIST']) {
            setEmployees(stored['EMPLOYEES_LIST']);
          }
          if (stored['WORK_LOGS']) {
            setWorkData(prev => ({ ...prev, ...stored['WORK_LOGS'] }));
          }
        }
      } catch (err) {
        console.warn('Using default admin work dataset', err);
      }
    };
    loadData();
  }, []);

  // 2. Debounced save to Supabase
  const persistWorkData = (newWorkData, newEmployees = null) => {
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveAdminWorkData('WORK_LOGS', newWorkData);
        if (newEmployees) {
          await api.saveAdminWorkData('EMPLOYEES_LIST', newEmployees);
        }
        setSaveStatus('All Changes Saved');
      } catch (err) {
        console.error('Failed to sync admin work data:', err);
        setSaveStatus('Save Failed');
      }
    }, 1000);
  };

  const handleCellChange = (empName, week, day, field, value) => {
    const key = `W${week}_${day}`;
    setWorkData(prev => {
      const empData = { ...(prev[empName] || {}) };
      const dayData = { ...(empData[key] || { cv: 0, qa: 0, sub: 0, misc: '', miscM: 0 }) };

      if (field === 'misc') {
        dayData[field] = value;
      } else {
        dayData[field] = Math.max(0, parseInt(value) || 0);
      }

      empData[key] = dayData;
      const next = { ...prev, [empName]: empData };
      persistWorkData(next);
      return next;
    });
  };

  // Helper to compute metrics for a single day
  const calculateDayMetrics = (dayLog = {}) => {
    const cv = Number(dayLog.cv) || 0;
    const qa = Number(dayLog.qa) || 0;
    const sub = Number(dayLog.sub) || 0;
    const miscM = Number(dayLog.miscM) || 0;

    const totalMinutes = (cv * BENCHMARKS.cv) + (qa * BENCHMARKS.qa) + (sub * BENCHMARKS.sub) + miscM;
    const totalHours = totalMinutes / 60;
    const dailyPct = BENCHMARKS.dailyShiftMinutes > 0 ? (totalMinutes / BENCHMARKS.dailyShiftMinutes) : 0;
    const isTargetMet = dailyPct >= 1.0;

    return {
      cv, qa, sub, miscM,
      totalMinutes,
      totalHours,
      dailyPct,
      isTargetMet
    };
  };

  // Helper to compute weekly stats for an employee
  const calculateWeekSummary = (empName, week) => {
    const empData = workData[empName] || {};
    let totalCV = 0, totalQA = 0, totalSub = 0, totalMiscM = 0;
    let totalMinutes = 0;
    let daysLogged = 0;

    DAYS.forEach(day => {
      const metrics = calculateDayMetrics(empData[`W${week}_${day}`]);
      totalCV += metrics.cv;
      totalQA += metrics.qa;
      totalSub += metrics.sub;
      totalMiscM += metrics.miscM;
      totalMinutes += metrics.totalMinutes;
      if (metrics.totalMinutes > 0) daysLogged++;
    });

    const shiftTotalMins = DAYS.length * BENCHMARKS.dailyShiftMinutes; // 1800 mins
    const avgPct = shiftTotalMins > 0 ? (totalMinutes / shiftTotalMins) : 0;
    const totalHours = totalMinutes / 60;

    return {
      totalCV,
      totalQA,
      totalSub,
      totalMiscM,
      totalMinutes,
      totalHours,
      avgPct,
      daysLogged
    };
  };

  // Helper to compute monthly totals and ranking for all employees
  const employeeRankings = useMemo(() => {
    const list = employees.map(emp => {
      let monthTotalMins = 0;
      const weekAverages = [];

      WEEKS.forEach(w => {
        const wSum = calculateWeekSummary(emp.name, w);
        monthTotalMins += wSum.totalMinutes;
        weekAverages.push(wSum.avgPct);
      });

      // Excel formula: G4 = AVERAGE(C4:F4)
      const monthlyAvgPct = weekAverages.length > 0 ? (weekAverages.reduce((a, b) => a + b, 0) / weekAverages.length) : 0;
      const monthlyTotalHours = monthTotalMins / 60;
      const isTargetMet = monthlyAvgPct >= 1.0;

      return {
        ...emp,
        weekAverages,
        monthlyAvgPct,
        monthlyTotalHours,
        isTargetMet
      };
    });

    // Sort descending by monthlyAvgPct
    list.sort((a, b) => b.monthlyAvgPct - a.monthlyAvgPct);

    return list.map((emp, index) => ({
      ...emp,
      rank: index + 1
    }));
  }, [employees, workData]);

  // Overall Department Averages
  const departmentAverage = useMemo(() => {
    if (employeeRankings.length === 0) return { avgPct: 0, avgHours: 0 };
    const totalPct = employeeRankings.reduce((sum, e) => sum + e.monthlyAvgPct, 0);
    const totalHours = employeeRankings.reduce((sum, e) => sum + e.monthlyTotalHours, 0);
    return {
      avgPct: totalPct / employeeRankings.length,
      avgHours: totalHours / employeeRankings.length
    };
  }, [employeeRankings]);

  // Filtered employees in ranking view
  const filteredRankings = useMemo(() => {
    if (!filterQuery.trim()) return employeeRankings;
    const q = filterQuery.toLowerCase();
    return employeeRankings.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }, [employeeRankings, filterQuery]);

  // Handle adding an employee
  const handleAddEmployee = () => {
    const name = window.prompt("Enter new employee's full name:");
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (employees.some(e => e.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Employee already exists!");
      return;
    }
    const role = window.prompt("Enter employee role / title:", "Admissions Officer") || "Admissions Officer";
    const nextList = [...employees, { name: cleanName, role }];
    setEmployees(nextList);
    persistWorkData(workData, nextList);
    setActiveTab(cleanName);
  };

  // Render Employee Specific Sheet
  const renderEmployeeSheet = (empName) => {
    const emp = employees.find(e => e.name === empName) || { name: empName, role: 'Admissions Admin' };
    const empRanking = employeeRankings.find(e => e.name === empName) || { monthlyAvgPct: 0, monthlyTotalHours: 0, isTargetMet: false };

    return (
      <div className="employee-sheet-view">
        <div className="emp-meta-banner">
          <div className="emp-meta-left">
            <h2>{emp.name}</h2>
            <span>Role: <strong>{emp.role}</strong> | Standard Daily Shift: 6.0 Hours (360 Mins)</span>
          </div>
          <div className="emp-meta-stats">
            <div className="emp-meta-stat-item">
              <label>Monthly Average</label>
              <strong style={{ color: empRanking.isTargetMet ? '#10b981' : '#ef4444' }}>
                {(empRanking.monthlyAvgPct * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="emp-meta-stat-item">
              <label>Total Month Hours</label>
              <strong style={{ color: '#3b82f6' }}>{empRanking.monthlyTotalHours.toFixed(1)} hrs</strong>
            </div>
            <div className="emp-meta-stat-item">
              <label>Monthly Target Status</label>
              <span className={`status-badge ${empRanking.isTargetMet ? 'status-met' : 'status-below'}`}>
                {empRanking.isTargetMet ? 'Target Met (100%+)' : 'Below 100% Target'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Weeks of Detailed Daily Work Logs */}
        {WEEKS.map(week => {
          const weekSummary = calculateWeekSummary(emp.name, week);

          return (
            <div key={week} className="admin-table-card">
              <div className="admin-table-card-header">
                <h3>WEEK {week} - Daily Work Logs & Completion Rate</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Standard: 1,800 Mins (30.0 Hours)
                </span>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Day</th>
                      <th style={{ width: '100px' }}>CV (20 mins)</th>
                      <th style={{ width: '100px' }}>QA (20 mins)</th>
                      <th style={{ width: '110px' }}>Sub & QC (30m)</th>
                      <th>Miscellaneous Tasks Done</th>
                      <th style={{ width: '120px' }}>Misc Time (Mins)</th>
                      <th style={{ width: '120px' }}>Total Time</th>
                      <th style={{ width: '100px' }}>Total Hours</th>
                      <th style={{ width: '90px' }}>Shift</th>
                      <th style={{ width: '90px' }}>Daily %</th>
                      <th style={{ width: '120px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => {
                      const dayKey = `W${week}_${day}`;
                      const dayLog = (workData[emp.name] && workData[emp.name][dayKey]) || {};
                      const metrics = calculateDayMetrics(dayLog);

                      return (
                        <tr key={day}>
                          <td style={{ fontWeight: 600 }}>{day}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="table-input table-input-num"
                              value={dayLog.cv !== undefined ? dayLog.cv : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'cv', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="table-input table-input-num"
                              value={dayLog.qa !== undefined ? dayLog.qa : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'qa', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="table-input table-input-num"
                              value={dayLog.sub !== undefined ? dayLog.sub : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'sub', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="table-input"
                              placeholder="e.g. Manchester UCAS filing..."
                              value={dayLog.misc || ''}
                              onChange={e => handleCellChange(emp.name, week, day, 'misc', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="table-input table-input-num"
                              value={dayLog.miscM !== undefined ? dayLog.miscM : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'miscM', e.target.value)}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{metrics.totalMinutes} Mins</td>
                          <td style={{ fontWeight: 600 }}>{metrics.totalHours.toFixed(1)} hrs</td>
                          <td style={{ color: 'var(--text-secondary)' }}>360 Mins</td>
                          <td style={{ fontWeight: 700, color: metrics.isTargetMet ? '#10b981' : '#ef4444' }}>
                            {(metrics.dailyPct * 100).toFixed(0)}%
                          </td>
                          <td>
                            <span className={`status-badge ${metrics.isTargetMet ? 'status-met' : 'status-below'}`}>
                              {metrics.isTargetMet ? 'Target Met' : 'Below Target'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="week-summary-row">
                      <td colSpan="1">Week {week} Summary</td>
                      <td>{weekSummary.totalCV} CVs</td>
                      <td>{weekSummary.totalQA} QAs</td>
                      <td>{weekSummary.totalSub} Subs</td>
                      <td>Weekly Totals & Average:</td>
                      <td>{weekSummary.totalMiscM} Mins</td>
                      <td style={{ color: '#3b82f6' }}>{weekSummary.totalMinutes} Mins</td>
                      <td style={{ color: '#3b82f6' }}>{weekSummary.totalHours.toFixed(1)} hrs</td>
                      <td>1,800 Mins</td>
                      <td style={{ color: weekSummary.avgPct >= 1.0 ? '#10b981' : '#ef4444' }}>
                        {(weekSummary.avgPct * 100).toFixed(1)}%
                      </td>
                      <td>
                        <span className={`status-badge ${weekSummary.avgPct >= 1.0 ? 'status-met' : 'status-below'}`}>
                          {weekSummary.avgPct >= 1.0 ? 'Target Met' : 'Below Target'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-work-container">
      {/* Header Bar */}
      <div className="admin-work-header">
        <div className="admin-work-title">
          <h1>💼 Admin Work Tracker & Performance Ranking</h1>
          <p>Standard Daily Shift: 6.0 Hours (360 Mins) = 100% Target | Below 100% is Marked Alert in Red</p>
        </div>

        <div className="admin-work-controls">
          <div className="benchmark-badge">
            ⚡ Benchmarks: <strong>CV = 20m</strong> | <strong>QA = 20m</strong> | <strong>Sub & QC = 30m</strong>
          </div>

          <div className="save-indicator">
            <span style={{ fontSize: '1rem' }}>☁️</span> {saveStatus}
          </div>

          <button 
            className="btn-secondary" 
            onClick={handleAddEmployee}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="admin-work-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          🏆 Track & Performance Ranking
        </button>

        {employees.map(emp => (
          <button
            key={emp.name}
            className={`admin-tab-btn ${activeTab === emp.name ? 'active' : ''}`}
            onClick={() => setActiveTab(emp.name)}
          >
            👤 {emp.name}
          </button>
        ))}
      </div>

      {/* View 1: Master Ranking & Overview View */}
      {activeTab === 'ranking' && (
        <div className="ranking-view">
          {/* Top Ranked Cards */}
          <div className="ranking-grid">
            {employeeRankings.slice(0, 4).map((emp, idx) => (
              <div 
                key={emp.name} 
                className="ranking-card" 
                onClick={() => setActiveTab(emp.name)}
                style={{ cursor: 'pointer' }}
                title="Click to view full 4-week worksheet"
              >
                <div className={`ranking-rank-pill ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-default'}`}>
                  #{emp.rank}
                </div>
                <div className="ranking-name">{emp.name}</div>
                <div className="ranking-role">{emp.role}</div>

                <div className="ranking-score-box">
                  <div className="ranking-pct" style={{ color: emp.isTargetMet ? '#10b981' : '#ef4444' }}>
                    {(emp.monthlyAvgPct * 100).toFixed(1)}%
                  </div>
                  <span className={`status-badge ${emp.isTargetMet ? 'status-met' : 'status-below'}`}>
                    {emp.isTargetMet ? 'Target Met' : 'Below 100%'}
                  </span>
                </div>

                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, emp.monthlyAvgPct * 100)}%`,
                      backgroundColor: emp.isTargetMet ? '#10b981' : '#ef4444'
                    }} 
                  />
                </div>

                <div className="ranking-stats-footer">
                  <span>Monthly Hours: <strong>{emp.monthlyTotalHours.toFixed(1)} hrs</strong></span>
                  <span>Shift Base: <strong>120 hrs</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Master Ranking Table */}
          <div className="admin-table-card">
            <div className="admin-table-card-header">
              <h3>Admin Department Performance Ranking</h3>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Filter employee..."
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Rank</th>
                    <th>Admin Employee</th>
                    <th>Role</th>
                    <th style={{ width: '110px' }}>Week 1 Avg %</th>
                    <th style={{ width: '110px' }}>Week 2 Avg %</th>
                    <th style={{ width: '110px' }}>Week 3 Avg %</th>
                    <th style={{ width: '110px' }}>Week 4 Avg %</th>
                    <th style={{ width: '130px' }}>Monthly Avg %</th>
                    <th style={{ width: '140px' }}>Total Month Hours</th>
                    <th style={{ width: '150px' }}>Monthly Target Status</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map(emp => (
                    <tr key={emp.name}>
                      <td>
                        <span style={{ 
                          fontWeight: 800, 
                          color: emp.rank === 1 ? '#f59e0b' : emp.rank === 2 ? '#94a3b8' : emp.rank === 3 ? '#d97706' : 'var(--text-secondary)' 
                        }}>
                          #{emp.rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <button
                          onClick={() => setActiveTab(emp.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline'
                          }}
                        >
                          {emp.name}
                        </button>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{emp.role}</td>
                      <td>{(emp.weekAverages[0] * 100).toFixed(1)}%</td>
                      <td>{(emp.weekAverages[1] * 100).toFixed(1)}%</td>
                      <td>{(emp.weekAverages[2] * 100).toFixed(1)}%</td>
                      <td>{(emp.weekAverages[3] * 100).toFixed(1)}%</td>
                      <td style={{ fontWeight: 700, color: emp.isTargetMet ? '#10b981' : '#ef4444' }}>
                        {(emp.monthlyAvgPct * 100).toFixed(1)}%
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.monthlyTotalHours.toFixed(1)} hrs</td>
                      <td>
                        <span className={`status-badge ${emp.isTargetMet ? 'status-met' : 'status-below'}`}>
                          {emp.isTargetMet ? 'Target Met' : 'Below 100% Target'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setActiveTab(emp.name)}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          View Logs ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ fontWeight: 800 }}>AVG - Department Average</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td style={{ fontWeight: 800, color: departmentAverage.avgPct >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {(departmentAverage.avgPct * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontWeight: 800 }}>{departmentAverage.avgHours.toFixed(1)} hrs</td>
                    <td colSpan="2" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Ray Education Benchmark = 100% (120 hrs/mo)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Employee Specific Detailed Worksheet */}
      {activeTab !== 'ranking' && renderEmployeeSheet(activeTab)}
    </div>
  );
};

export default AdminWork;
