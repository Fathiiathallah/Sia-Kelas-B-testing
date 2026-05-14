/**
 * SIAKAD — Attendance Module
 */
const AttendanceModule = (() => {

  function getSubjectMap() {
    const map = {};
    Subjects.getAll().forEach(s => map[s.id] = s);
    return map;
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  // ─────────────────────────────── STUDENT ─────────────────────
  function renderStudent(session) {
    const subjectMap = getSubjectMap();
    const subjects   = Subjects.getAll();
    const allSessions= Sessions.getAll();
    const allRecords = Records.getAll();

    // Find any open session to show check-in
    const openSessions = allSessions.filter(s => s.isOpen);

    let html = `
      <div class="section-header">
        <div><div class="section-title">✅ Absensi</div><div class="section-sub">Rekapitulasi kehadiran per mata kuliah</div></div>
      </div>`;

    // Open session check-in banner
    if (openSessions.length) {
      openSessions.forEach(os => {
        const subj = subjectMap[os.subjectId] || {};
        const alreadyCheckedIn = allRecords.find(r => r.sessionId === os.id && r.studentId === session.userId);
        html += `
          <div class="session-item open-session" style="margin-bottom:12px">
            <div>
              <div class="session-date">🟢 Sesi Aktif — ${subj.name}</div>
              <div class="session-info">${fmtDate(os.date)}</div>
            </div>
            ${alreadyCheckedIn
              ? `<span class="badge badge-success">✓ Sudah Hadir</span>`
              : `<button class="btn btn-success" onclick="AttendanceModule.checkIn('${os.id}')">✋ Tandai Hadir</button>`
            }
          </div>`;
      });
    }

    // Per-subject attendance cards
    subjects.forEach(subj => {
      const subjSessions = allSessions.filter(s => s.subjectId === subj.id && !s.isOpen);
      const total  = subjSessions.length;
      if (total === 0) return;

      const hadir  = subjSessions.filter(s => allRecords.find(r => r.sessionId===s.id && r.studentId===session.userId && r.status==='hadir')).length;
      const izin   = subjSessions.filter(s => allRecords.find(r => r.sessionId===s.id && r.studentId===session.userId && r.status==='izin')).length;
      const alpha  = total - hadir - izin;
      const pct    = Math.round((hadir / total) * 100);
      const pctCls = pct >= 75 ? 'good' : pct >= 60 ? 'warning' : 'danger';
      const barClr = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';

      const sessionRows = subjSessions
        .sort((a,b) => new Date(b.date)-new Date(a.date))
        .map(s => {
          const rec = allRecords.find(r => r.sessionId===s.id && r.studentId===session.userId);
          const st  = rec ? rec.status : 'alpha';
          const badge = st==='hadir' ? 'badge-success' : st==='izin' ? 'badge-warning' : 'badge-danger';
          const label = st==='hadir' ? '✅ Hadir' : st==='izin' ? '📝 Izin' : '❌ Alpha';
          return `<tr><td>${fmtDate(s.date)}</td><td><span class="badge ${badge}">${label}</span></td></tr>`;
        }).join('');

      html += `
        <div class="att-subject-card">
          <div class="att-subject-header">
            <div>
              <div class="att-subject-name" style="color:${subj.color}">${subj.name}</div>
              <div class="att-stats">
                <span class="att-stat">✅ Hadir: <strong>${hadir}</strong></span>
                <span class="att-stat">📝 Izin: <strong>${izin}</strong></span>
                <span class="att-stat">❌ Alpha: <strong>${alpha}</strong></span>
                <span class="att-stat">📊 Total: <strong>${total}</strong></span>
              </div>
            </div>
            <div class="att-percent ${pctCls}">${pct}%</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${barClr}"></div></div>
          <div style="margin-top:14px">
            <div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Status</th></tr></thead><tbody>${sessionRows}</tbody></table></div>
          </div>
        </div>`;
    });

    document.getElementById('main-content').innerHTML = html;
  }

  // ─────────────────────────────── DOSEN ──────────────────────
  function renderDosen(session) {
    const subjectMap  = getSubjectMap();
    const mySubjects  = Subjects.where(s => s.lecturerId === session.userId);
    const allSessions = Sessions.getAll();
    const allRecords  = Records.getAll();
    const students    = Users.where(u => u.role === 'mahasiswa');

    let html = `
      <div class="section-header">
        <div><div class="section-title">✅ Absensi</div><div class="section-sub">Kelola sesi absensi per mata kuliah</div></div>
      </div>`;

    mySubjects.forEach(subj => {
      const subjSessions = allSessions.filter(s => s.subjectId === subj.id)
        .sort((a,b) => new Date(b.date)-new Date(a.date));
      const openSess = subjSessions.find(s => s.isOpen);

      html += `
        <div class="att-subject-card">
          <div class="att-subject-header">
            <div class="att-subject-name" style="color:${subj.color}">${subj.name} <span class="badge badge-muted">${subj.code}</span></div>
            ${openSess
              ? `<button class="btn btn-danger btn-sm" onclick="AttendanceModule.closeSession('${openSess.id}')">🔴 Tutup Sesi</button>`
              : `<button class="btn btn-success btn-sm" onclick="AttendanceModule.openSession('${subj.id}')">🟢 Buka Sesi Absen</button>`
            }
          </div>
          ${openSess ? `<div class="session-item open-session" style="margin-bottom:10px">
            <div><div class="session-date">🟢 Sesi sedang berlangsung</div><div class="session-info">${fmtDate(openSess.date)}</div></div>
            <span class="badge badge-success">${allRecords.filter(r=>r.sessionId===openSess.id&&r.status==='hadir').length} / ${students.length} hadir</span>
          </div>` : ''}
          <div class="session-list">
            ${subjSessions.filter(s=>!s.isOpen).length === 0 ? '<p class="text-muted">Belum ada sesi tercatat.</p>' :
              subjSessions.filter(s=>!s.isOpen).map(s => {
                const hadir = allRecords.filter(r=>r.sessionId===s.id && r.status==='hadir').length;
                return `
                  <div class="session-item">
                    <div>
                      <div class="session-date">${fmtDate(s.date)}</div>
                      <div class="session-info">Kehadiran: ${hadir}/${students.length} mahasiswa</div>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="AttendanceModule.viewSession('${s.id}')">👁️ Detail</button>
                  </div>`;
              }).join('')}
          </div>
        </div>`;
    });

    document.getElementById('main-content').innerHTML = html + sessionDetailModal() + attendanceDetailModal(allRecords, students);
  }

  // ─────────────────────────────── ADMIN ──────────────────────
  function renderAdmin(session) {
    const subjectMap = getSubjectMap();
    const subjects   = Subjects.getAll();
    const allSessions= Sessions.getAll().filter(s => !s.isOpen);
    const allRecords = Records.getAll();
    const students   = Users.where(u => u.role === 'mahasiswa');

    const rows = subjects.map(subj => {
      const subs = allSessions.filter(s => s.subjectId === subj.id);
      const total = subs.length;
      if (!total) return '';
      const pctSum = students.reduce((sum, st) => {
        const h = subs.filter(s => allRecords.find(r => r.sessionId===s.id && r.studentId===st.id && r.status==='hadir')).length;
        return sum + (h/total*100);
      }, 0);
      const avgPct = Math.round(pctSum / students.length);
      const clr = avgPct >= 75 ? 'var(--success)' : avgPct >= 60 ? 'var(--warning)' : 'var(--danger)';
      return `<tr>
        <td><span style="color:${subj.color};font-weight:600">${subj.name}</span></td>
        <td>${subj.code}</td>
        <td>${total} pertemuan</td>
        <td><span style="color:${clr};font-weight:700">${avgPct}%</span></td>
      </tr>`;
    }).join('');

    // Per-student table
    const studentRows = students.map(st => {
      const cells = subjects.map(subj => {
        const subs = allSessions.filter(s => s.subjectId === subj.id);
        if (!subs.length) return '<td>—</td>';
        const h = subs.filter(s => allRecords.find(r => r.sessionId===s.id && r.studentId===st.id && r.status==='hadir')).length;
        const pct = Math.round(h / subs.length * 100);
        const clr = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
        return `<td style="color:${clr};font-weight:600">${pct}%</td>`;
      }).join('');
      return `<tr><td>${st.avatar} ${st.name}</td><td style="color:var(--text-2)">${st.nim}</td>${cells}</tr>`;
    }).join('');

    const subjHeaders = subjects.map(s => `<th>${s.code}</th>`).join('');

    document.getElementById('main-content').innerHTML = `
      <div class="section-header">
        <div><div class="section-title">✅ Rekap Absensi</div><div class="section-sub">Ringkasan kehadiran seluruh kelas</div></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${students.length}</div><div class="stat-label">Total Mahasiswa</div></div>
        <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${subjects.length}</div><div class="stat-label">Mata Kuliah</div></div>
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${allSessions.length}</div><div class="stat-label">Total Pertemuan</div></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-title" style="font-size:15px;margin-bottom:12px">Rata-rata Kehadiran per MK</div>
        <div class="table-wrap"><table><thead><tr><th>Mata Kuliah</th><th>Kode</th><th>Pertemuan</th><th>Avg. Kehadiran</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <div class="card">
        <div class="section-title" style="font-size:15px;margin-bottom:12px">Detail per Mahasiswa</div>
        <div class="table-wrap"><table><thead><tr><th>Nama</th><th>NIM</th>${subjHeaders}</tr></thead><tbody>${studentRows}</tbody></table></div>
      </div>`;
  }

  // ── Session Modals ────────────────────────────────────────────
  function sessionDetailModal() {
    return `<div class="modal-overlay" id="sess-detail-modal">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Detail Absensi Sesi</span>
          <button class="modal-close" onclick="document.getElementById('sess-detail-modal').classList.remove('active')">✕</button>
        </div>
        <div id="sess-detail-body"></div>
      </div>
    </div>`;
  }

  function attendanceDetailModal(allRecords, students) { return ''; }

  // ── Actions ───────────────────────────────────────────────────
  function checkIn(sessionId) {
    const session = Auth.getSession();
    const exists  = Records.where(r => r.sessionId === sessionId && r.studentId === session.userId);
    if (exists.length) { showToast('Kamu sudah absen!', 'info'); return; }
    Records.create({ sessionId, studentId: session.userId, status: 'hadir' });
    showToast('Berhasil absen! ✅', 'success');
    renderStudent(session);
  }

  function openSession(subjectId) {
    const session = Auth.getSession();
    const today   = new Date().toISOString().slice(0,10);
    const existing = Sessions.where(s => s.subjectId === subjectId && s.isOpen);
    if (existing.length) { showToast('Sesi sudah terbuka!', 'info'); return; }
    Sessions.create({ subjectId, lecturerId: session.userId, date: today, isOpen: true });
    showToast('Sesi absensi dibuka! 🟢', 'success');
    renderDosen(session);
  }

  function closeSession(sessionId) {
    Sessions.update(sessionId, { isOpen: false });
    showToast('Sesi absensi ditutup.', 'info');
    renderDosen(Auth.getSession());
  }

  function viewSession(sessionId) {
    const s        = Sessions.getById(sessionId);
    const subjectMap = getSubjectMap();
    const subj     = subjectMap[s.subjectId] || {};
    const students = Users.where(u => u.role === 'mahasiswa');
    const records  = Records.where(r => r.sessionId === sessionId);

    const rows = students.map(st => {
      const rec = records.find(r => r.studentId === st.id);
      const status = rec ? rec.status : 'alpha';
      const badge  = status==='hadir'?'badge-success':status==='izin'?'badge-warning':'badge-danger';
      const label  = status==='hadir'?'✅ Hadir':status==='izin'?'📝 Izin':'❌ Alpha';
      return `<tr>
        <td>${st.avatar} ${st.name}</td>
        <td>${st.nim}</td>
        <td><span class="badge ${badge}">${label}</span></td>
        <td>
          <select class="form-select" style="padding:4px 8px;font-size:12px" onchange="AttendanceModule.updateRecord('${sessionId}','${st.id}',this.value)">
            <option value="hadir"  ${status==='hadir' ?'selected':''}>Hadir</option>
            <option value="izin"   ${status==='izin'  ?'selected':''}>Izin</option>
            <option value="alpha"  ${status==='alpha' ?'selected':''}>Alpha</option>
          </select>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('sess-detail-body').innerHTML = `
      <p style="color:var(--text-2);margin-bottom:14px">${subj.name} · ${fmtDate(s.date)}</p>
      <div class="table-wrap">
        <table><thead><tr><th>Nama</th><th>NIM</th><th>Status</th><th>Ubah</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    document.getElementById('sess-detail-modal').classList.add('active');
  }

  function updateRecord(sessionId, studentId, status) {
    const existing = Records.where(r => r.sessionId===sessionId && r.studentId===studentId);
    if (existing.length) {
      Records.update(existing[0].id, { status });
    } else {
      Records.create({ sessionId, studentId, status });
    }
    showToast('Status absensi diperbarui.', 'success');
  }

  // ── Main render dispatcher ────────────────────────────────────
  function render(session) {
    if (session.role === 'mahasiswa') renderStudent(session);
    else if (session.role === 'dosen')  renderDosen(session);
    else renderAdmin(session);
  }

  return { render, checkIn, openSession, closeSession, viewSession, updateRecord };
})();
