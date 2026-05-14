/**
 * SIAKAD — Router & Global Utilities
 */

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(110px)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── Router ─────────────────────────────────────────────────────────────────────
const Router = (() => {
  const NAV_CONFIG = {
    mahasiswa: [
      { id: 'home',       label: 'Beranda',       icon: '🏠' },
      { id: 'homework',   label: 'Tugas',         icon: '📚' },
      { id: 'schedule',   label: 'Jadwal',        icon: '📅' },
      { id: 'attendance', label: 'Absensi',       icon: '✅' },
    ],
    dosen: [
      { id: 'home',       label: 'Beranda',       icon: '🏠' },
      { id: 'homework',   label: 'Tugas',         icon: '📚' },
      { id: 'schedule',   label: 'Jadwal',        icon: '📅' },
      { id: 'attendance', label: 'Absensi',       icon: '✅' },
    ],
    admin: [
      { id: 'home',       label: 'Beranda',       icon: '🏠' },
      { id: 'schedule',   label: 'Kelola Jadwal', icon: '📅' },
      { id: 'attendance', label: 'Rekap Absensi', icon: '✅' },
    ],
  };

  let currentPage = 'home';
  let currentSession = null;

  function buildSidebar(session) {
    const navItems = NAV_CONFIG[session.role] || [];
    const roleName = { mahasiswa:'Mahasiswa', dosen:'Dosen', admin:'Admin Kelas' }[session.role];
    document.getElementById('sidebar').innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">🎓</div>
        <div><div class="sidebar-logo-text">SIAKAD</div><div class="sidebar-logo-sub">Kelas B</div></div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-label">Menu Utama</div>
        ${navItems.map(n => `
          <button class="nav-item ${n.id === currentPage ? 'active' : ''}" id="nav-${n.id}" onclick="Router.navigate('${n.id}')">
            <span class="nav-item-icon">${n.icon}</span>${n.label}
          </button>`).join('')}
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${session.avatar}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${session.name}</div>
            <div class="sidebar-user-role">${roleName}</div>
          </div>
        </div>
        <button class="logout-btn" onclick="Auth.logout()">🚪 Keluar</button>
      </div>`;
  }

  function renderHome(session) {
    const subjectMap = {};
    Subjects.getAll().forEach(s => subjectMap[s.id] = s);
    const role     = session.role;
    const homeworks= Homework.getAll();
    const upcoming = homeworks.filter(h => new Date(h.deadline) >= new Date()).sort((a,b) => new Date(a.deadline)-new Date(b.deadline)).slice(0,3);
    const students = Users.where(u => u.role === 'mahasiswa');
    const openSess = Sessions.where(s => s.isOpen);

    let statsHtml = '';
    if (role === 'mahasiswa') {
      const myRecords = Records.where(r => r.studentId === session.userId);
      const hadirCount = myRecords.filter(r => r.status === 'hadir').length;
      const totalSess  = Sessions.where(s => !s.isOpen).length;
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${homeworks.length}</div><div class="stat-label">Total Tugas</div></div>
          <div class="stat-card"><div class="stat-icon">⏰</div><div class="stat-value">${upcoming.length}</div><div class="stat-label">Tugas Mendatang</div></div>
          <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${totalSess?Math.round(hadirCount/totalSess*100):0}%</div><div class="stat-label">Rata-rata Kehadiran</div></div>
          <div class="stat-card"><div class="stat-icon">🟢</div><div class="stat-value">${openSess.length}</div><div class="stat-label">Sesi Absen Aktif</div></div>
        </div>`;
    } else if (role === 'dosen') {
      const myHw = Homework.where(h => h.lecturerId === session.userId);
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${myHw.length}</div><div class="stat-label">Tugas Dibuat</div></div>
          <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${students.length}</div><div class="stat-label">Mahasiswa</div></div>
          <div class="stat-card"><div class="stat-icon">🟢</div><div class="stat-value">${openSess.length}</div><div class="stat-label">Sesi Aktif</div></div>
          <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${Sessions.getAll().length}</div><div class="stat-label">Total Sesi</div></div>
        </div>`;
    } else {
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${students.length}</div><div class="stat-label">Mahasiswa</div></div>
          <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${Subjects.getAll().length}</div><div class="stat-label">Mata Kuliah</div></div>
          <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-value">${Schedule.getAll().length}</div><div class="stat-label">Sesi Jadwal</div></div>
          <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${Sessions.getAll().length}</div><div class="stat-label">Total Pertemuan</div></div>
        </div>`;
    }

    const recentHwHtml = upcoming.length ? upcoming.map(hw => {
      const subj = subjectMap[hw.subjectId] || {};
      const diff = Math.round((new Date(hw.deadline) - new Date()) / 86400000);
      const cls  = diff < 0 ? 'badge-danger' : diff <= 3 ? 'badge-warning' : 'badge-success';
      return `
        <div class="session-item" style="cursor:pointer" onclick="Router.navigate('homework')">
          <div>
            <div class="session-date" style="color:${subj.color||'var(--primary)'}">${hw.title}</div>
            <div class="session-info">${subj.name} · Deadline: ${hw.deadline}</div>
          </div>
          <span class="badge ${cls}">${diff < 0 ? 'Terlambat' : diff===0?'Hari ini':diff+' hari'}</span>
        </div>`;
    }).join('') : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🎉</div><p>Tidak ada tugas mendesak!</p></div>`;

    const greetHour = new Date().getHours();
    const greet = greetHour < 11 ? 'Selamat Pagi' : greetHour < 15 ? 'Selamat Siang' : greetHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

    document.getElementById('main-content').innerHTML = `
      <div style="margin-bottom:24px">
        <h1 style="font-size:24px;font-weight:800">${greet}, ${session.name.split(' ')[0]}! 👋</h1>
        <p style="color:var(--text-2);margin-top:4px">Selamat datang di SIAKAD Kelas B. Berikut ringkasan hari ini.</p>
      </div>
      ${statsHtml}
      ${role !== 'admin' ? `
      <div class="card">
        <div class="section-title" style="font-size:15px;margin-bottom:14px">📚 Tugas Mendatang</div>
        <div class="session-list">${recentHwHtml}</div>
      </div>` : ''}
    `;
  }

  function navigate(page) {
    currentPage = page;
    const session = currentSession;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.id === `nav-${page}`);
    });

    // Update topbar
    const titles = {
      home: ['Beranda', 'Ringkasan aktivitas hari ini'],
      homework: ['Tugas', 'Daftar tugas dari dosen'],
      schedule: ['Jadwal Kuliah', 'Jadwal perkuliahan mingguan'],
      attendance: ['Absensi', 'Kelola dan pantau kehadiran'],
    };
    const [title, sub] = titles[page] || ['—', ''];
    document.getElementById('topbar-title').textContent = title;
    document.getElementById('topbar-sub').textContent   = sub;

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');

    // Render module
    if (page === 'home')       renderHome(session);
    else if (page === 'homework')   HomeworkModule.render(session);
    else if (page === 'schedule')   ScheduleModule.render(session);
    else if (page === 'attendance') AttendanceModule.render(session);
  }

  function init() {
    const session = Auth.requireAuth();
    if (!session) return;
    currentSession = session;

    // Init seed data
    initSeedData();

    // Build sidebar
    buildSidebar(session);

    // Topbar date
    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    // Hamburger
    document.getElementById('topbar-burger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Navigate to home
    navigate('home');
  }

  return { init, navigate };
})();
