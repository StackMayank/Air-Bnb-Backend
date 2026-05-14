const express = require('express');
const { readDB, writeDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/init', authMiddleware, (req, res) => {
  const { checkInDate, checkOutDate, roomsCount, roomId, hotelId } = req.body;
  const db = readDB();

  const hotel = db.hotels.find(h => h.id === Number(hotelId));
  if (!hotel) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  const room = db.rooms.find(r => r.id === Number(roomId));
  if (!room) {
    return res.status(404).json({ error: { message: 'Room not found', status: 404 } });
  }

  const nights = Math.ceil(
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
  );
  const base = (room.basePrice || room.price) * Number(roomsCount) * Math.max(nights, 1);
  const taxPct = room.taxPercent != null ? Number(room.taxPercent) : 18;
  const amount = Math.round(base * (1 + taxPct / 100));

  const newBooking = {
    id: db.bookings.length > 0 ? Math.max(...db.bookings.map(b => b.id)) + 1 : 1,
    userId: req.user.id,
    hotelId: Number(hotelId),
    roomId: Number(roomId),
    roomType: room.type,
    roomsCount: Number(roomsCount),
    checkInDate,
    checkOutDate,
    bookingStatus: 'PAYMENTS_PENDING',
    amount,
    guestIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.bookings.push(newBooking);
  writeDB(db);

  const responseBooking = {
    ...newBooking,
    hotel: { name: hotel.name, city: hotel.city, photos: hotel.photos, contactInfo: hotel.contactInfo },
    room: { type: room.type, photos: room.photos },
    guests: [],
  };

  res.status(201).json(responseBooking);
});

router.get('/:bookingId', authMiddleware, (req, res) => {
  const { bookingId } = req.params;
  const db = readDB();

  const booking = db.bookings.find(b => b.id === Number(bookingId));
  if (!booking) {
    return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
  }

  const hotel = db.hotels.find(h => h.id === booking.hotelId) || {};
  const guests = db.guests.filter(g => booking.guestIds && booking.guestIds.includes(g.id));

  res.json({ ...booking, hotel: { name: hotel.name, city: hotel.city }, guests });
});

router.post('/:bookingId/addGuests', authMiddleware, (req, res) => {
  const { bookingId } = req.params;
  const body = req.body;
  const guestIds = Array.isArray(body) ? body : body.guestIds || [];
  const db = readDB();

  const bookingIndex = db.bookings.findIndex(b => b.id === Number(bookingId));
  if (bookingIndex === -1) {
    return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
  }

  const existing = db.bookings[bookingIndex].guestIds || [];
  db.bookings[bookingIndex].guestIds = [...new Set([...existing, ...guestIds])];
  db.bookings[bookingIndex].updatedAt = new Date().toISOString();
  writeDB(db);

  const booking = db.bookings[bookingIndex];
  const guests = db.guests.filter(g => booking.guestIds.includes(g.id));
  res.json({ data: { ...booking, guests } });
});

router.post('/:bookingId/removeGuests', authMiddleware, (req, res) => {
  const { bookingId } = req.params;
  const body = req.body;
  const guestIds = Array.isArray(body) ? body : body.guestIds || [];
  const db = readDB();

  const bookingIndex = db.bookings.findIndex(b => b.id === Number(bookingId));
  if (bookingIndex === -1) {
    return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
  }

  const existing = db.bookings[bookingIndex].guestIds || [];
  db.bookings[bookingIndex].guestIds = existing.filter(id => !guestIds.includes(id));
  db.bookings[bookingIndex].updatedAt = new Date().toISOString();
  writeDB(db);

  const booking = db.bookings[bookingIndex];
  const guests = db.guests.filter(g => booking.guestIds.includes(g.id));
  res.json({ data: { ...booking, guests } });
});

router.post('/:bookingId/payments', authMiddleware, (req, res) => {
  const { bookingId } = req.params;
  const db = readDB();

  const bookingIndex = db.bookings.findIndex(b => b.id === Number(bookingId));
  if (bookingIndex === -1) {
    return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
  }

  db.bookings[bookingIndex].bookingStatus = 'CONFIRMED';
  db.bookings[bookingIndex].updatedAt = new Date().toISOString();
  writeDB(db);

  const confirmedBooking = db.bookings[bookingIndex];
  res.json({ data: { ...confirmedBooking, sessionUrl: `/payments/${confirmedBooking.id}/status` } });
});

router.post('/:bookingId/cancel', authMiddleware, (req, res) => {
  const { bookingId } = req.params;
  const db = readDB();

  const bookingIndex = db.bookings.findIndex(b => b.id === Number(bookingId));
  if (bookingIndex === -1) {
    return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
  }

  db.bookings[bookingIndex].bookingStatus = 'CANCELLED';
  db.bookings[bookingIndex].updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ data: db.bookings[bookingIndex] });
});

module.exports = router;
