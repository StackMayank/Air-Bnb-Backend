const express = require('express');
const { readDB, writeDB } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/reset', (req, res) => {
  const db = readDB();
  db.hotels = [];
  db.rooms = [];
  db.bookings = [];
  db.guests = [];
  db.inventories = [];
  db.refreshTokens = [];
  writeDB(db);
  res.json({ data: { message: 'All application data cleared' } });
});

router.get('/hotels', (req, res) => {
  const db = readDB();
  res.json(db.hotels);
});

router.post('/hotels', (req, res) => {
  const { name, city, photos, amenities, contactInfo } = req.body;
  const db = readDB();

  const newHotel = {
    id: db.hotels.length > 0 ? Math.max(...db.hotels.map(h => h.id)) + 1 : 1,
    name,
    city,
    photos: photos || [],
    amenities: amenities || [],
    contactInfo: contactInfo || {},
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.hotels.push(newHotel);
  writeDB(db);
  res.status(201).json({ data: newHotel });
});

router.get('/hotels/:hotelId', (req, res) => {
  const { hotelId } = req.params;
  const db = readDB();

  const hotel = db.hotels.find(h => h.id === Number(hotelId));
  if (!hotel) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  res.json(hotel);
});

router.put('/hotels/:hotelId', (req, res) => {
  const { hotelId } = req.params;
  const { name, city, photos, amenities, contactInfo, active } = req.body;
  const db = readDB();

  const hotelIndex = db.hotels.findIndex(h => h.id === Number(hotelId));
  if (hotelIndex === -1) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  if (name !== undefined) db.hotels[hotelIndex].name = name;
  if (city !== undefined) db.hotels[hotelIndex].city = city;
  if (photos !== undefined) db.hotels[hotelIndex].photos = photos;
  if (amenities !== undefined) db.hotels[hotelIndex].amenities = amenities;
  if (contactInfo !== undefined) db.hotels[hotelIndex].contactInfo = contactInfo;
  if (active !== undefined) db.hotels[hotelIndex].active = active;

  writeDB(db);
  res.json({ data: db.hotels[hotelIndex] });
});

router.delete('/hotels/:hotelId', (req, res) => {
  const hotelId = Number(req.params.hotelId);
  const db = readDB();

  const hotelIndex = db.hotels.findIndex(h => h.id === hotelId);
  if (hotelIndex === -1) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  const roomIds = new Set(db.rooms.filter(r => r.hotelId === hotelId).map(r => r.id));
  db.hotels.splice(hotelIndex, 1);
  db.rooms = db.rooms.filter(r => r.hotelId !== hotelId);
  db.bookings = db.bookings.filter(b => b.hotelId !== hotelId);
  db.inventories = db.inventories.filter(i => !roomIds.has(i.roomId));

  writeDB(db);
  res.json({ data: { message: 'Hotel deleted successfully' } });
});

router.get('/hotels/:hotelId/rooms', (req, res) => {
  const { hotelId } = req.params;
  const db = readDB();
  const rooms = db.rooms.filter(r => r.hotelId === Number(hotelId));
  res.json(rooms);
});

router.get('/hotels/:hotelId/rooms/:roomId', (req, res) => {
  const { hotelId, roomId } = req.params;
  const db = readDB();
  const room = db.rooms.find(r => r.id === Number(roomId) && r.hotelId === Number(hotelId));

  if (!room) {
    return res.status(404).json({ error: { message: 'Room not found', status: 404 } });
  }

  res.json(room);
});

router.post('/hotels/:hotelId/rooms', (req, res) => {
  const { hotelId } = req.params;
  const { type, basePrice, photos, amenities, totalCount, capacity, taxPercent } = req.body;
  const db = readDB();

  const hotel = db.hotels.find(h => h.id === Number(hotelId));
  if (!hotel) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  const newRoom = {
    id: db.rooms.length > 0 ? Math.max(...db.rooms.map(r => r.id)) + 1 : 1,
    hotelId: Number(hotelId),
    type,
    basePrice: Number(basePrice),
    price: Number(basePrice),
    taxPercent: taxPercent != null ? Number(taxPercent) : 18,
    photos: photos || [],
    amenities: amenities || [],
    totalCount: Number(totalCount) || 1,
    capacity: Number(capacity) || 2,
  };

  db.rooms.push(newRoom);
  writeDB(db);
  res.status(201).json({ data: newRoom });
});

router.put('/hotels/:hotelId/rooms/:roomId', (req, res) => {
  const { hotelId, roomId } = req.params;
  const { type, basePrice, photos, amenities, totalCount, capacity, taxPercent } = req.body;
  const db = readDB();

  const roomIndex = db.rooms.findIndex(r => r.id === Number(roomId) && r.hotelId === Number(hotelId));
  if (roomIndex === -1) {
    return res.status(404).json({ error: { message: 'Room not found', status: 404 } });
  }

  const room = db.rooms[roomIndex];
  if (type !== undefined) room.type = type;
  if (basePrice !== undefined) {
    room.basePrice = Number(basePrice);
    room.price = Number(basePrice);
  }
  if (taxPercent !== undefined) room.taxPercent = Number(taxPercent);
  if (photos !== undefined) room.photos = photos;
  if (amenities !== undefined) room.amenities = amenities;
  if (totalCount !== undefined) room.totalCount = Number(totalCount) || 1;
  if (capacity !== undefined) room.capacity = Number(capacity) || 2;

  writeDB(db);
  res.json({ data: room });
});

router.delete('/hotels/:hotelId/rooms/:roomId', (req, res) => {
  const { hotelId, roomId } = req.params;
  const db = readDB();

  const roomIndex = db.rooms.findIndex(r => r.id === Number(roomId) && r.hotelId === Number(hotelId));
  if (roomIndex === -1) {
    return res.status(404).json({ error: { message: 'Room not found', status: 404 } });
  }

  db.rooms.splice(roomIndex, 1);
  db.inventories = db.inventories.filter(i => i.roomId !== Number(roomId));
  writeDB(db);
  res.json({ data: { message: 'Room deleted successfully' } });
});

router.get('/hotels/:hotelId/bookings', (req, res) => {
  const { hotelId } = req.params;
  const db = readDB();

  const bookings = db.bookings
    .filter(b => b.hotelId === Number(hotelId))
    .map(booking => {
      const user = db.users.find(u => u.id === booking.userId);
      const guests = db.guests.filter(g => booking.guestIds && booking.guestIds.includes(g.id));
      return {
        ...booking,
        user: user ? { name: user.name, email: user.email, gender: user.gender, dateOfBirth: user.dateOfBirth, roles: user.roles } : null,
        guests,
      };
    });

  res.json(bookings);
});

router.get('/hotels/:hotelId/reports', (req, res) => {
  const { hotelId } = req.params;
  const { startDate } = req.query;
  const db = readDB();

  let bookings = db.bookings.filter(b => b.hotelId === Number(hotelId));

  if (startDate) {
    bookings = bookings.filter(b => new Date(b.createdAt) >= new Date(startDate));
  }

  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED');
  const bookingCount = confirmedBookings.length;
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const avgRevenue = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;

  res.json({ bookingCount, totalRevenue, avgRevenue });
});

router.get('/inventory/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const db = readDB();
  const inventories = db.inventories.filter(i => i.roomId === Number(roomId));
  res.json(inventories);
});

router.patch('/inventory/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { startDate, endDate, surgeFactor, closed } = req.body;
  const db = readDB();

  const room = db.rooms.find(r => r.id === Number(roomId));
  if (!room) {
    return res.status(404).json({ error: { message: 'Room not found', status: 404 } });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const existingIndex = db.inventories.findIndex(
      i => i.roomId === Number(roomId) && i.date === dateStr
    );

    const price = Math.round((room.basePrice || room.price) * (surgeFactor || 1));

    if (existingIndex !== -1) {
      db.inventories[existingIndex].surgeFactor = surgeFactor || 1;
      db.inventories[existingIndex].closed = closed || false;
      db.inventories[existingIndex].price = price;
    } else {
      db.inventories.push({
        id: db.inventories.length > 0 ? Math.max(...db.inventories.map(i => i.id)) + 1 : 1,
        roomId: Number(roomId),
        date: dateStr,
        bookedCount: 0,
        reservedCount: 0,
        surgeFactor: surgeFactor || 1,
        price,
        closed: closed || false,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  writeDB(db);
  const updatedInventories = db.inventories.filter(i => i.roomId === Number(roomId));
  res.json({ data: updatedInventories });
});

module.exports = router;
