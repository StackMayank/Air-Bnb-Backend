const { verifyAccessToken } = require('../jwt');
const { readDB } = require('../db');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Access token required', status: 401 } });
  }

  try {
    const decoded = verifyAccessToken(token);
    const db = readDB();
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found', status: 401 } });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token', status: 401 } });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('HOTEL_MANAGER'))) {
    return res.status(403).json({ error: { message: 'Admin access required', status: 403 } });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
