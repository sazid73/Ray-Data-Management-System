import { api } from './api';

// Intercept window.fetch so that legacy fetch('/api/...') calls seamlessly route to Supabase!
const originalFetch = window.fetch.bind(window);

// Export original fetch so api.js can use it directly without looping into the interceptor
export const rawFetch = originalFetch;

window.fetch = async function(resource, init = {}) {
  const url = typeof resource === 'string' ? resource : (resource ? resource.url : '');
  
  // Only intercept requests containing '/api/'
  if (url && url.includes('/api/')) {
    let pathname = '';
    let searchParams = new URLSearchParams();
    try {
      const parsed = new URL(url, window.location.origin);
      pathname = parsed.pathname;
      searchParams = parsed.searchParams;
    } catch {
      pathname = url.split('?')[0];
    }

    const method = (init.method || 'GET').toUpperCase();
    let body = null;
    if (init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch {
        body = init.body;
      }
    }

    try {
      // 1. Grid
      if (pathname === '/api/grid') {
        const data = await api.getGrid();
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname.startsWith('/api/grid/month')) {
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const prefix = searchParams.get('prefix');
        const res = await api.clearMonth(year, month, prefix);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const gridKeyMatch = pathname.match(/\/api\/grid\/(.+)$/);
      if (gridKeyMatch && method === 'POST') {
        const key = decodeURIComponent(gridKeyMatch[1]);
        const res = await api.updateGridCell(key, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. Auth & Login
      if (pathname === '/api/login' && method === 'POST') {
        const user = await api.login(body.name, body.password);
        return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 3. Users
      if (pathname === '/api/users' && method === 'GET') {
        const users = await api.getUsers();
        return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/users' && method === 'POST') {
        const res = await api.createUser(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const userRoleMatch = pathname.match(/\/api\/users\/(.+)\/role$/);
      if (userRoleMatch && method === 'PUT') {
        const name = decodeURIComponent(userRoleMatch[1]);
        const res = await api.updateUserRole(name, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const userProfileMatch = pathname.match(/\/api\/users\/(.+)\/profile$/);
      if (userProfileMatch && method === 'PUT') {
        const name = decodeURIComponent(userProfileMatch[1]);
        const res = await api.updateUserProfile(name, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const userPasswordMatch = pathname.match(/\/api\/users\/(.+)\/password$/);
      if (userPasswordMatch && method === 'PUT') {
        const name = decodeURIComponent(userPasswordMatch[1]);
        const res = await api.updateUserPassword(name, body.password);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const userDeleteMatch = pathname.match(/\/api\/users\/(.+)$/);
      if (userDeleteMatch && method === 'DELETE') {
        const name = decodeURIComponent(userDeleteMatch[1]);
        const res = await api.deleteUser(name);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 4. Student Leads
      if (pathname === '/api/students' && method === 'GET') {
        const students = await api.getStudents();
        return new Response(JSON.stringify(students), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/students' && method === 'POST') {
        const res = await api.createStudent(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const studentMatch = pathname.match(/\/api\/students\/(.+)$/);
      if (studentMatch && method === 'PUT') {
        const id = studentMatch[1];
        const res = await api.updateStudent(id, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 5. Tasks
      if (pathname === '/api/tasks' && method === 'GET') {
        const tasks = await api.getTasks();
        return new Response(JSON.stringify(tasks), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/tasks' && method === 'POST') {
        const res = await api.createTask(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/tasks/bulk' && method === 'POST') {
        const res = await api.bulkCreateTasks(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const taskMatch = pathname.match(/\/api\/tasks\/(.+)$/);
      if (taskMatch && method === 'PUT') {
        const id = taskMatch[1];
        const res = await api.updateTask(id, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (taskMatch && method === 'DELETE') {
        const id = taskMatch[1];
        const res = await api.deleteTask(id);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 6. Interviews
      if (pathname === '/api/interviews' && method === 'GET') {
        const interviews = await api.getInterviews();
        return new Response(JSON.stringify(interviews), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/interviews' && method === 'POST') {
        const res = await api.createInterview(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const interviewMatch = pathname.match(/\/api\/interviews\/(.+)$/);
      if (interviewMatch && method === 'PUT') {
        const id = interviewMatch[1];
        const res = await api.updateInterview(id, body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (interviewMatch && method === 'DELETE') {
        const id = interviewMatch[1];
        const res = await api.deleteInterview(id);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 7. Targets
      if (pathname === '/api/targets' && method === 'GET') {
        const targets = await api.getTargets();
        return new Response(JSON.stringify(targets), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/targets' && (method === 'PUT' || method === 'POST')) {
        const res = await api.updateTarget(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 8. Logs
      if (pathname === '/api/logs' && method === 'GET') {
        const logs = await api.getLogs();
        return new Response(JSON.stringify(logs), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/logs' && method === 'POST') {
        const res = await api.logActivity(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 9. Cell History
      const historyMatch = pathname.match(/\/api\/history\/(.+)\/(.+)$/);
      if (historyMatch && method === 'GET') {
        const cellKey = decodeURIComponent(historyMatch[1]);
        const slotIndex = historyMatch[2];
        const history = await api.getHistory(cellKey, slotIndex);
        return new Response(JSON.stringify(history), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (pathname === '/api/history' && method === 'POST') {
        const res = await api.createHistory(body);
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

    } catch (err) {
      console.error(`[Intercepted Fetch Error on ${pathname}]:`, err);
      // Return 401 for auth errors so the UI shows the exact message instead of "Network error"
      return new Response(JSON.stringify({ error: err.message || 'Request failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return originalFetch.apply(this, arguments);
};
