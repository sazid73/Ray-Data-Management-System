import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from './api';
import './AdminWork.css';

const BENCHMARKS = {
  cv: 20,    // 20 mins per CV
  ps: 20,    // 20 mins per PS
  qa: 20,    // 20 mins per QA
  sub: 30,   // 30 mins per Sub & QC
  dailyShiftMinutes: 360 // 6.0 Hours
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKS = [1, 2, 3, 4];

// Presets for Admin Officer Miscellaneous tasks
const ADMIN_MISC_TASKS = [
  { label: 'Dms update (status+Docs+Notes)', defaultM: 20 },
  { label: 'Qualification sheet', defaultM: 20 },
  { label: 'PAL Form', defaultM: 15 },
  { label: 'Consent Form', defaultM: 15 },
  { label: 'PS (AI Check & Plagiarism Check) (30-35m)', defaultM: 35 },
  { label: 'Pre task exam (1 hr)', defaultM: 60 },
  { label: 'Work ref form + Letter', defaultM: 20 },
  { label: 'Prepare Sheets (Sampling + Enrolled students Update)', defaultM: 30 },
  { label: 'Email Check (Info + Admin)', defaultM: 30 },
  { label: 'Interview book', defaultM: 15 },
  { label: 'Pre Task QA (AI & Plag Check) (30-35m)', defaultM: 35 },
  { label: 'Revise docs (15-20m)', defaultM: 20 },
  { label: 'Call and gap report (40m)', defaultM: 40 },
  { label: 'Reminder call report (Email & whatsapp text) (1.5-2 hr)', defaultM: 100 },
  { label: 'Bonline check (5-15m)', defaultM: 15 },
  { label: 'Prep & missing doc report (15-20m)', defaultM: 20 }
];

// Presets for College Coordinator Miscellaneous tasks
const COORDINATOR_MISC_TASKS = [
  { label: '1. Clg groups check, reply, followup', defaultM: 30 },
  { label: '2. Live sheet check & followup', defaultM: 30 },
  { label: '3. Mails check', defaultM: 30 },
  { label: '4. Interview bookings', defaultM: 20 },
  { label: '5. Portal check', defaultM: 20 },
  { label: '6. Issue solving - text and calls', defaultM: 40 },
  { label: '7. Chase students (if necessary)', defaultM: 30 },
  { label: '8. Pass, fail, resit - updates and notes', defaultM: 30 },
  { label: '9. College pipeline meeting', defaultM: 60 },
  { label: '10. College regular update meeting with team', defaultM: 45 },
  { label: '11. Submission, qc, Documents upload', defaultM: 40 },
  { label: '12. Offer, enrollment, sfe issue solve', defaultM: 45 },
  { label: '13. Docs check & approve', defaultM: 30 }
];

// Generate list of available months (last 6 months to next 6 months)
const generateMonthsList = () => {
  const list = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    list.push(key);
  }
  return list;
};

// Helper to calculate exact calendar date for a given week (1-4) and day of week
const getDateForDay = (monthKey, week, day) => {
  if (!monthKey) return '';
  try {
    const parts = monthKey.split(' ');
    if (parts.length !== 2) return '';
    const mStr = parts[0];
    const yStr = parts[1];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIndex = monthNames.indexOf(mStr);
    const year = parseInt(yStr, 10);
    if (mIndex === -1 || isNaN(year)) return '';

    const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
    const targetDayIndex = dayMap[day];
    if (!targetDayIndex) return '';

    // Find the 1st day of the month
    const firstDay = new Date(year, mIndex, 1);
    // Find the first Monday on or after the 1st
    // JavaScript day: 0=Sun, 1=Mon, ..., 6=Sat
    let firstMondayDate = 1;
    const firstDayOfWeek = firstDay.getDay(); // 0-6
    if (firstDayOfWeek === 1) {
      firstMondayDate = 1;
    } else if (firstDayOfWeek === 0) {
      firstMondayDate = 2; // Next day is Monday
    } else {
      firstMondayDate = 1 + (8 - firstDayOfWeek); // Distance to next Monday
    }

    // Week 1 starts at firstMondayDate, Week 2 is +7, Week 3 is +14, Week 4 is +21
    const weekOffset = (week - 1) * 7;
    const dayOffset = targetDayIndex - 1; // 0 for Mon, 1 for Tue, etc.
    const calculatedDayNumber = firstMondayDate + weekOffset + dayOffset;

    const calcDate = new Date(year, mIndex, calculatedDayNumber);
    const dayNumFormatted = String(calcDate.getDate()).padStart(2, '0');
    const calcMonthStr = monthNames[calcDate.getMonth()];
    return `${dayNumFormatted} ${calcMonthStr}`;
  } catch (e) {
    return '';
  }
};

const AVAILABLE_MONTHS = generateMonthsList();

const AdminWork = ({ currentUserRole, currentUser, currentUserData }) => {
  const currentMonthName = useMemo(() => {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | employeeName
  const [employees, setEmployees] = useState([]);
  const [workData, setWorkData] = useState({});
  const [saveStatus, setSaveStatus] = useState('Saved to Cloud');
  const [filterQuery, setFilterQuery] = useState('');

  const saveTimeoutRef = useRef(null);

  // Check if current user has super_admin permission
  const isSuperAdmin = useMemo(() => {
    return currentUserRole === 'super_admin' || 
           currentUserRole === 'admin' || 
           (currentUserData?.abilities && currentUserData.abilities.includes('super_admin'));
  }, [currentUserRole, currentUserData]);

  // 1. Fetch real Admin Officers & College Coordinators from Supabase Users
  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const users = await api.getUsers();
        // Keep users who have the job title 'Admin Officer' or 'College Coordinator'
        const relevantEmployees = users.filter(u => {
          const titles = (u.jobTitles || []).map(t => (t || '').toLowerCase().trim());
          return titles.includes('admin officer') || titles.includes('college coordinator');
        }).map(u => {
          const titles = (u.jobTitles || []).map(t => (t || '').toLowerCase().trim());
          const isCoordinator = titles.includes('college coordinator');
          return {
            name: u.name,
            role: isCoordinator ? 'College Coordinator' : 'Admin Officer',
            isCoordinator
          };
        });

        setEmployees(relevantEmployees);
      } catch (err) {
        console.error('Failed to load users for Admin Work', err);
      }
    };
    loadOfficers();
  }, []);

  // 2. Fetch Work Logs for the selected month
  const fetchMonthLogs = async (monthKey) => {
    try {
      const stored = await api.getAdminWorkData();
      const monthData = stored[`WORK_LOGS_${monthKey}`] || {};
      setWorkData(monthData);
    } catch (err) {
      console.warn('Failed to load month work logs', err);
      setWorkData({});
    }
  };

  useEffect(() => {
    fetchMonthLogs(selectedMonth);
  }, [selectedMonth]);

  // 3. Debounced save to Supabase
  const persistWorkData = (newWorkData, monthKey = selectedMonth) => {
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveAdminWorkData(`WORK_LOGS_${monthKey}`, newWorkData);
        setSaveStatus('All Changes Saved');
      } catch (err) {
        console.error('Failed to sync admin work data:', err);
        setSaveStatus('Save Failed');
      }
    }, 800);
  };

  // Determine if active user can edit this employee's row
  const canEditEmployee = (empName) => {
    if (isSuperAdmin) return true;
    return currentUser && currentUser.toLowerCase() === empName.toLowerCase();
  };

  const handleAddMiscTask = (empName, week, day, taskLabel, taskMinutes, field = 'misc', timeField = 'miscM') => {
    if (!canEditEmployee(empName)) return;

    const key = `W${week}_${day}`;
    setWorkData(prev => {
      const empData = { ...(prev[empName] || {}) };
      const dayData = { ...(empData[key] || { cv: 0, ps: 0, qa: 0, sub: 0, misc: '', miscM: 0, coordMisc: '', coordMiscM: 0, remarksList: [] }) };

      const currentText = dayData[field] || '';
      const newText = currentText ? `${currentText}; ${taskLabel}` : taskLabel;
      dayData[field] = newText;
      dayData[timeField] = (Number(dayData[timeField]) || 0) + (Number(taskMinutes) || 0);

      empData[key] = dayData;
      const next = { ...prev, [empName]: empData };
      persistWorkData(next, selectedMonth);
      return next;
    });
  };

  const handleCellChange = (empName, week, day, field, value) => {
    if (!canEditEmployee(empName)) return;

    const key = `W${week}_${day}`;
    setWorkData(prev => {
      const empData = { ...(prev[empName] || {}) };
      const dayData = { ...(empData[key] || { cv: 0, ps: 0, qa: 0, sub: 0, misc: '', miscM: 0, coordMisc: '', coordMiscM: 0, remarksList: [] }) };

      if (field === 'misc' || field === 'coordMisc') {
        dayData[field] = value;
      } else {
        dayData[field] = Math.max(0, parseInt(value) || 0);
      }

      empData[key] = dayData;
      const next = { ...prev, [empName]: empData };
      persistWorkData(next, selectedMonth);
      return next;
    });
  };

  // Helper to compute metrics for a single day
  const calculateDayMetrics = (dayLog = {}) => {
    const cv = Number(dayLog.cv) || 0;
    const ps = Number(dayLog.ps) || 0;
    const qa = Number(dayLog.qa) || 0;
    const sub = Number(dayLog.sub) || 0;
    const miscM = Number(dayLog.miscM) || 0;
    const coordMiscM = Number(dayLog.coordMiscM) || 0;

    const totalMinutes = (cv * BENCHMARKS.cv) + (ps * BENCHMARKS.ps) + (qa * BENCHMARKS.qa) + (sub * BENCHMARKS.sub) + miscM + coordMiscM;
    const totalHours = totalMinutes / 60;
    const dailyPct = BENCHMARKS.dailyShiftMinutes > 0 ? (totalMinutes / BENCHMARKS.dailyShiftMinutes) : 0;
    const isTargetMet = dailyPct >= 1.0;

    return {
      cv, ps, qa, sub, miscM, coordMiscM,
      totalMinutes,
      totalHours,
      dailyPct,
      isTargetMet,
      remarksList: dayLog.remarksList || []
    };
  };

  // Helper to compute weekly stats for an employee
  const calculateWeekSummary = (empName, week) => {
    const empData = workData[empName] || {};
    let totalCV = 0, totalPS = 0, totalQA = 0, totalSub = 0, totalMiscM = 0, totalCoordMiscM = 0;
    let totalMinutes = 0;
    let daysLogged = 0;

    DAYS.forEach(day => {
      const metrics = calculateDayMetrics(empData[`W${week}_${day}`]);
      totalCV += metrics.cv;
      totalPS += metrics.ps;
      totalQA += metrics.qa;
      totalSub += metrics.sub;
      totalMiscM += metrics.miscM;
      totalCoordMiscM += metrics.coordMiscM;
      totalMinutes += metrics.totalMinutes;
      if (metrics.totalMinutes > 0) daysLogged++;
    });

    const shiftTotalMins = DAYS.length * BENCHMARKS.dailyShiftMinutes; // 1800 mins
    const avgPct = shiftTotalMins > 0 ? (totalMinutes / shiftTotalMins) : 0;
    const totalHours = totalMinutes / 60;

    return {
      totalCV,
      totalPS,
      totalQA,
      totalSub,
      totalMiscM,
      totalCoordMiscM,
      totalMinutes,
      totalHours,
      avgPct,
      daysLogged
    };
  };

  // Monthly rankings for the selected month
  const employeeRankings = useMemo(() => {
    const list = employees.map(emp => {
      let monthTotalMins = 0;
      const weekAverages = [];

      WEEKS.forEach(w => {
        const wSum = calculateWeekSummary(emp.name, w);
        monthTotalMins += wSum.totalMinutes;
        weekAverages.push(wSum.avgPct);
      });

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

  const filteredRankings = useMemo(() => {
    if (!filterQuery.trim()) return employeeRankings;
    const q = filterQuery.toLowerCase();
    return employeeRankings.filter(e => e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q)));
  }, [employeeRankings, filterQuery]);

  // Render Employee Specific Sheet
  const renderEmployeeSheet = (empName) => {
    const emp = employees.find(e => e.name === empName) || { name: empName, role: 'Admin Officer' };
    const empRanking = employeeRankings.find(e => e.name === empName) || { monthlyAvgPct: 0, monthlyTotalHours: 0, isTargetMet: false };
    const editable = canEditEmployee(empName);

    return (
      <div className="employee-sheet-view">
        <div className="emp-meta-banner">
          <div className="emp-meta-left">
            <h2>{emp.name}</h2>
            <span>
              Role: <strong>{emp.role}</strong> | Month: <strong>{selectedMonth}</strong> | Standard Daily Shift: 6.0 Hours (360 Mins)
              {!editable && <span style={{ marginLeft: '1rem', color: '#f59e0b', fontWeight: 600 }}>(Read-Only Mode)</span>}
            </span>
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
                <h3>WEEK {week} - Daily Work Logs & Completion Rate ({selectedMonth})</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Shift Target: 1,800 Mins (30.0 Hours)
                </span>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '95px' }}>Day</th>
                      <th style={{ width: '75px' }}>CV (20m)</th>
                      <th style={{ width: '75px' }}>PS (20m)</th>
                      <th style={{ width: '75px' }}>QA (20m)</th>
                      <th style={{ width: '90px' }}>Sub & QC (30m)</th>
                      <th>Admin Extra / Miscellaneous Work</th>
                      <th style={{ width: '90px' }}>Misc (M)</th>
                      {emp.isCoordinator && (
                        <>
                          <th style={{ background: 'rgba(139, 92, 246, 0.08)' }}>College Coordinator Extra Tasks</th>
                          <th style={{ width: '95px', background: 'rgba(139, 92, 246, 0.08)' }}>Coord (M)</th>
                        </>
                      )}
                      <th style={{ width: '100px' }}>Total Time</th>
                      <th style={{ width: '85px' }}>Total Hours</th>
                      <th style={{ width: '75px' }}>Shift</th>
                      <th style={{ width: '75px' }}>Daily %</th>
                      <th style={{ width: '135px' }}>Status & Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => {
                      const dayKey = `W${week}_${day}`;
                      const dayLog = (workData[emp.name] && workData[emp.name][dayKey]) || {};
                      const metrics = calculateDayMetrics(dayLog);
                      const formattedDate = getDateForDay(selectedMonth, week, day);

                      return (
                        <tr key={day}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <div>{day}</div>
                            {formattedDate && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                {formattedDate}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              disabled={!editable}
                              className="table-input table-input-num"
                              value={dayLog.cv !== undefined ? dayLog.cv : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'cv', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              disabled={!editable}
                              className="table-input table-input-num"
                              value={dayLog.ps !== undefined ? dayLog.ps : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'ps', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              disabled={!editable}
                              className="table-input table-input-num"
                              value={dayLog.qa !== undefined ? dayLog.qa : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'qa', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              disabled={!editable}
                              className="table-input table-input-num"
                              value={dayLog.sub !== undefined ? dayLog.sub : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'sub', e.target.value)}
                            />
                          </td>
                          {/* Admin Officer Miscellaneous Column */}
                          <td>
                            <div className="misc-cell-container">
                              {editable && (
                                <select
                                  className="misc-quick-dropdown"
                                  value=""
                                  onChange={e => {
                                    if (!e.target.value) return;
                                    const opt = ADMIN_MISC_TASKS.find(t => t.label === e.target.value);
                                    if (opt) {
                                      handleAddMiscTask(emp.name, week, day, opt.label, opt.defaultM, 'misc', 'miscM');
                                    }
                                  }}
                                >
                                  <option value="">➕ Select / Add Admin Misc Task...</option>
                                  {ADMIN_MISC_TASKS.map((t, idx) => (
                                    <option key={idx} value={t.label}>
                                      {t.label} (+{t.defaultM}m)
                                    </option>
                                  ))}
                                </select>
                              )}
                              <textarea
                                rows={2}
                                disabled={!editable}
                                className="table-textarea-misc"
                                placeholder="Extra tasks & times during shift (meetings, training, custom work)..."
                                value={dayLog.misc || ''}
                                onChange={e => handleCellChange(emp.name, week, day, 'misc', e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              disabled={!editable}
                              className="table-input table-input-num"
                              value={dayLog.miscM !== undefined ? dayLog.miscM : 0}
                              onChange={e => handleCellChange(emp.name, week, day, 'miscM', e.target.value)}
                            />
                          </td>

                          {/* Extra Column for College Coordinator */}
                          {emp.isCoordinator && (
                            <>
                              <td style={{ background: 'rgba(139, 92, 246, 0.03)' }}>
                                <div className="misc-cell-container">
                                  {editable && (
                                    <select
                                      className="misc-quick-dropdown"
                                      value=""
                                      onChange={e => {
                                        if (!e.target.value) return;
                                        const opt = COORDINATOR_MISC_TASKS.find(t => t.label === e.target.value);
                                        if (opt) {
                                          handleAddMiscTask(emp.name, week, day, opt.label, opt.defaultM, 'coordMisc', 'coordMiscM');
                                        }
                                      }}
                                    >
                                      <option value="">➕ Select Coordinator Task...</option>
                                      {COORDINATOR_MISC_TASKS.map((t, idx) => (
                                        <option key={idx} value={t.label}>
                                          {t.label} (+{t.defaultM}m)
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <textarea
                                    rows={2}
                                    disabled={!editable}
                                    className="table-textarea-misc"
                                    placeholder="College Coordinator extra tasks & notes..."
                                    value={dayLog.coordMisc || ''}
                                    onChange={e => handleCellChange(emp.name, week, day, 'coordMisc', e.target.value)}
                                  />
                                </div>
                              </td>
                              <td style={{ background: 'rgba(139, 92, 246, 0.03)' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!editable}
                                  className="table-input table-input-num"
                                  value={dayLog.coordMiscM !== undefined ? dayLog.coordMiscM : 0}
                                  onChange={e => handleCellChange(emp.name, week, day, 'coordMiscM', e.target.value)}
                                />
                              </td>
                            </>
                          )}

                          <td style={{ fontWeight: 600 }}>{metrics.totalMinutes} Mins</td>
                          <td style={{ fontWeight: 600 }}>{metrics.totalHours.toFixed(1)} hrs</td>
                          <td style={{ color: 'var(--text-secondary)' }}>360 Mins</td>
                          <td style={{ fontWeight: 700, color: metrics.isTargetMet ? '#10b981' : '#ef4444' }}>
                            {(metrics.dailyPct * 100).toFixed(0)}%
                          </td>
                          <td>
                            <div>
                              <span className={`status-badge ${metrics.isTargetMet ? 'status-met' : 'status-below'}`}>
                                {metrics.isTargetMet ? 'Target Met' : 'Below Target'}
                              </span>
                            </div>
                            {metrics.remarksList && metrics.remarksList.length > 0 && (
                              <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {metrics.remarksList.map((rem, rIdx) => {
                                  const text = typeof rem === 'object' ? rem.text : rem;
                                  const type = typeof rem === 'object' ? rem.type : (text.toLowerCase().includes('over benchmark') || (text.toLowerCase().includes('took') && !text.toLowerCase().includes('within benchmark')) ? 'warn' : 'good');
                                  const isWarn = type === 'warn';
                                  return (
                                    <span 
                                      key={rIdx} 
                                      className={`remarks-pill ${isWarn ? 'remarks-pill-warn' : 'remarks-pill-good'}`} 
                                      title={text}
                                    >
                                      {isWarn ? '⚠️' : '✅'} {text}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="week-summary-row">
                      <td colSpan="1">Week {week} Summary</td>
                      <td>{weekSummary.totalCV} CVs</td>
                      <td>{weekSummary.totalPS} PSs</td>
                      <td>{weekSummary.totalQA} QAs</td>
                      <td>{weekSummary.totalSub} Subs</td>
                      <td>Weekly Totals & Average:</td>
                      <td>{weekSummary.totalMiscM} Mins</td>
                      {emp.isCoordinator && (
                        <>
                          <td>Coord Total:</td>
                          <td>{weekSummary.totalCoordMiscM} Mins</td>
                        </>
                      )}
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
          {/* Month Filter */}
          <div className="month-selector">
            <span style={{ fontSize: '1rem' }}>📅</span>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {AVAILABLE_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="benchmark-badge">
            ⚡ Benchmarks: <strong>CV = 20m</strong> | <strong>QA = 20m</strong> | <strong>Sub & QC = 30m</strong> | <strong>PS = 20m</strong>
          </div>

          <div className="save-indicator">
            <span style={{ fontSize: '1rem' }}>☁️</span> {saveStatus}
          </div>
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
            👤 {emp.name} {emp.isCoordinator && <span className="coordinator-badge" style={{ marginLeft: '0.4rem' }}>Coordinator</span>}
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
              <h3>Admin Department Performance Ranking — {selectedMonth}</h3>
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
