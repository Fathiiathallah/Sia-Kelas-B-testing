/**
 * SIAKAD — Auth Module
 * Manages session login / logout
 */

const Auth = (() => {
  const SESSION_KEY = 'sk_session';

  function login(userId, password) {
    const user = Users.getById(userId);
    if (!user) return { ok: false, msg: 'Pengguna tidak ditemukan.' };
    if (user.password !== password) return { ok: false, msg: 'Password salah.' };
    const session = { userId: user.id, role: user.role, name: user.name, avatar: user.avatar };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function requireAuth(allowedRoles) {
    const s = getSession();
    if (!s) { window.location.href = 'index.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(s.role)) {
      window.location.href = 'index.html'; return null;
    }
    return s;
  }

  return { login, logout, getSession, requireAuth };
})();
