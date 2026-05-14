const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const hotelImageSets = [
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/uxtgaiukbfhs.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/xfxwkvqwhggd.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/rctfjaepinpa.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/292118/large/chrttpctgprd.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/246778/large/idcfrxtytjcq.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/246778/large/egfcalqtpsye.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/246778/large/gnnctiopbbdg.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/246778/large/bgholgwmmsgt.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/55307/large/etddmixpitlq.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/55307/large/nfpnweqorjof.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/55307/large/tcdyuyrwfhpm.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/55307/large/sscqctxrrsgw.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/332775/large/dmmcysdkkwyp.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/332775/large/bgqivbraabne.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/332775/large/lpxggodpuwlx.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/332775/large/jylxakccrtec.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/339679/large/tedjgiwapaxc.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/339679/large/ythukytibnjq.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/339679/large/tvgesuuqbdhi.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/339679/large/ulosyinabiyt.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/161347/large/bhffpjdtiblf.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/161347/large/smehhotrwuns.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/161347/large/sxtiponntycx.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/161347/large/smljvkgdyxdb.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/111489/large/rpewjjylvkox.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/111489/large/mremyrawafil.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/111489/large/wdijkwcqlkqc.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/111489/large/navoudihtito.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/303276/large/fgihqiehedod.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/303276/large/tnehsjdssnth.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/303276/large/xgusevfcnwoq.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/303276/large/gbwxxbwabqki.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/2712/large/hmrsxiotjwst.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/2712/large/vfxkqsbfxbde.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/2712/large/cpddmhdgaquk.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/2712/large/xouebiwjbusy.jpg"
  ],
  [
    "https://images.oyoroomscdn.com/uploads/hotel_image/108199/large/spdreriwnuxe.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/108199/large/mpniynpppfgj.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/108199/large/wxppgpjnlckk.jpg",
    "https://images.oyoroomscdn.com/uploads/hotel_image/108199/large/huaohrfvxwgd.jpg"
  ]
];

const roomImages = {
  "Classic": "https://images.oyoroomscdn.com/uploads/hotel_image/108199/large/fllwwpibnqum.jpg",
  "Double": "https://images.oyoroomscdn.com/uploads/hotel_image/332775/large/kulifnkrktiw.jpg",
  "Deluxe with balcony": "https://images.oyoroomscdn.com/uploads/hotel_image/108199/thumb/1773921192_284280_COL.jpg"
};

// Group hotels by city to safely apply sets 1 to 10
const cityGroups = {};
db.hotels.forEach(hotel => {
  if (!cityGroups[hotel.city]) {
    cityGroups[hotel.city] = [];
  }
  cityGroups[hotel.city].push(hotel);
});

// For each city, assign the photos
Object.keys(cityGroups).forEach(city => {
  const hotelsInCity = cityGroups[city];
  // Sort by id to ensure deterministic order if needed
  hotelsInCity.sort((a, b) => a.id - b.id);
  
  hotelsInCity.forEach((hotel, index) => {
    // There are 10 image sets, so we map index 0-9 directly to set 0-9
    const setIndex = index % 10;
    hotel.photos = hotelImageSets[setIndex];
  });
});

// Update rooms
db.rooms.forEach(room => {
  if (roomImages[room.type]) {
    room.photos = [roomImages[room.type]];
  }
});

// Save db
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated db.json');
