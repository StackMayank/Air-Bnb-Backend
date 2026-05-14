const express = require('express');
const { readDB, writeDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
});

router.patch('/profile', authMiddleware, (req, res) => {
  const { name, dateOfBirth, gender } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);

  if (name) db.users[userIndex].name = name;
  if (dateOfBirth) db.users[userIndex].dateOfBirth = dateOfBirth;
  if (gender) db.users[userIndex].gender = gender;

  writeDB(db);
  const { password, ...updatedUser } = db.users[userIndex];
  res.json({ data: updatedUser });
});

router.get('/myBookings', authMiddleware, (req, res) => {
  const db = readDB();
  const userBookings = db.bookings
    .filter(b => b.userId === req.user.id)
    .map(booking => {
      const hotel = db.hotels.find(h => h.id === booking.hotelId) || {};
      const bookingGuests = db.guests.filter(g => booking.guestIds && booking.guestIds.includes(g.id));
      return {
        ...booking,
        hotel: { name: hotel.name, city: hotel.city },
        guests: bookingGuests,
      };
    });
  res.json(userBookings);
});

router.get('/guests', authMiddleware, (req, res) => {
  const db = readDB();
  const userGuests = db.guests.filter(g => g.userId === req.user.id);
  res.json(userGuests);
});

router.post('/guests', authMiddleware, (req, res) => {
  const { name, gender, dateOfBirth } = req.body;
  const db = readDB();

  const newGuest = {
    id: db.guests.length > 0 ? Math.max(...db.guests.map(g => g.id)) + 1 : 1,
    userId: req.user.id,
    name,
    gender,
    dateOfBirth,
  };

  db.guests.push(newGuest);
  writeDB(db);
  res.status(201).json({ data: newGuest });
});

router.put('/guests/:guestId', authMiddleware, (req, res) => {
  const { guestId } = req.params;
  const { name, gender, dateOfBirth } = req.body;
  const db = readDB();

  const guestIndex = db.guests.findIndex(g => g.id === Number(guestId) && g.userId === req.user.id);
  if (guestIndex === -1) {
    return res.status(404).json({ error: { message: 'Guest not found', status: 404 } });
  }

  if (name) db.guests[guestIndex].name = name;
  if (gender) db.guests[guestIndex].gender = gender;
  if (dateOfBirth) db.guests[guestIndex].dateOfBirth = dateOfBirth;

  writeDB(db);
  res.json({ data: db.guests[guestIndex] });
});

router.delete('/guests/:guestId', authMiddleware, (req, res) => {
  const { guestId } = req.params;
  const db = readDB();

  const guestIndex = db.guests.findIndex(g => g.id === Number(guestId) && g.userId === req.user.id);
  if (guestIndex === -1) {
    return res.status(404).json({ error: { message: 'Guest not found', status: 404 } });
  }

  db.guests.splice(guestIndex, 1);
  writeDB(db);
  res.json({ data: { message: 'Guest deleted successfully' } });
});

module.exports = router;
