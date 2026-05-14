const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data', 'db.json');

function getDefaultData() {
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('user123', 10);

  return {
    users: [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@hotel.com',
        password: adminHash,
        dateOfBirth: '1990-01-15',
        gender: 'male',
        roles: ['ADMIN', 'USER', 'HOTEL_MANAGER'],
      },
      {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        password: userHash,
        dateOfBirth: '1995-05-20',
        gender: 'male',
        roles: ['USER'],
      },
    ],
    hotels: [],
    rooms: [],
    bookings: [],
    guests: [],
    inventories: [],
    refreshTokens: [],
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const defaultData = getDefaultData();
      writeDB(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const defaultData = getDefaultData();
    writeDB(defaultData);
    return defaultData;
  }
}

function writeDB(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
