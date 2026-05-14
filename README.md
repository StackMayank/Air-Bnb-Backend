# Hotel Management Backend

A Node.js/Express backend server for the Hotel Booking App. Replaces the Docker-based backend with a lightweight, file-based JSON database.

---

## Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Installation](#2-installation)
- [3. Running the Server](#3-running-the-server)
- [4. Default Credentials](#4-default-credentials)
- [5. Admin Panel (Frontend to Add Data)](#5-admin-panel-frontend-to-add-data)
- [6. API Endpoints Overview](#6-api-endpoints-overview)
  - [6.1 Authentication](#61-authentication)
  - [6.2 User Profile & Guests](#62-user-profile--guests)
  - [6.3 Hotels (Public)](#63-hotels-public)
  - [6.4 Bookings](#64-bookings)
  - [6.5 Admin - Hotels](#65-admin---hotels)
  - [6.6 Admin - Rooms](#66-admin---rooms)
  - [6.7 Admin - Bookings & Reports](#67-admin---bookings--reports)
  - [6.8 Admin - Inventory](#68-admin---inventory)
  - [6.9 File Upload](#69-file-upload)
- [7. Data Models](#7-data-models)
  - [7.1 User](#71-user)
  - [7.2 Hotel](#72-hotel)
  - [7.3 Room](#73-room)
  - [7.4 Booking](#74-booking)
  - [7.5 Guest (Traveller)](#75-guest-traveller)
  - [7.6 Inventory](#76-inventory)
- [8. Image Upload - How It Works](#8-image-upload---how-it-works)
- [9. Integrating with Hotel Booking App (Frontend)](#9-integrating-with-hotel-booking-app-frontend)
  - [9.1 Environment Variable](#91-environment-variable)
  - [9.2 Frontend Code Changes Already Made](#92-frontend-code-changes-already-made)
  - [9.3 Steps to Run Both Together](#93-steps-to-run-both-together)
- [10. Seeding Sample Data](#10-seeding-sample-data)
- [11. Project Structure](#11-project-structure)
- [12. Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Make sure you have the following installed on your machine:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | v18 or higher | `node --version` |
| npm | v9 or higher | `npm --version` |

---

## 2. Installation

```bash
cd hotel-management-backend
npm install
```

This installs the following dependencies:

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `cors` | Cross-Origin Resource Sharing (allows frontend to call API) |
| `cookie-parser` | Parse cookies (for refresh tokens) |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT token generation & verification |
| `multer` | File upload handling (multipart/form-data) |

---

## 3. Running the Server

**Development mode** (auto-restarts on file changes):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server starts at **http://localhost:8080**.

On first startup, it automatically creates:
- `src/data/db.json` — the JSON database file with default admin/user accounts
- `public/uploads/` — directory for uploaded images

---

## 4. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hotel.com` | `admin123` |
| Regular User | `john@example.com` | `user123` |

---

## 5. Admin Panel (Frontend to Add Data)

Open **http://localhost:8080/admin.html** in your browser.

This provides a UI to:
- Login as admin
- Add/view hotels
- Add/view rooms for each hotel
- View users and bookings
- Seed sample data with one click
- Reset all data

---

## 6. API Endpoints Overview

Base URL: `http://localhost:8080/api/v1`

### 6.1 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register a new user | No |
| POST | `/auth/login` | Login and get tokens | No |
| POST | `/auth/refresh` | Refresh access token | No (uses cookie) |
| POST | `/auth/logout` | Logout and clear cookie | No |

**POST /auth/signup**

Request body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "mypassword"
}
```

Response (201):
```json
{
  "data": { "id": 3, "name": "Jane Doe", "email": "jane@example.com" }
}
```

**POST /auth/login**

Request body:
```json
{
  "email": "admin@hotel.com",
  "password": "admin123"
}
```

Response (200):
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

**POST /auth/refresh**

No body required. Uses the `refreshToken` cookie set during login.

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1..."
}
```

**POST /auth/logout**

Response (200):
```json
{
  "data": { "message": "Logged out successfully" }
}
```

---

### 6.2 User Profile & Guests

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get current user profile |
| PATCH | `/users/profile` | Update profile (name, dateOfBirth, gender) |
| GET | `/users/myBookings` | Get all bookings for current user |
| GET | `/users/guests` | Get all saved travellers |
| POST | `/users/guests` | Add a new traveller |
| PUT | `/users/guests/:guestId` | Update a traveller |
| DELETE | `/users/guests/:guestId` | Delete a traveller |

**GET /users/profile**

Response:
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@hotel.com",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "roles": ["ADMIN", "USER"]
}
```

**POST /users/guests**

Request body:
```json
{
  "name": "Priya Sharma",
  "gender": "female",
  "dateOfBirth": "1992-08-15"
}
```

Response (201):
```json
{
  "data": { "id": 1, "userId": 1, "name": "Priya Sharma", "gender": "female", "dateOfBirth": "1992-08-15" }
}
```

---

### 6.3 Hotels (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hotels/search` | Search hotels with filters |
| GET | `/hotels/:hotelId/info` | Get hotel details with rooms |

**GET /hotels/search**

Query parameters:

| Param | Type | Description |
|-------|------|-------------|
| city | string | Filter by city name |
| startDate | string | Check-in date (YYYY-MM-DD) |
| endDate | string | Check-out date (YYYY-MM-DD) |
| roomsCount | number | Number of rooms needed |
| page | number | Page number (0-based) |
| size | number | Results per page (default 10) |
| sort | string | `price-asc`, `price-desc`, or `popularity` |

Example: `GET /hotels/search?city=Delhi&page=0&size=2&sort=price-asc`

Response:
```json
{
  "content": [
    {
      "id": 1,
      "name": "Hotel Almond Resorts and Spa",
      "city": "Delhi",
      "photos": ["https://...jpg", "https://...jpg"],
      "amenities": ["AC", "Pool", "Spa"],
      "contactInfo": { "address": "East Delhi", "phoneNumber": "9829391929", "email": "hello@hotel.com", "location": "77.2090,28.6139" },
      "active": true,
      "price": 1500
    }
  ],
  "totalElements": 3
}
```

**GET /hotels/:hotelId/info**

Response:
```json
{
  "hotel": {
    "id": 1,
    "name": "Hotel Almond Resorts and Spa",
    "city": "Delhi",
    "photos": ["..."],
    "amenities": ["AC", "Pool"],
    "contactInfo": { "address": "East Delhi", "phoneNumber": "9829391929", "email": "hello@hotel.com", "location": "77.2090,28.6139" },
    "active": true
  },
  "rooms": [
    {
      "id": 1,
      "type": "Deluxe Room",
      "photos": ["..."],
      "amenities": ["WiFi", "AC"],
      "price": 1500
    }
  ]
}
```

---

### 6.4 Bookings

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings/init` | Initialize a new booking |
| GET | `/bookings/:bookingId` | Get booking status |
| POST | `/bookings/:bookingId/addGuests` | Add guests to booking |
| POST | `/bookings/:bookingId/removeGuests` | Remove guests from booking |
| POST | `/bookings/:bookingId/payments` | Mark booking as paid (CONFIRMED) |
| POST | `/bookings/:bookingId/cancel` | Cancel a booking |

**POST /bookings/init**

Request body:
```json
{
  "hotelId": 1,
  "roomId": 1,
  "checkInDate": "2026-06-01",
  "checkOutDate": "2026-06-03",
  "roomsCount": 1
}
```

Response (201):
```json
{
  "data": {
    "id": 1,
    "userId": 2,
    "hotelId": 1,
    "roomId": 1,
    "roomType": "Deluxe Room",
    "roomsCount": 1,
    "checkInDate": "2026-06-01",
    "checkOutDate": "2026-06-03",
    "bookingStatus": "PAYMENTS_PENDING",
    "amount": 3000,
    "guestIds": [],
    "hotel": { "name": "Hotel Almond Resorts and Spa", "city": "Delhi" },
    "guests": [],
    "createdAt": "2026-05-10T...",
    "updatedAt": "2026-05-10T..."
  }
}
```

**POST /bookings/:bookingId/addGuests**

Request body:
```json
{
  "guestIds": [1, 2]
}
```

**POST /bookings/:bookingId/payments**

No body required. Changes status to `CONFIRMED`.

**POST /bookings/:bookingId/cancel**

No body required. Changes status to `CANCELLED`.

---

### 6.5 Admin - Hotels

All admin endpoints require `Authorization: Bearer <token>` header with an ADMIN role user.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/hotels` | Get all hotels |
| POST | `/admin/hotels` | Create a new hotel |
| GET | `/admin/hotels/:hotelId` | Get single hotel |
| PUT | `/admin/hotels/:hotelId` | Update a hotel |

**POST /admin/hotels**

Request body:
```json
{
  "name": "Grand Palace Hotel",
  "city": "Mumbai",
  "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  "amenities": ["WiFi", "Pool", "Gym", "Spa"],
  "contactInfo": {
    "address": "Marine Drive, Mumbai",
    "phoneNumber": "9876543210",
    "email": "info@grandpalace.com",
    "location": "72.8777,19.0760"
  }
}
```

Response (201):
```json
{
  "data": {
    "id": 1,
    "name": "Grand Palace Hotel",
    "city": "Mumbai",
    "photos": ["..."],
    "amenities": ["WiFi", "Pool", "Gym", "Spa"],
    "contactInfo": { "address": "Marine Drive, Mumbai", "..." },
    "active": true,
    "createdAt": "2026-05-10T..."
  }
}
```

---

### 6.6 Admin - Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/hotels/:hotelId/rooms` | Get all rooms for a hotel |
| GET | `/admin/hotels/:hotelId/rooms/:roomId` | Get single room |
| POST | `/admin/hotels/:hotelId/rooms` | Create a room |
| DELETE | `/admin/hotels/:hotelId/rooms/:roomId` | Delete a room |

**POST /admin/hotels/:hotelId/rooms**

Request body:
```json
{
  "type": "Presidential Suite",
  "basePrice": 5000,
  "photos": ["https://example.com/room.jpg"],
  "amenities": ["WiFi", "AC", "Jacuzzi", "King Bed"],
  "totalCount": 3,
  "capacity": 4
}
```

Response (201):
```json
{
  "data": {
    "id": 1,
    "hotelId": 1,
    "type": "Presidential Suite",
    "basePrice": 5000,
    "price": 5000,
    "photos": ["..."],
    "amenities": ["WiFi", "AC", "Jacuzzi", "King Bed"],
    "totalCount": 3,
    "capacity": 4
  }
}
```

---

### 6.7 Admin - Bookings & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/hotels/:hotelId/bookings` | All bookings for a hotel |
| GET | `/admin/hotels/:hotelId/reports` | Revenue & booking stats |

**GET /admin/hotels/:hotelId/reports?startDate=2026-01-01**

Response:
```json
{
  "bookingCount": 15,
  "totalRevenue": 75000,
  "avgRevenue": 5000
}
```

---

### 6.8 Admin - Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/inventory/rooms/:roomId` | Get inventory for a room |
| PATCH | `/admin/inventory/rooms/:roomId` | Update inventory for date range |

**PATCH /admin/inventory/rooms/:roomId**

Request body:
```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-10",
  "surgeFactor": 1.5,
  "closed": false
}
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "roomId": 1,
      "date": "2026-06-01",
      "bookedCount": 0,
      "reservedCount": 0,
      "surgeFactor": 1.5,
      "price": 7500,
      "closed": false
    }
  ]
}
```

---

### 6.9 File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload one or more images |

Requires `Authorization: Bearer <token>` header.

**How to upload:**

Send a `multipart/form-data` request with field name `photos`.

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "photos=@/path/to/image1.jpg" \
  -F "photos=@/path/to/image2.png"
```

Response:
```json
{
  "data": {
    "urls": [
      "http://localhost:8080/uploads/1716000000-123456789.jpg",
      "http://localhost:8080/uploads/1716000001-987654321.png"
    ]
  }
}
```

**Constraints:**
- Max file size: 5MB per file
- Max files per request: 10
- Allowed formats: JPEG, JPG, PNG, WebP, GIF
- Files are saved to `public/uploads/` and served statically

---

## 7. Data Models

### 7.1 User

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| name | string | Full name |
| email | string | Unique email address |
| password | string | Bcrypt hashed password |
| dateOfBirth | string | Format: YYYY-MM-DD |
| gender | string | "male", "female", or "other" |
| roles | string[] | Array of roles: "USER", "ADMIN" |

### 7.2 Hotel

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| name | string | Hotel name |
| city | string | City where hotel is located |
| photos | string[] | Array of image URLs |
| amenities | string[] | Array of amenity names |
| contactInfo | object | `{ address, phoneNumber, email, location }` |
| active | boolean | Whether hotel is visible in search |
| createdAt | string | ISO date string |

### 7.3 Room

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| hotelId | number | Reference to hotel |
| type | string | Room type name (e.g. "Deluxe Suite") |
| basePrice | number | Price per night |
| price | number | Same as basePrice (for compatibility) |
| photos | string[] | Array of image URLs |
| amenities | string[] | Array of amenity names |
| totalCount | number | Total rooms of this type |
| capacity | number | Max guests per room |

### 7.4 Booking

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| userId | number | Reference to user |
| hotelId | number | Reference to hotel |
| roomId | number | Reference to room |
| roomType | string | Snapshot of room type name |
| roomsCount | number | Number of rooms booked |
| checkInDate | string | Format: YYYY-MM-DD |
| checkOutDate | string | Format: YYYY-MM-DD |
| bookingStatus | string | "PAYMENTS_PENDING", "CONFIRMED", or "CANCELLED" |
| amount | number | Total booking amount |
| guestIds | number[] | Array of guest IDs |
| createdAt | string | ISO date string |
| updatedAt | string | ISO date string |

### 7.5 Guest (Traveller)

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| userId | number | Reference to user who created this guest |
| name | string | Guest full name |
| gender | string | "male", "female", or "other" |
| dateOfBirth | string | Format: YYYY-MM-DD |

### 7.6 Inventory

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-incremented ID |
| roomId | number | Reference to room |
| date | string | Format: YYYY-MM-DD |
| bookedCount | number | Number of rooms booked on this date |
| reservedCount | number | Number of rooms reserved |
| surgeFactor | number | Price multiplier (1 = no surge) |
| price | number | Calculated: basePrice × surgeFactor |
| closed | boolean | Whether room is closed on this date |

---

## 8. Image Upload - How It Works

### Flow:

1. User clicks the "+" image button in Create Hotel or Create Room form
2. File picker opens → user selects image(s)
3. Frontend sends files to `POST /api/v1/upload` as `multipart/form-data`
4. Backend saves files to `public/uploads/` with unique filenames
5. Backend returns array of URLs (e.g. `http://localhost:8080/uploads/167...123.jpg`)
6. Frontend adds these URLs to the photos array in the form
7. When form submits, the photos array (now containing server URLs) is sent with the hotel/room data

### Where images are stored:

```
hotel-management-backend/
└── public/
    └── uploads/
        ├── 1716000000-123456789.jpg
        ├── 1716000001-987654321.png
        └── ...
```

These are served statically by Express, so `http://localhost:8080/uploads/filename.jpg` is accessible directly in the browser.

---

## 9. Integrating with Hotel Booking App (Frontend)

### 9.1 Environment Variable

The frontend's `.env` file already points to this backend:

```env
VITE_SERVER_BASE_URL=http://localhost:8080/api/v1
```

**No change needed** — just make sure this backend is running on port 8080.

### 9.2 Frontend Code Changes Already Made

The following fixes were applied to the `hotel-booking-app` frontend to work correctly with this backend:

| File | Change | Reason |
|------|--------|--------|
| `src/lib/hooks/useQuery.js` | `response.data` → `response` | Axios interceptor already unwraps `.data` |
| `src/lib/hooks/useMutation.js` | `response.data` → `response` | Same reason |
| `src/lib/axios-instance.js` | `response.data.accessToken` → `response.accessToken` | Same reason (refresh token) |
| `src/app/admin/create-hotels/create-hotel-form.jsx` | Fixed `onChange` to upload files | Was broken — didn't read selected files |
| `src/app/admin/create-room/create-room-form.jsx` | Fixed `onChange` to upload files | Same issue |

### 9.3 Steps to Run Both Together

**Terminal 1 — Start the backend:**

```bash
cd hotel-management-backend
npm install
npm run dev
```

You should see:
```
Server running on http://localhost:8080
Admin panel: http://localhost:8080/admin.html
```

**Terminal 2 — Start the frontend:**

```bash
cd hotel-booking-app
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

**Initial Setup:**

1. Open `http://localhost:8080/admin.html`
2. Login with `admin@hotel.com` / `admin123`
3. Go to "Seed Data" tab → click "Seed Sample Data"
4. Now open `http://localhost:5173` — hotels will appear in search

---

## 10. Seeding Sample Data

### Option A: Via Admin Panel

1. Go to `http://localhost:8080/admin.html`
2. Click the "Seed Data" tab
3. Click "Seed Sample Data"

This creates:
- 3 hotels (Delhi, Mumbai, Bangalore)
- 2 rooms per hotel (6 rooms total)

### Option B: Via API

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"admin123"}' | jq -r '.data.accessToken')

# Create a hotel
curl -X POST http://localhost:8080/api/v1/admin/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Hotel",
    "city": "Goa",
    "photos": ["https://example.com/photo.jpg"],
    "amenities": ["Beach", "Pool"],
    "contactInfo": {"address": "Calangute Beach Road", "phoneNumber": "9999999999", "email": "info@myhotel.com", "location": "73.7554,15.5449"}
  }'
```

### Option C: Delete and Recreate

Delete `src/data/db.json` and restart the server. It will recreate with default users.

---

## 11. Project Structure

```
hotel-management-backend/
├── package.json              # Dependencies and scripts
├── .gitignore                # Ignores node_modules, db.json, uploads
├── README.md                 # This file
├── public/
│   ├── admin.html            # Admin panel UI (add hotels, rooms, etc.)
│   └── uploads/              # Uploaded images stored here (auto-created)
└── src/
    ├── index.js              # Express app entry point
    ├── db.js                 # JSON file database (read/write)
    ├── jwt.js                # JWT token utilities
    ├── data/
    │   └── db.json           # Database file (auto-created on first run)
    ├── middleware/
    │   └── auth.js           # Auth & admin role middleware
    └── routes/
        ├── auth.js           # /api/v1/auth/* (signup, login, refresh, logout)
        ├── users.js          # /api/v1/users/* (profile, guests)
        ├── hotels.js         # /api/v1/hotels/* (search, hotel info)
        ├── bookings.js       # /api/v1/bookings/* (init, payments, cancel)
        ├── admin.js          # /api/v1/admin/* (CRUD hotels, rooms, inventory)
        └── upload.js         # /api/v1/upload (image file uploads)
```

---

## 12. Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module 'express'` | Run `npm install` in the backend directory |
| Port 8080 already in use | Kill the process: `lsof -ti:8080 \| xargs kill` or change PORT in `src/index.js` |
| Login fails with "Invalid email or password" | Delete `src/data/db.json` and restart — it recreates with fresh hashed passwords |
| CORS errors in browser | Make sure backend is running on port 8080 and frontend on 5173 or 3000 |
| Images not showing after upload | Check that `public/uploads/` directory exists and has the files |
| Frontend shows no hotels | Seed data first via admin panel or API |
| `401 Unauthorized` on admin endpoints | Make sure you're logged in as `admin@hotel.com` (has ADMIN role) |
| Database corrupted | Delete `src/data/db.json` and restart the server |
