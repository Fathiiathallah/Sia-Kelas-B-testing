/**
 * SIAKAD — Homework Module
 */
const HomeworkModule = (() => {

  // ── Helpers ──────────────────────────────────────────────────
  function getSubjectMap() {
    const map = {};
    Subjects.getAll().forEach(s => map[s.id] = s);
    return map;
  }
  function deadlineStatus(deadline) {
    const now  = new Date(); now.setHours(0,0,0,0);
    const ddl  = new Date(deadline); ddl.setHours(0,0,0,0);
    const diff = Math.round((ddl - now) / 86400000);
    if (diff < 0)  return { label: `Terlambat ${Math.abs(diff)} hari`, cls: 'badge-danger',   color: 'var(--danger)'  };
    if (diff === 0) return { label: 'Hari ini!',                        cls: 'badge-warning',  color: 'var(--warning)' };
    if (diff <= 3)  return { label: `${diff} hari lagi`,                cls: 'badge-warning',  color: 'var(--warning)' };
    return               { label: `${diff} hari lagi`,                  cls: 'badge-success',  color: 'var(--success)' };
  }

  function hwCardHTML(hw, subjectMap, session, canEdit) {
    const subj = subjectMap[hw.subjectId] || {};
    const ddl  = deadlineStatus(hw.deadline);
    const actions = canEdit ? `
      <div class="hw-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="HomeworkModule.openEdit('${hw.id}')">✏️ Edit</button>
        <button class="btn btn-sm btn-danger"    onclick="HomeworkModule.deleteHw('${hw.id}')">🗑️</button>
      </div>` : '';
    return `
      <div class="hw-card" style="border-left-color:${subj.color||'var(--primary)'}">
        <div class="hw-card-subject" style="color:${subj.color||'var(--primary)'}">${subj.code||''} · ${subj.name||'—'}</div>
        <div class="hw-card-title">${hw.title}</div>
        <div class="hw-card-desc">${hw.description}</div>
        <div class="hw-card-footer">
          <span class="badge ${ddl.cls}">📅 ${hw.deadline} · ${ddl.label}</span>
          ${actions}
        </div>
      </div>`;
  }

  // ── Render ────────────────────────────────────────────────────
  function render(session) {
    const subjectMap = getSubjectMap();
    const role = session.role;
    let homeworks = [];

    if (role === 'dosen') {
      homeworks = Homework.where(h => h.lecturerId === session.userId);
    } else {
      homeworks = Homework.getAll();
    }

    // Filter state
    let activeFilter = 'all';

    function buildView() {
      let filtered = homeworks;
      if (activeFilter !== 'all') {
        filtered = homeworks.filter(h => h.subjectId === activeFilter);
      }
      filtered = [...filtered].sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

      const subjectFilters = [...new Set(homeworks.map(h => h.subjectId))];
      const chips = [
        `<button class="chip ${activeFilter==='all'?'active':''}" onclick="HwFilter('all')">Semua</button>`,
        ...subjectFilters.map(sid => {
          const s = subjectMap[sid] || {};
          return `<button class="chip ${activeFilter===sid?'active':''}" onclick="HwFilter('${sid}')">${s.code||sid}</button>`;
        })
      ].join('');

      const cards = filtered.length
        ? filtered.map(hw => hwCardHTML(hw, subjectMap, session, role === 'dosen' && hw.lecturerId === session.userId)).join('')
        : `<div class="empty-state"><div class="empty-state-icon">📭</div><p>Belum ada tugas.</p></div>`;

      const addBtn = role === 'dosen'
        ? `<button class="btn btn-primary" onclick="HomeworkModule.openCreate()">➕ Buat Tugas</button>` : '';

      return `
        <div class="section-header">
          <div><div class="section-title">📚 Tugas</div><div class="section-sub">Daftar tugas dari dosen</div></div>
          ${addBtn}
        </div>
        <div class="chip-group">${chips}</div>
        <div class="hw-grid" id="hw-grid">${cards}</div>
        ${modalHTML(session, subjectMap)}
      `;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = buildView();

    // expose filter fn
    window.HwFilter = function(filter) {
      activeFilter = filter;
      container.innerHTML = buildView();
    };
  }

  // ── Modal HTML ────────────────────────────────────────────────
  function modalHTML(session, subjectMap) {
    if (session.role !== 'dosen') return '';
    const mySubjects = Subjects.where(s => s.lecturerId === session.userId);
    const options = mySubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    return `
      <div class="modal-overlay" id="hw-modal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title" id="hw-modal-title">Buat Tugas Baru</span>
            <button class="modal-close" onclick="HomeworkModule.closeModal()">✕</button>
          </div>
          <input type="hidden" id="hw-edit-id" />
          <div class="form-group">
            <label class="form-label">Mata Kuliah</label>
            <select class="form-select" id="hw-subject">${options}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Judul Tugas</label>
            <input type="text" class="form-input" id="hw-title" placeholder="Contoh: Implementasi Binary Search" />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea class="form-textarea" id="hw-desc" placeholder="Jelaskan detail tugasnya..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input type="date" class="form-input" id="hw-deadline" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="HomeworkModule.closeModal()">Batal</button>
            <button class="btn btn-primary" onclick="HomeworkModule.saveHw()">💾 Simpan</button>
          </div>
        </div>
      </div>`;
  }

  // ── CRUD ──────────────────────────────────────────────────────
  function openCreate() {
    document.getElementById('hw-modal-title').textContent = 'Buat Tugas Baru';
    document.getElementById('hw-edit-id').value = '';
    document.getElementById('hw-title').value   = '';
    document.getElementById('hw-desc').value    = '';
    document.getElementById('hw-deadline').value = '';
    document.getElementById('hw-modal').classList.add('active');
  }

  function openEdit(id) {
    const hw = Homework.getById(id);
    if (!hw) return;
    document.getElementById('hw-modal-title').textContent = 'Edit Tugas';
    document.getElementById('hw-edit-id').value  = hw.id;
    document.getElementById('hw-subject').value  = hw.subjectId;
    document.getElementById('hw-title').value    = hw.title;
    document.getElementById('hw-desc').value     = hw.description;
    document.getElementById('hw-deadline').value = hw.deadline;
    document.getElementById('hw-modal').classList.add('active');
  }

  function closeModal() {
    const m = document.getElementById('hw-modal');
    if (m) m.classList.remove('active');
  }

  function saveHw() {
    const title    = document.getElementById('hw-title').value.trim();
    const desc     = document.getElementById('hw-desc').value.trim();
    const deadline = document.getElementById('hw-deadline').value;
    const subjectId= document.getElementById('hw-subject').value;
    const editId   = document.getElementById('hw-edit-id').value;

    if (!title || !desc || !deadline) { showToast('Lengkapi semua field.', 'error'); return; }

    const session = Auth.getSession();
    if (editId) {
      Homework.update(editId, { title, description: desc, deadline, subjectId });
      showToast('Tugas berhasil diperbarui!', 'success');
    } else {
      Homework.create({ title, description: desc, deadline, subjectId, lecturerId: session.userId });
      showToast('Tugas berhasil ditambahkan!', 'success');
    }
    closeModal();
    render(session);
  }

  function deleteHw(id) {
    if (!confirm('Hapus tugas ini?')) return;
    Homework.delete(id);
    showToast('Tugas dihapus.', 'info');
    render(Auth.getSession());
  }

  return { render, openCreate, openEdit, closeModal, saveHw, deleteHw };
})();
