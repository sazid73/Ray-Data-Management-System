import { SUPABASE_URL, getHeaders, realtimeTracker } from './supabaseClient';
import { rawFetch } from './fetchInterceptor';

// Helper to handle standard REST requests
const req = async (path, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const fetcher = rawFetch || window.fetch;
  const res = await fetcher(url, {
    ...options,
    headers: getHeaders(options.headers || {})
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Supabase request failed: ${res.status} ${errorBody}`);
  }
  return res;
};

export const api = {
  // === GRID ===
  async getGrid() {
    const res = await req('/grid_cells?select=*');
    const rows = await res.json();
    const mapping = {};
    rows.forEach(r => {
      mapping[r.key] = {
        color: r.color,
        textColor: r.text_color,
        slots: r.slots || []
      };
    });
    return mapping;
  },

  async updateGridCell(key, cellData) {
    const payload = {
      key,
      color: cellData.color,
      text_color: cellData.textColor,
      slots: cellData.slots,
      updated_at: new Date().toISOString()
    };
    
    await req('/grid_cells', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload)
    });

    // Broadcast cell update to all connected peers
    realtimeTracker.emit('cell_updated', { key, cell: cellData });
    return { success: true };
  },

  async clearMonth(year, month, prefix) {
    const pattern = prefix ? `${prefix}-${year}-${month}-%` : `${year}-${month}-%`;
    await req(`/grid_cells?key=like.${encodeURIComponent(pattern)}`, {
      method: 'DELETE'
    });
    realtimeTracker.emit('month_cleared', { year, month });
    return { success: true };
  },

  // === USERS & AUTH ===
  async login(name, password) {
    const trimmed = name.trim();
    // Case-insensitive user lookup
    const res = await req(`/users?name=ilike.${encodeURIComponent(trimmed)}&select=*`);
    let users = await res.json();
    
    if (users.length === 0) {
      // Check if user is genesis admin
      const countRes = await req('/users?select=count');
      const countHeader = countRes.headers.get('content-range');
      const total = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
      
      if (total === 0 || trimmed.toLowerCase() === 'admin') {
        const newAdmin = {
          name: 'Admin',
          password,
          role: 'admin',
          job_titles: [],
          abilities: []
        };
        const createRes = await req('/users', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(newAdmin)
        });
        const created = await createRes.json();
        return {
          ...created[0],
          jobTitles: created[0].job_titles || [],
          abilities: created[0].abilities || [],
          shiftStart: created[0].shift_start || '',
          shiftEnd: created[0].shift_end || ''
        };
      }
      throw new Error('User does not exist. Ask the Admin to create an account for you.');
    }

    const user = users[0];
    if (!user.password) {
      await req(`/users?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ password })
      });
    } else if (user.password !== password) {
      throw new Error('Incorrect password');
    }

    return {
      _id: user.id,
      id: user.id,
      name: user.name,
      role: user.role,
      jobTitles: user.job_titles || [],
      abilities: user.abilities || [],
      presence: user.presence || 'working',
      shiftStart: user.shift_start || '',
      shiftEnd: user.shift_end || '',
      isWlBoard: user.is_wl_board || false
    };
  },

  async getUsers() {
    const res = await req('/users?select=*&order=name.asc');
    const rows = await res.json();
    return rows.map(u => ({
      _id: u.id,
      id: u.id,
      name: u.name,
      password: u.password,
      role: u.role,
      jobTitles: u.job_titles || [],
      abilities: u.abilities || [],
      presence: u.presence || 'working',
      shiftStart: u.shift_start || '',
      shiftEnd: u.shift_end || '',
      isWlBoard: u.is_wl_board || false
    }));
  },

  async createUser(userData) {
    const payload = {
      name: userData.name.trim(),
      password: userData.password,
      role: userData.role || 'standard',
      job_titles: userData.jobTitles || [],
      abilities: userData.abilities || []
    };
    const res = await req('/users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    return { success: true, user: created[0] };
  },

  async updateUserRole(name, { role, jobTitles, abilities }) {
    const payload = {};
    if (role !== undefined) payload.role = role;
    if (jobTitles !== undefined) payload.job_titles = jobTitles;
    if (abilities !== undefined) payload.abilities = abilities;

    const res = await req(`/users?name=eq.${encodeURIComponent(name)}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const rows = await res.json();
    return { success: true, user: rows[0] };
  },

  async updateUserProfile(name, fields) {
    const payload = {};
    if (fields.presence !== undefined) payload.presence = fields.presence;
    if (fields.shiftStart !== undefined) payload.shift_start = fields.shiftStart;
    if (fields.shiftEnd !== undefined) payload.shift_end = fields.shiftEnd;
    if (fields.isWlBoard !== undefined) payload.is_wl_board = fields.isWlBoard;

    const res = await req(`/users?name=eq.${encodeURIComponent(name)}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const rows = await res.json();
    return { success: true, user: rows[0] };
  },

  async updateUserPassword(name, password) {
    const res = await req(`/users?name=eq.${encodeURIComponent(name)}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ password })
    });
    const rows = await res.json();
    return { success: true, user: rows[0] };
  },

  async deleteUser(name) {
    await req(`/users?name=eq.${encodeURIComponent(name)}`, { method: 'DELETE' });
    return { success: true };
  },

  // === STUDENTS LEAD MANAGEMENT ===
  async getStudents() {
    const res = await req('/student_leads?select=*&order=id.desc');
    const rows = await res.json();
    return rows.map(r => ({
      _id: r.id,
      id: r.id,
      studentId: r.student_id,
      source: r.source,
      createdAt: r.created_at,
      modifiedAt: r.modified_at,
      session: r.session,
      name: r.name,
      email: r.email,
      mobile: r.mobile,
      courseAndCampus1: r.course_and_campus1,
      courseAndCampus2: r.course_and_campus2,
      refCompany: r.ref_company,
      route: r.route,
      routeNotes: r.route_notes,
      routeCompany: r.route_company,
      routeJobRole: r.route_job_role,
      routeQualification: r.route_qualification,
      routeCredits: r.route_credits,
      routeProvider: r.route_provider,
      routeWorkType: r.route_work_type,
      routeEduType: r.route_edu_type,
      routeHistory: r.route_history || [],
      intStatus: r.int_status,
      recruiter: r.recruiter,
      chaser: r.chaser,
      agent: r.agent,
      referral: r.referral || (r.extra_fields && r.extra_fields.referral) || '',
      residential: r.residential,
      location: r.location,
      appId: r.app_id,
      clTime: r.cl_time,
      submit: r.submit,
      docs: r.docs,
      statusType: r.status_type || 'white',
      appStatus: r.app_status || 'Awaiting submission',
      sfeStatus: r.sfe_status || 'Awaiting Trial SFE Approval',
      sfeStatusHistory: r.sfe_status_history || [],
      intStatusHistory: r.int_status_history || [],
      subPendingNotes: r.sub_pending_notes || '',
      appStatusHistory: r.app_status_history || [],
      recruiterHistory: r.recruiter_history || [],
      chaserHistory: r.chaser_history || [],
      chasers: r.chasers || { cv: '', ps: '', qa: '', sub: '' },
      tasksCompleted: (r.extra_fields && r.extra_fields.tasksCompleted) || {},
      isUrgent: (r.extra_fields && r.extra_fields.isUrgent) || false,
      prepTarget: (r.extra_fields && r.extra_fields.prepTarget) !== undefined ? r.extra_fields.prepTarget : (r.extra_fields && r.extra_fields.prepHistory ? r.extra_fields.prepHistory.length : 12),
      prepsDoneCount: (r.extra_fields && r.extra_fields.prepsDoneCount) !== undefined ? r.extra_fields.prepsDoneCount : ((r.extra_fields && r.extra_fields.prepHistory) || []).length,
      prepHistory: (r.extra_fields && r.extra_fields.prepHistory) || [],
      ...(r.extra_fields || {}),
      // Guarantee standard table columns take precedence over stale extra_fields
      _id: r.id,
      id: r.id,
      studentId: r.student_id,
      name: r.name,
      appStatus: r.app_status || 'Awaiting submission',
      intStatus: r.int_status,
      sfeStatus: r.sfe_status || 'Awaiting Trial SFE Approval',
      chasers: r.chasers || { cv: '', ps: '', qa: '', sub: '' },
      subPendingNotes: r.sub_pending_notes || ''
    }));
  },

  async createStudent(student) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let sId = student.studentId;
    if (!sId) {
      const countRes = await req('/student_leads?select=count');
      const countHeader = countRes.headers.get('content-range');
      const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
      sId = `#${9000 + count + 1}`;
    }

    const payload = {
      student_id: sId,
      source: student.source || 'manual entry',
      created_at: student.createdAt || today,
      modified_at: student.modifiedAt || today,
      session: student.session,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      course_and_campus1: student.courseAndCampus1,
      course_and_campus2: student.courseAndCampus2,
      ref_company: student.refCompany,
      route: student.route,
      route_notes: student.routeNotes,
      route_company: student.routeCompany,
      route_job_role: student.routeJobRole,
      route_qualification: student.routeQualification,
      route_credits: student.routeCredits,
      route_provider: student.routeProvider,
      route_work_type: student.routeWorkType,
      route_edu_type: student.routeEduType,
      route_history: student.routeHistory || [],
      int_status: student.intStatus,
      recruiter: student.recruiter,
      chaser: student.chaser,
      agent: student.agent,
      referral: student.referral,
      residential: student.residential,
      location: student.location,
      app_id: student.appId,
      cl_time: student.clTime,
      submit: student.submit,
      docs: student.docs,
      status_type: student.statusType || 'white',
      app_status: student.appStatus || 'Awaiting submission',
      sfe_status: student.sfeStatus || 'Awaiting Trial SFE Approval',
      sfe_status_history: student.sfeStatusHistory || [],
      int_status_history: student.intStatusHistory || [],
      sub_pending_notes: student.subPendingNotes || '',
      app_status_history: student.appStatusHistory || [],
      recruiter_history: student.recruiterHistory || [],
      chaser_history: student.chaserHistory || [],
      chasers: student.chasers || { cv: '', ps: '', qa: '', sub: '' },
      extra_fields: { ...student }
    };

    const res = await req('/student_leads', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    return { success: true, student: { ...created[0], _id: created[0].id } };
  },

  async updateStudent(id, fields) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const payload = { modified_at: today };

    if (fields.studentId !== undefined) payload.student_id = fields.studentId;
    if (fields.name !== undefined) payload.name = fields.name;
    if (fields.email !== undefined) payload.email = fields.email;
    if (fields.mobile !== undefined) payload.mobile = fields.mobile;
    if (fields.session !== undefined) payload.session = fields.session;
    if (fields.source !== undefined) payload.source = fields.source;
    if (fields.courseAndCampus1 !== undefined) payload.course_and_campus1 = fields.courseAndCampus1;
    if (fields.courseAndCampus2 !== undefined) payload.course_and_campus2 = fields.courseAndCampus2;
    if (fields.refCompany !== undefined) payload.ref_company = fields.refCompany;
    if (fields.route !== undefined) payload.route = fields.route;
    if (fields.routeNotes !== undefined) payload.route_notes = fields.routeNotes;
    if (fields.routeCompany !== undefined) payload.route_company = fields.routeCompany;
    if (fields.routeJobRole !== undefined) payload.route_job_role = fields.routeJobRole;
    if (fields.routeQualification !== undefined) payload.route_qualification = fields.routeQualification;
    if (fields.routeCredits !== undefined) payload.route_credits = fields.routeCredits;
    if (fields.routeProvider !== undefined) payload.route_provider = fields.routeProvider;
    if (fields.routeWorkType !== undefined) payload.route_work_type = fields.routeWorkType;
    if (fields.routeEduType !== undefined) payload.route_edu_type = fields.routeEduType;
    if (fields.routeHistory !== undefined) payload.route_history = fields.routeHistory;
    if (fields.intStatus !== undefined) payload.int_status = fields.intStatus;
    if (fields.recruiter !== undefined) payload.recruiter = fields.recruiter;
    if (fields.chaser !== undefined) payload.chaser = fields.chaser;
    if (fields.agent !== undefined) payload.agent = fields.agent;
    if (fields.referral !== undefined) payload.referral = fields.referral;
    if (fields.residential !== undefined) payload.residential = fields.residential;
    if (fields.location !== undefined) payload.location = fields.location;
    if (fields.appId !== undefined) payload.app_id = fields.appId;
    if (fields.clTime !== undefined) payload.cl_time = fields.clTime;
    if (fields.submit !== undefined) payload.submit = fields.submit;
    if (fields.docs !== undefined) payload.docs = fields.docs;
    if (fields.statusType !== undefined) payload.status_type = fields.statusType;
    if (fields.appStatus !== undefined) payload.app_status = fields.appStatus;
    if (fields.sfeStatus !== undefined) payload.sfe_status = fields.sfeStatus;
    if (fields.sfeStatusHistory !== undefined) payload.sfe_status_history = fields.sfeStatusHistory;
    if (fields.intStatusHistory !== undefined) payload.int_status_history = fields.intStatusHistory;
    if (fields.subPendingNotes !== undefined) payload.sub_pending_notes = fields.subPendingNotes;
    if (fields.appStatusHistory !== undefined) payload.app_status_history = fields.appStatusHistory;
    if (fields.recruiterHistory !== undefined) payload.recruiter_history = fields.recruiterHistory;
    if (fields.chaserHistory !== undefined) payload.chaser_history = fields.chaserHistory;
    if (fields.chasers !== undefined) payload.chasers = fields.chasers;

    // Fetch existing extra_fields to merge tasksCompleted / isUrgent / prep tracking fields
    const extraFieldsToSync = ['tasksCompleted', 'isUrgent', 'chasersAssignedAt', 'prepTarget', 'prepsDoneCount', 'prepHistory', 'referral', 'agent'];
    const hasExtraUpdates = extraFieldsToSync.some(k => fields[k] !== undefined);

    if (hasExtraUpdates) {
      try {
        const curRes = await req(`/student_leads?id=eq.${id}&select=extra_fields`);
        const curData = await curRes.json();
        const existingExtra = (curData[0] && curData[0].extra_fields) || {};
        const extraUpdates = {};
        extraFieldsToSync.forEach(k => {
          if (fields[k] !== undefined) extraUpdates[k] = fields[k];
        });
        payload.extra_fields = {
          ...existingExtra,
          ...extraUpdates
        };
      } catch (err) {
        console.warn("Could not merge extra_fields", err);
      }
    }

    const res = await req(`/student_leads?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    const upDoc = updated[0] || {};
    return {
      success: true,
      student: {
        ...upDoc,
        _id: upDoc.id,
        id: upDoc.id,
        studentId: upDoc.student_id,
        appStatus: upDoc.app_status,
        intStatus: upDoc.int_status,
        chasers: upDoc.chasers,
        subPendingNotes: upDoc.sub_pending_notes,
        tasksCompleted: (upDoc.extra_fields && upDoc.extra_fields.tasksCompleted) || fields.tasksCompleted || {},
        prepTarget: (upDoc.extra_fields && upDoc.extra_fields.prepTarget) !== undefined ? upDoc.extra_fields.prepTarget : fields.prepTarget,
        prepsDoneCount: (upDoc.extra_fields && upDoc.extra_fields.prepsDoneCount) !== undefined ? upDoc.extra_fields.prepsDoneCount : fields.prepsDoneCount,
        prepHistory: (upDoc.extra_fields && upDoc.extra_fields.prepHistory) || fields.prepHistory || []
      }
    };
  },

  // === TASKS & WEEKLY WL ===
  async getTasks() {
    const res = await req('/tasks?select=*&order=created_at.desc');
    const rows = await res.json();
    return rows.map(t => ({
      _id: t.id,
      id: t.id,
      day: t.day,
      shift: t.shift,
      leadNum: t.lead_num,
      assignedTo: t.assigned_to,
      assignedBy: t.assigned_by,
      taskType: t.task_type,
      status: t.status,
      startDateAndTime: t.start_date_and_time,
      endTime: t.end_time,
      notes: t.notes,
      createdAt: t.created_at
    }));
  },

  async createTask(task) {
    const payload = {
      day: task.day,
      shift: task.shift || 'DAY TIME',
      lead_num: task.leadNum,
      assigned_to: task.assignedTo,
      assigned_by: task.assignedBy,
      task_type: task.taskType || 'Call',
      status: task.status || 'pending',
      start_date_and_time: task.startDateAndTime,
      end_time: task.endTime,
      notes: task.notes
    };
    const res = await req('/tasks', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    return { success: true, task: { ...created[0], _id: created[0].id } };
  },

  async bulkCreateTasks(tasks) {
    const payload = tasks.map(task => ({
      day: task.day,
      shift: task.shift || 'DAY TIME',
      lead_num: task.leadNum,
      assigned_to: task.assignedTo,
      assigned_by: task.assignedBy,
      task_type: task.taskType || 'Call',
      status: task.status || 'pending',
      start_date_and_time: task.startDateAndTime,
      end_time: task.endTime,
      notes: task.notes
    }));
    const res = await req('/tasks', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    return { success: true, tasks: created.map(c => ({ ...c, _id: c.id })) };
  },

  async updateTask(id, fields) {
    const payload = {};
    if (fields.day !== undefined) payload.day = fields.day;
    if (fields.shift !== undefined) payload.shift = fields.shift;
    if (fields.leadNum !== undefined) payload.lead_num = fields.leadNum;
    if (fields.assignedTo !== undefined) payload.assigned_to = fields.assignedTo;
    if (fields.assignedBy !== undefined) payload.assigned_by = fields.assignedBy;
    if (fields.taskType !== undefined) payload.task_type = fields.taskType;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.startDateAndTime !== undefined) payload.start_date_and_time = fields.startDateAndTime;
    if (fields.endTime !== undefined) payload.end_time = fields.endTime;
    if (fields.notes !== undefined) payload.notes = fields.notes;

    const res = await req(`/tasks?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    return { success: true, task: { ...updated[0], _id: updated[0].id } };
  },

  async deleteTask(id) {
    await req(`/tasks?id=eq.${id}`, { method: 'DELETE' });
    return { success: true };
  },

  // === INTERVIEWS ===
  async getInterviews() {
    const res = await req('/interviews?select=*&order=date.asc');
    const rows = await res.json();
    return rows.map(i => ({
      _id: i.id,
      id: i.id,
      intake: i.intake,
      date: i.date,
      studentName: i.student_name,
      status: i.status,
      college: i.college,
      subject: i.subject,
      pendingAction: i.pending_action,
      comments: i.comments,
      recruiter: i.recruiter
    }));
  },

  async createInterview(interview) {
    const payload = {
      intake: interview.intake || 'May 26',
      date: interview.date,
      student_name: interview.studentName,
      status: interview.status || 'pending',
      college: interview.college,
      subject: interview.subject,
      pending_action: interview.pendingAction,
      comments: interview.comments,
      recruiter: interview.recruiter
    };
    const res = await req('/interviews', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    return { success: true, interview: { ...created[0], _id: created[0].id } };
  },

  async updateInterview(id, fields) {
    const payload = {};
    if (fields.intake !== undefined) payload.intake = fields.intake;
    if (fields.date !== undefined) payload.date = fields.date;
    if (fields.studentName !== undefined) payload.student_name = fields.studentName;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.college !== undefined) payload.college = fields.college;
    if (fields.subject !== undefined) payload.subject = fields.subject;
    if (fields.pendingAction !== undefined) payload.pending_action = fields.pendingAction;
    if (fields.comments !== undefined) payload.comments = fields.comments;
    if (fields.recruiter !== undefined) payload.recruiter = fields.recruiter;

    const res = await req(`/interviews?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    return { success: true, interview: { ...updated[0], _id: updated[0].id } };
  },

  async deleteInterview(id) {
    await req(`/interviews?id=eq.${id}`, { method: 'DELETE' });
    return { success: true };
  },

  // === TARGETS ===
  async getTargets() {
    const res = await req('/targets?select=*');
    const rows = await res.json();
    return rows.map(t => ({
      _id: t.id,
      id: t.id,
      college: t.college,
      intake: t.intake,
      target: t.target,
      isActive: t.is_active
    }));
  },

  async updateTarget({ college, intake, target, isActive }) {
    const payload = { college, intake };
    if (target !== undefined) payload.target = target;
    if (isActive !== undefined) payload.is_active = isActive;

    const res = await req('/targets', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });
    const rows = await res.json();
    return { success: true, target: rows[0] };
  },

  // === ACTIVITY LOGS ===
  async getLogs() {
    const res = await req('/activity_logs?select=*&order=id.desc&limit=200');
    const rows = await res.json();
    return rows.map(l => ({
      _id: l.id,
      id: l.id,
      timestamp: l.timestamp,
      user: l.user_name,
      action: l.action,
      details: l.details
    }));
  },

  async logActivity({ timestamp, user, action, details }) {
    const payload = {
      timestamp: timestamp || new Date().toLocaleString(),
      user_name: user,
      action,
      details
    };
    await req('/activity_logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return { success: true, message: 'Log created' };
  },

  // === HISTORY ===
  async getHistory(cellKey, slotIndex) {
    const res = await req(`/cell_history?cell_key=eq.${encodeURIComponent(cellKey)}&slot_index=eq.${slotIndex}&select=*&order=id.desc`);
    const rows = await res.json();
    return rows.map(h => ({
      _id: h.id,
      id: h.id,
      cellKey: h.cell_key,
      slotIndex: h.slot_index,
      user: h.user_name,
      timestamp: h.timestamp,
      oldText: h.old_text,
      newText: h.new_text
    }));
  },

  async createHistory({ cellKey, slotIndex, user, timestamp, oldText, newText }) {
    const payload = {
      cell_key: cellKey,
      slot_index: slotIndex,
      user_name: user,
      timestamp,
      old_text: oldText,
      new_text: newText
    };
    await req('/cell_history', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return { success: true };
  },

  // === ADMIN WORK TRACKER ===
  async getAdminWorkData() {
    try {
      const res = await req('/grid_cells?key=like.ADMIN_WORK_%25&select=*');
      const rows = await res.json();
      const records = {};
      rows.forEach(r => {
        // key format: ADMIN_WORK_DATA_Fatima Khan or ADMIN_WORK_MONTH_2026-05
        const id = r.key.replace(/^ADMIN_WORK_/, '');
        records[id] = r.slots && r.slots[0] && r.slots[0].text ? JSON.parse(r.slots[0].text) : (r.slots || []);
      });
      return records;
    } catch (e) {
      console.warn("Failed to get admin work data", e);
      return {};
    }
  },

  async saveAdminWorkData(id, data) {
    try {
      const key = `ADMIN_WORK_${id}`;
      const payload = {
        key,
        color: 'ADMIN_WORK',
        text_color: 'ACTIVE',
        slots: [{ text: JSON.stringify(data), status: 'ok', employeeDoneBy: 'Admin' }],
        updated_at: new Date().toISOString()
      };
      await req('/grid_cells', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (e) {
      console.error("Failed to save admin work data", e);
      return { success: false, error: e.message };
    }
  },

  async logDmsTaskCompletion({ employeeName, taskType, studentName, durationMinutes, remarks }) {
    if (!employeeName) return;
    try {
      const now = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthKey = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      
      const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ... 5 is Friday
      const dayNames = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Friday'];
      const dayName = dayNames[dayIndex] || 'Monday';

      // Determine week of month (1 to 4)
      const dayOfMonth = now.getDate();
      const weekNum = Math.min(4, Math.max(1, Math.ceil(dayOfMonth / 7)));
      const cellKey = `W${weekNum}_${dayName}`;

      const allData = await this.getAdminWorkData();
      const monthLogs = allData[`WORK_LOGS_${monthKey}`] || {};
      const empLogs = monthLogs[employeeName] || {};
      const dayLog = empLogs[cellKey] || { cv: 0, ps: 0, qa: 0, sub: 0, misc: '', miscM: 0, remarksList: [] };

      // Increment count according to taskType ('cv', 'qa', 'sub', 'ps')
      if (taskType === 'cv') dayLog.cv = (Number(dayLog.cv) || 0) + 1;
      else if (taskType === 'ps') dayLog.ps = (Number(dayLog.ps) || 0) + 1;
      else if (taskType === 'qa') dayLog.qa = (Number(dayLog.qa) || 0) + 1;
      else if (taskType === 'sub') dayLog.sub = (Number(dayLog.sub) || 0) + 1;

      // Remarks for task performance
      if (remarks) {
        if (!dayLog.remarksList) dayLog.remarksList = [];
        if (typeof remarks === 'object') {
          dayLog.remarksList.push(remarks);
        } else {
          const isWarn = remarks.toLowerCase().includes('over benchmark') || (remarks.toLowerCase().includes('took') && !remarks.toLowerCase().includes('within benchmark'));
          dayLog.remarksList.push({ text: remarks, type: isWarn ? 'warn' : 'good' });
        }
      }

      empLogs[cellKey] = dayLog;
      monthLogs[employeeName] = empLogs;

      await this.saveAdminWorkData(`WORK_LOGS_${monthKey}`, monthLogs);
      // Also broadcast real-time event
      realtimeTracker.emit('admin_work_updated', { monthKey, employeeName, cellKey });
      return { success: true };
    } catch (e) {
      console.warn("Failed to log task into admin work tracker", e);
      return { success: false };
    }
  }
};
