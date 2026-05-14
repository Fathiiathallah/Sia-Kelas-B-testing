/**
 * SIAKAD — Data Layer
 * localStorage CRUD + seed data
 */

const KEYS = {
  USERS:    'sk_users',
  SUBJECTS: 'sk_subjects',
  HOMEWORK: 'sk_homework',
  SCHEDULE: 'sk_schedule',
  SESSIONS: 'sk_att_sessions',
  RECORDS:  'sk_att_records',
  INIT:     'sk_initialized',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function dbGet(key)       { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function dbSet(key, val)  { localStorage.setItem(key, JSON.stringify(val)); }
function genId()          { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ── Store factory ────────────────────────────────────────────────────────────
function createStore(key) {
  return {
    getAll:   ()     => dbGet(key),
    getById:  (id)   => dbGet(key).find(i => i.id === id) || null,
    where:    (fn)   => dbGet(key).filter(fn),
    create:   (data) => {
      const items = dbGet(key);
      const item = { id: genId(), createdAt: new Date().toISOString(), ...data };
      items.push(item);
      dbSet(key, items);
      return item;
    },
    update: (id, data) => {
      const items = dbGet(key);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      dbSet(key, items);
      return items[idx];
    },
    delete: (id) => {
      const items = dbGet(key);
      const next  = items.filter(i => i.id !== id);
      dbSet(key, next);
      return next.length < items.length;
    },
  };
}

// ── Stores ───────────────────────────────────────────────────────────────────
const Users    = createStore(KEYS.USERS);
const Subjects = createStore(KEYS.SUBJECTS);
const Homework = createStore(KEYS.HOMEWORK);
const Schedule = createStore(KEYS.SCHEDULE);
const Sessions = createStore(KEYS.SESSIONS);  // attendance sessions
const Records  = createStore(KEYS.RECORDS);   // attendance records

// ── Seed Data ────────────────────────────────────────────────────────────────
function initSeedData() {
  if (localStorage.getItem(KEYS.INIT)) return;

  // Users
  const users = [
    { id:'u1', name:'Budi Santoso',      role:'mahasiswa', nim:'2024001', password:'1234',     avatar:'👨‍🎓' },
    { id:'u2', name:'Siti Rahma',         role:'mahasiswa', nim:'2024002', password:'1234',     avatar:'👩‍🎓' },
    { id:'u3', name:'Ahmad Fauzi',        role:'mahasiswa', nim:'2024003', password:'1234',     avatar:'👨‍🎓' },
    { id:'u4', name:'Rina Dewi',          role:'mahasiswa', nim:'2024004', password:'1234',     avatar:'👩‍🎓' },
    { id:'u5', name:'Doni Pratama',       role:'mahasiswa', nim:'2024005', password:'1234',     avatar:'👨‍🎓' },
    { id:'u6', name:'Dr. Hasan Mahmud',   role:'dosen',     nip:'D001',   password:'1234',     avatar:'👨‍🏫', subjectIds:['s1','s2'] },
    { id:'u7', name:'Prof. Wati Rahayu',  role:'dosen',     nip:'D002',   password:'1234',     avatar:'👩‍🏫', subjectIds:['s3','s4'] },
    { id:'u8', name:'Ir. Joko Widarto',   role:'dosen',     nip:'D003',   password:'1234',     avatar:'👨‍🏫', subjectIds:['s5'] },
    { id:'u9', name:'Admin Kelas B',      role:'admin',                   password:'admin123', avatar:'⚙️'  },
  ];
  dbSet(KEYS.USERS, users);

  // Subjects
  const subjects = [
    { id:'s1', name:'Algoritma & Pemrograman', code:'IF101', lecturerId:'u6', credits:3, color:'#6366F1' },
    { id:'s2', name:'Struktur Data',            code:'IF102', lecturerId:'u6', credits:3, color:'#22D3EE' },
    { id:'s3', name:'Basis Data',               code:'IF201', lecturerId:'u7', credits:3, color:'#10B981' },
    { id:'s4', name:'Jaringan Komputer',        code:'IF202', lecturerId:'u7', credits:2, color:'#F59E0B' },
    { id:'s5', name:'Matematika Diskrit',       code:'MA101', lecturerId:'u8', credits:2, color:'#F43F5E' },
  ];
  dbSet(KEYS.SUBJECTS, subjects);

  // Homework
  const now = new Date();
  const soon = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0,10); };
  const homework = [
    { id:'h1', subjectId:'s1', lecturerId:'u6', title:'Implementasi Binary Search',     description:'Buat program Binary Search dalam bahasa C/C++. Upload ke GitHub dan kirim link.', deadline: soon(3),  createdAt: soon(-2) },
    { id:'h2', subjectId:'s2', lecturerId:'u6', title:'Linked List Double',             description:'Implementasikan Doubly Linked List dengan operasi insert, delete, dan traversal.', deadline: soon(7),  createdAt: soon(-1) },
    { id:'h3', subjectId:'s3', lecturerId:'u7', title:'ERD & Normalisasi 3NF',          description:'Buat ERD untuk sistem perpustakaan dan normalisasi hingga 3NF.', deadline: soon(-1), createdAt: soon(-5) },
    { id:'h4', subjectId:'s4', lecturerId:'u7', title:'Laporan Praktikum Subnetting',   description:'Hitung subnetting untuk jaringan dengan 5 departemen. Sertakan tabel routing.', deadline: soon(10), createdAt: soon(-3) },
    { id:'h5', subjectId:'s5', lecturerId:'u8', title:'Pembuktian Induksi Matematika',  description:'Selesaikan 10 soal pembuktian dengan metode induksi matematika.', deadline: soon(5),  createdAt: soon(-1) },
  ];
  dbSet(KEYS.HOMEWORK, homework);

  // Schedule  (day: 1=Mon … 6=Sat)
  const schedule = [
    { id:'sc1', subjectId:'s1', day:1, startTime:'08:00', endTime:'09:40', room:'Lab Komputer A' },
    { id:'sc2', subjectId:'s2', day:2, startTime:'10:00', endTime:'11:40', room:'Lab Komputer B' },
    { id:'sc3', subjectId:'s3', day:3, startTime:'13:00', endTime:'14:40', room:'Ruang 301' },
    { id:'sc4', subjectId:'s4', day:4, startTime:'08:00', endTime:'09:40', room:'Ruang 205' },
    { id:'sc5', subjectId:'s5', day:5, startTime:'10:00', endTime:'11:40', room:'Ruang 302' },
    { id:'sc6', subjectId:'s1', day:3, startTime:'10:00', endTime:'11:40', room:'Lab Komputer A' },
    { id:'sc7', subjectId:'s3', day:5, startTime:'13:00', endTime:'14:40', room:'Ruang 301' },
  ];
  dbSet(KEYS.SCHEDULE, schedule);

  // Attendance sessions (past)
  const dayOffset = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0,10); };
  const sessions = [
    { id:'as1', subjectId:'s1', lecturerId:'u6', date: dayOffset(-14), isOpen: false },
    { id:'as2', subjectId:'s1', lecturerId:'u6', date: dayOffset(-7),  isOpen: false },
    { id:'as3', subjectId:'s2', lecturerId:'u6', date: dayOffset(-13), isOpen: false },
    { id:'as4', subjectId:'s3', lecturerId:'u7', date: dayOffset(-12), isOpen: false },
    { id:'as5', subjectId:'s3', lecturerId:'u7', date: dayOffset(-5),  isOpen: false },
    { id:'as6', subjectId:'s4', lecturerId:'u7', date: dayOffset(-11), isOpen: false },
    { id:'as7', subjectId:'s5', lecturerId:'u8', date: dayOffset(-10), isOpen: false },
    { id:'as8', subjectId:'s5', lecturerId:'u8', date: dayOffset(-3),  isOpen: false },
  ];
  dbSet(KEYS.SESSIONS, sessions);

  // Attendance records
  const studentIds = ['u1','u2','u3','u4','u5'];
  const records = [];
  sessions.forEach(sess => {
    studentIds.forEach(sid => {
      // ~80% hadir, ~10% izin, ~10% alpha
      const roll = Math.random();
      const status = roll < 0.80 ? 'hadir' : roll < 0.90 ? 'izin' : 'alpha';
      records.push({ id: genId(), sessionId: sess.id, studentId: sid, status });
    });
  });
  dbSet(KEYS.RECORDS, records);

  localStorage.setItem(KEYS.INIT, '1');
  console.log('[SIAKAD] Seed data initialized.');
}
