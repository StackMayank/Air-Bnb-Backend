const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hotel-management-secret-key-2024';
const JWT_REFRESH_SECRET = 'hotel-management-refresh-secret-2024';

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
