/**
 * 100 hotels = 10 cities × 10 hotels.
 * Within each city: hotel i (by id) → image set i (4 photos), price tier i, rating tier.
 * Same 3 room types everywhere; base prices differ by set (1–10); taxPercent 18 on each room.
 * Run: node scripts/apply-oyo-images.js
 */
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
const TAX_PERCENT = 18;

const CITY_ORDER = [
  'Jaipur',
  'Delhi',
  'Goa',
  'Gurugram',
  'North Goa',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
];

/** Per image set (0–9): Classic, Double, Deluxe with balcony — all different tiers. */
const PRICES_BY_SET_IDX = [
  [1199, 1799, 2699],
  [1349, 1999, 2949],
  [1499, 2199, 3249],
  [1649, 2399, 3549],
  [1799, 2599, 3849],
  [1949, 2799, 4149],
  [2099, 2999, 4499],
  [2249, 3199, 4799],
  [2399, 3399, 5099],
  [2549, 3599, 5399],
];

const HOTEL_SETS = [
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/uxtgaiukbfhs.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/glbmgbxixaaj.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/xfxwkvqwhggd.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/wfgqbjssicpb.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/246778/medium/idcfrxtytjcq.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/246778/thumb/egfcalqtpsye.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/246778/thumb/gnnctiopbbdg.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/246778/thumb/bwvmfpkqyxxd.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/356359/medium/ourrniropaoa.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/356359/thumb/nqmshqdmxcfw.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/356359/thumb/aweejwpbmwjt.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/356359/thumb/qgfossmyxalg.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/339679/medium/tedjgiwapaxc.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/339679/thumb/ythukytibnjq.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/339679/thumb/obfqypjbjvjd.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/339679/thumb/tvgesuuqbdhi.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/352707/medium/hodjnwtxoupt.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/352707/thumb/ighkeyoqccey.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/352707/thumb/pspfmbgpgupl.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/352707/thumb/euxsiuhtejrh.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/332775/medium/kqqvukssfrlm.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/332775/thumb/yogvyqcjysro.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/332775/thumb/dmmcysdkkwyp.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/332775/thumb/kulifnkrktiw.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/161347/medium/oioqssuwghiu.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/161347/thumb/mcwcbkhccojp.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/161347/thumb/bhffpjdtiblf.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/161347/thumb/sxtiponntycx.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/2712/medium/hmrsxiotjwst.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/2712/thumb/vfxkqsbfxbde.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/2712/thumb/oevyymxsspyc.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/2712/thumb/cpddmhdgaquk.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/224507/medium/epnbinctrlun.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/224507/thumb/pcwbwqjiybqg.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/224507/thumb/fsnknyldbual.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/224507/thumb/vtnieljoxehp.jpg',
  ],
  [
    'https://images.oyoroomscdn.com/uploads/hotel_image/300340/medium/xhnetekhealx.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/300340/thumb/jtkpoxpgpcps.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/300340/thumb/dkwwnpjjmoqq.jpg',
    'https://images.oyoroomscdn.com/uploads/hotel_image/300340/thumb/afsmtfjswvay.jpg',
  ],
];

const ROOM_TYPES = [
  {
    type: 'Classic',
    photos: [
      'https://images.oyoroomscdn.com/uploads/hotel_image/111489/thumb/rpewjjylvkox.jpg',
    ],
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom', '24-Hour Service'],
    totalCount: 12,
    capacity: 2,
  },
  {
    type: 'Double',
    photos: ['https://images.oyoroomscdn.com/uploads/hotel_image/96295/thumb/akcfvclamcux.jpg'],
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Hot Water', '24-Hour Service'],
    totalCount: 10,
    capacity: 2,
  },
  {
    type: 'Deluxe with balcony',
    photos: [
      'https://images.oyoroomscdn.com/uploads/hotel_image/111489/thumb/1773921233_284280_OTH.jpg',
    ],
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Hot Water', 'Balcony', 'Work Desk', '24-Hour Service'],
    totalCount: 6,
    capacity: 3,
  },
];

function setIndexForHotel(hotel, db) {
  const inCity = db.hotels.filter((x) => x.city === hotel.city).sort((a, b) => a.id - b.id);
  const i = inCity.findIndex((x) => x.id === hotel.id);
  if (i >= 0) return Math.min(i, HOTEL_SETS.length - 1);
  return (hotel.id - 1) % HOTEL_SETS.length;
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

for (const city of CITY_ORDER) {
  const inCity = db.hotels.filter((h) => h.city === city).sort((a, b) => a.id - b.id);
  if (inCity.length !== HOTEL_SETS.length) {
    console.warn(`City "${city}": expected ${HOTEL_SETS.length} hotels, got ${inCity.length}`);
  }
  inCity.forEach((h, setIdx) => {
    const si = Math.min(setIdx, HOTEL_SETS.length - 1);
    h.photos = [...HOTEL_SETS[si]];
    const rawRating = 3.65 + si * 0.11 + (h.id % 11) * 0.028;
    h.rating = Math.min(4.9, Math.round(rawRating * 10) / 10);
    h.reviewCount = 88 + si * 34 + (h.id % 52) * 3;
  });
}

const assignedIds = new Set();
for (const city of CITY_ORDER) {
  for (const h of db.hotels.filter((x) => x.city === city)) {
    assignedIds.add(h.id);
  }
}
for (const h of db.hotels) {
  if (!assignedIds.has(h.id)) {
    const idx = (h.id - 1) % HOTEL_SETS.length;
    h.photos = [...HOTEL_SETS[idx]];
    h.rating = Math.min(4.9, Math.round((3.7 + (idx * 0.1) + (h.id % 9) * 0.03) * 10) / 10);
    h.reviewCount = 100 + idx * 20 + (h.id % 40);
    console.warn('Hotel not in CITY_ORDER, fallback set/rating:', h.city, h.name, h.id);
  }
}

const newRooms = [];
let roomId = 1;
for (const h of db.hotels.sort((a, b) => a.id - b.id)) {
  const setIdx = setIndexForHotel(h, db);
  const [classic, dbl, deluxe] = PRICES_BY_SET_IDX[setIdx];
  const bases = [classic, dbl, deluxe];
  ROOM_TYPES.forEach((rt, j) => {
    const base = bases[j];
    newRooms.push({
      id: roomId++,
      hotelId: h.id,
      type: rt.type,
      basePrice: base,
      price: base,
      taxPercent: TAX_PERCENT,
      photos: [...rt.photos],
      amenities: [...rt.amenities],
      totalCount: rt.totalCount,
      capacity: rt.capacity,
    });
  });
}

db.rooms = newRooms;
db.inventories = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(
  'Updated',
  db.hotels.length,
  'hotels (photos + rating + reviewCount);',
  db.rooms.length,
  'rooms (tiered base prices, tax',
  TAX_PERCENT,
  '%). Cleared inventories.'
);
