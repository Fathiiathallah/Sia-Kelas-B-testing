/**
 * SIAKAD — Schedule Module
 */
const ScheduleModule = (() => {

  const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const SLOTS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

  function getSubjectMap() {
    const map = {};
    Subjects.getAll().forEach(s => map[s.id] = s);
    return map;
  }

  function timeToSlot(time) {
    const [h] = time.split(':').map(Number);
    return h - 7; // index 0 = 07:00
  }

  function render(session) {
    const subjectMap = getSubjectMap();
    const allSchedule = Schedule.getAll();
    const isAdmin = session.role === 'admin';

    // Build timetable structure: slots[slotIdx][dayIdx] = session or null
    const grid = SLOTS.map(() => Array(6).fill(null));
    allSchedule.forEach(sc => {
      const slotIdx = timeToSlot(sc.startTime);
      const dayIdx  = sc.day - 1; // 1-indexed => 0-indexed
      if (slotIdx >= 0 && slotIdx < SLOTS.length && dayIdx >= 0 && dayIdx < 6) {
        grid[slotIdx][dayIdx] = sc;
      }
    });

    // Grid header
    const headerCells = ['', ...DAYS].map((d, i) => {
      const today = new Date().getDay(); // 0=Sun,1=Mon...
      const isToday = i > 0 && i === today;
      return `<div class="sg-header" style="${isToday?'color:var(--primary);':''}">
        ${isToday ? '📍 ' : ''}${d}
      </div>`;
    }).join('');

    // Grid rows
    const rows = SLOTS.map((slot, sIdx) => {
      const cells = Array(6).fill(0).map((_, dIdx) => {
        const sc = grid[sIdx][dIdx];
        if (sc) {
          const subj = subjectMap[sc.subjectId] || {};
          const editBtn = isAdmin
            ? `<div style="margin-top:3px;display:flex;gap:3px">
                 <button class="btn btn-sm" style="padding:2px 6px;font-size:9px;background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:4px" onclick="ScheduleModule.openEdit('${sc.id}')">✏️</button>
                 <button class="btn btn-sm" style="padding:2px 6px;font-size:9px;background:rgba(244,63,94,.3);border:none;color:#fff;border-radius:4px" onclick="ScheduleModule.deleteSc('${sc.id}')">🗑️</button>
               </div>` : '';
          return `<div class="sg-cell">
            <div class="sg-session" style="background:${subj.color||'var(--primary)'}22;color:${subj.color||'var(--primary)'};border-left:3px solid ${subj.color||'var(--primary)'}">
              <div style="font-size:11px;font-weight:700">${subj.code||'—'}</div>
              <div class="sg-session-room">${sc.room}</div>
              ${editBtn}
            </div>
          </div>`;
        }
        if (isAdmin) {
          return `<div class="sg-cell">
            <button class="sg-add-btn" onclick="ScheduleModule.openCreate(${sc ? sc.day : dIdx+1}, '${slot}')">+</button>
          </div>`;
        }
        return `<div class="sg-cell"></div>`;
      }).join('');

      return `<div class="sg-row" style="display:contents">
        <div class="sg-time">${slot}</div>
        ${cells}
      </div>`;
    }).join('');

    const addBtn = isAdmin
      ? `<button class="btn btn-primary" onclick="ScheduleModule.openCreate(1,'08:00')">➕ Tambah Jadwal</button>` : '';

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="section-header">
        <div><div class="section-title">📅 Jadwal Kuliah</div><div class="section-sub">Jadwal minggu ini — Kelas B</div></div>
        ${addBtn}
      </div>
      <div class="schedule-grid-wrap">
        <div class="schedule-grid" style="grid-template-rows: auto ${SLOTS.map(()=>'minmax(54px,auto)').join(' ')}">
          ${headerCells}
          ${rows}
        </div>
      </div>
      ${isAdmin ? modalHTML(subjectMap) : ''}
    `;
  }

  // ── Modal ──────────────────────────────────────────────────────
  function modalHTML(subjectMap) {
    const options = Object.values(subjectMap).map(s =>
      `<option value="${s.id}">${s.name}</option>`).join('');
    const dayOpts = DAYS.map((d,i) =>
      `<option value="${i+1}">${d}</option>`).join('');
    const timeOpts = SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');

    return `
      <div class="modal-overlay" id="sc-modal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title" id="sc-modal-title">Tambah Jadwal</span>
            <button class="modal-close" onclick="ScheduleModule.closeModal()">✕</button>
          </div>
          <input type="hidden" id="sc-edit-id" />
          <div class="form-group">
            <label class="form-label">Mata Kuliah</label>
            <select class="form-select" id="sc-subject">${options}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Hari</label>
            <select class="form-select" id="sc-day">${dayOpts}</select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
              <label class="form-label">Mulai</label>
              <select class="form-select" id="sc-start">${timeOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Selesai</label>
              <select class="form-select" id="sc-end">${timeOpts}</select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ruangan</label>
            <input type="text" class="form-input" id="sc-room" placeholder="Contoh: Lab Komputer A" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ScheduleModule.closeModal()">Batal</button>
            <button class="btn btn-primary"   onclick="ScheduleModule.saveSc()">💾 Simpan</button>
          </div>
        </div>
      </div>`;
  }

  function openCreate(day = 1, startTime = '08:00') {
    document.getElementById('sc-modal-title').textContent = 'Tambah Jadwal';
    document.getElementById('sc-edit-id').value  = '';
    document.getElementById('sc-day').value      = day;
    document.getElementById('sc-start').value    = startTime;
    document.getElementById('sc-end').value      = startTime;
    document.getElementById('sc-room').value     = '';
    document.getElementById('sc-modal').classList.add('active');
  }

  function openEdit(id) {
    const sc = Schedule.getById(id);
    if (!sc) return;
    document.getElementById('sc-modal-title').textContent = 'Edit Jadwal';
    document.getElementById('sc-edit-id').value  = sc.id;
    document.getElementById('sc-subject').value  = sc.subjectId;
    document.getElementById('sc-day').value      = sc.day;
    document.getElementById('sc-start').value    = sc.startTime;
    document.getElementById('sc-end').value      = sc.endTime;
    document.getElementById('sc-room').value     = sc.room;
    document.getElementById('sc-modal').classList.add('active');
  }

  function closeModal() {
    const m = document.getElementById('sc-modal');
    if (m) m.classList.remove('active');
  }

  function saveSc() {
    const subjectId = document.getElementById('sc-subject').value;
    const day       = parseInt(document.getElementById('sc-day').value);
    const startTime = document.getElementById('sc-start').value;
    const endTime   = document.getElementById('sc-end').value;
    const room      = document.getElementById('sc-room').value.trim();
    const editId    = document.getElementById('sc-edit-id').value;

    if (!room) { showToast('Isi nama ruangan.', 'error'); return; }

    if (editId) {
      Schedule.update(editId, { subjectId, day, startTime, endTime, room });
      showToast('Jadwal diperbarui!', 'success');
    } else {
      Schedule.create({ subjectId, day, startTime, endTime, room });
      showToast('Jadwal ditambahkan!', 'success');
    }
    closeModal();
    render(Auth.getSession());
  }

  function deleteSc(id) {
    if (!confirm('Hapus jadwal ini?')) return;
    Schedule.delete(id);
    showToast('Jadwal dihapus.', 'info');
    render(Auth.getSession());
  }

  return { render, openCreate, openEdit, closeModal, saveSc, deleteSc };
})();
