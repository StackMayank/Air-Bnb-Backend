const express = require('express');
const bcrypt = require('bcryptjs');
const { readDB, writeDB } = require('../db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../jwt');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const db = readDB();

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: { message: 'Email already exists', status: 400 } });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    name,
    email,
    password: hashedPassword,
    dateOfBirth: null,
    gender: null,
    roles: ['USER'],
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ data: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: { message: 'Invalid email or password', status: 401 } });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: { message: 'Invalid email or password', status: 401 } });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  db.refreshTokens.push({ userId: user.id, token: refreshToken });
  writeDB(db);

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ data: { accessToken, refreshToken } });
});

router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: { message: 'Refresh token required', status: 401 } });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const db = readDB();
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found', status: 401 } });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: { message: 'Invalid refresh token', status: 401 } });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ data: { message: 'Logged out successfully' } });
});

module.exports = router;
