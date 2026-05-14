const express = require('express');
const { readDB } = require('../db');

const router = express.Router();

function roomTaxMultiplier(room) {
  const pct = room.taxPercent != null ? Number(room.taxPercent) : 18;
  return 1 + pct / 100;
}

function roomPriceAfterTax(room) {
  const base = room.basePrice || room.price || 0;
  return Math.round(base * roomTaxMultiplier(room));
}

router.get('/search', (req, res) => {
  const { city, startDate, endDate, roomsCount, page = 0, size = 10, sort } = req.query;
  const db = readDB();

  let hotels = [...db.hotels].filter(h => h.active !== false);

  if (city) {
    hotels = hotels.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
  }

  if (sort === 'price-asc' || sort === 'price-desc') {
    hotels = hotels.map(hotel => {
      const hotelRooms = db.rooms.filter(r => r.hotelId === hotel.id);
      const minPrice = hotelRooms.length > 0
        ? Math.min(...hotelRooms.map(r => roomPriceAfterTax(r)))
        : 0;
      return { ...hotel, price: minPrice };
    });
    hotels.sort((a, b) => sort === 'price-asc' ? a.price - b.price : b.price - a.price);
  } else {
    hotels = hotels.map(hotel => {
      const hotelRooms = db.rooms.filter(r => r.hotelId === hotel.id);
      const minPrice = hotelRooms.length > 0
        ? Math.min(...hotelRooms.map(r => roomPriceAfterTax(r)))
        : 0;
      return { ...hotel, price: minPrice };
    });
  }

  const totalElements = hotels.length;
  const pageNum = Number(page);
  const pageSize = Number(size);
  const content = hotels.slice(pageNum * pageSize, (pageNum + 1) * pageSize);

  res.json({ content, totalElements });
});

router.get('/:hotelId/info', (req, res) => {
  const { hotelId } = req.params;
  const db = readDB();

  const hotel = db.hotels.find(h => h.id === Number(hotelId));
  if (!hotel) {
    return res.status(404).json({ error: { message: 'Hotel not found', status: 404 } });
  }

  const rooms = db.rooms
    .filter(r => r.hotelId === Number(hotelId))
    .map(room => {
      const basePrice = room.basePrice || room.price || 0;
      const taxPercent = room.taxPercent != null ? Number(room.taxPercent) : 18;
      const priceAfterTax = roomPriceAfterTax(room);
      return {
        id: room.id,
        type: room.type,
        photos: room.photos,
        amenities: room.amenities,
        basePrice,
        taxPercent,
        priceAfterTax,
        price: priceAfterTax,
      };
    });

  res.json({ hotel, rooms });
});

module.exports = router;
