# RideShare Platform (Capstone Project)

An end-to-end, dual-facing **RideSharing Application** (an Uber/Lyft clone) built to demonstrate modern full-stack web development. The platform consists of a centralized Node.js/Express backend server, a client application for Riders, and a client application for Drivers. It features real-time GPS tracking, automated distance and fare calculations, and interactive maps.

---

## 🚀 Repository Structure

The workspace is organized as a monorepo containing three core folders:

*   **[`backend/`](./backend)**: Express.js server utilizing MongoDB (via Mongoose) and Socket.io for real-time location sharing and booking synchronization.
*   **[`rider-app/`](./rider-app)**: React + Vite web client for passengers to select route coordinates, request rides, track drivers, and complete payments/ratings.
*   **[`driver-app/`](./driver-app)**: React + Vite web client for drivers to toggle availability, receive incoming requests, track earnings, and navigate via interactive maps.

---

## 🛠️ Technology Stack & Packages Used

### 1. Backend Server (`backend/`)
*   **`express`**: Minimalist web framework for running REST API routes (logins, histories, profile management).
*   **`mongoose`**: Object Data Modeling (ODM) library for MongoDB, enforcing data structure schemas.
*   **`socket.io`**: WebSocket library facilitating low-latency bidirectional events (sending ride offers and broadcasting coordinates).
*   **`bcryptjs`**: Cryptographic tool to securely hash and verify user passwords.
*   **`jsonwebtoken (jwt)`**: signs stateless security tokens sent in request headers for role-based authentication.
*   **`cors`**: Middleware allowing API calls across different client ports.
*   **`express-validator`**: Input validation middleware ensuring secure and clean payloads.

### 2. Frontend Applications (`rider-app/` & `driver-app/`)
*   **`react` & `react-dom`**: Modular component-based client framework.
*   **`react-router-dom`**: Handles SPA routing and client-side page guards.
*   **`axios`**: Promise-based HTTP client for calling Express API endpoints.
*   **`leaflet` & `react-leaflet`**: Interactive mapping engine displaying open-source maps, routes, and custom vehicle markers.
*   **`socket.io-client`**: Establishes persistent WebSocket links to emit location coordinates and receive updates.

---

## 🗄️ Database Schemas (MongoDB)

### **User Schema**
Represents a generic registered user who can log in.
*   `username` (String, Unique)
*   `password` (String, Hashed using bcrypt)
*   `role` (String: `'rider'` or `'driver'`)

### **Driver Schema**
Extends User accounts to hold active driver profiles.
*   `user` (ObjectId ref User)
*   `vehicleInfo`: `{ make, model, plate, color }`
*   `location`: `{ lat, lng }` (last known GPS coordinate)
*   `isAvailable` (Boolean)
*   `rating` (Number, 1-5 scale)
*   `totalRides` / `totalEarnings` (Numbers for dashboard metrics)

### **Ride Schema**
Tracks booking details, status, and financials.
*   `rider` (ObjectId ref User)
*   `driver` (ObjectId ref Driver, nullable)
*   `pickup` / `dropoff`: `{ address, lat, lng }`
*   `status` (String: `'pending'`, `'accepted'`, `'in_progress'`, `'completed'`, `'cancelled'`)
*   `fare` (Number, in USD)
*   `distance` (Number, in kilometers)
*   `riderRating` (Number, rating given after completion)

---

## 🔄 How the System Works (Core Flows)

1.  **Authentication**: Users sign up or log in. Passwords are encrypted on signup. On login, the server issues a JWT token. The client stores the token in localStorage and sends it in the `Authorization: Bearer <token>` header for subsequent requests.
2.  **Requesting a Ride**:
    *   The rider chooses pickup/dropoff on their map.
    *   The server calculates distance using the **Haversine Formula** (which measures distance on a sphere using latitude and longitude).
    *   Fare is calculated as a base price of **$2.50 + $1.20 per km**.
    *   The backend saves the ride as `pending` and emits `ride:new_request` over WebSockets to all connected drivers.
3.  **Accepting a Ride**:
    *   A driver accepts a request. The server marks the ride as `accepted` and assigns the driver.
    *   A direct Socket.io update is sent to the rider's personal channel (`rider:<userId>`) to update their interface with the driver's vehicle and name.
    *   A public `ride:accepted` event is sent to all other drivers so the request disappears from their dashboards.
4.  **Live GPS Synchronization**:
    *   While driving, the driver app updates the backend with their location coordinates.
    *   The backend updates the database and immediately broadcasts `ride:<rideId>:driver_location` to the tracking rider's map, sliding the driver's car marker in real-time.
5.  **Trip Completion & Rating**:
    *   On arrival, the driver completes the ride. The server registers completion, updates the driver's earnings, and signals the rider.
    *   The rider app shows a rating prompt. Once submitted, the backend re-calculates the driver's rating using a weighted rolling average.

---

## ⚙️ Running Locally

### **Prerequisites**
*   **NodeJS** (v18+)
*   **MongoDB** (local connection or MongoDB Atlas URI)

### **1. Clone the Repository**
```bash
git clone https://github.com/kumbar677/capstone_project.git
cd capstone_project
```

### **2. Set Up Environment Variables**
Create a `.env` file in the **`backend`** folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_RIDER_URL=http://localhost:5173
CLIENT_DRIVER_URL=http://localhost:5174
```

### **3. Install Dependencies**
Install all packages in the root workspace, backend, and both frontends:
```bash
# In Root
npm install

# In Backend
cd backend && npm install && cd ..

# In Rider App
cd rider-app && npm install && cd ..

# In Driver App
cd driver-app && npm install && cd ..
```

### **4. Run the Platform**
You can launch the entire ecosystem (Backend, Rider, and Driver Apps) simultaneously using the root runner:
```bash
npm run dev
```
*   **Backend Server**: running on [http://localhost:5000](http://localhost:5000)
*   **Rider App**: running on [http://localhost:5173](http://localhost:5173)
*   **Driver App**: running on [http://localhost:5174](http://localhost:5174)

---

## 📄 Project Documentation PDF
For an in-depth technical walkthrough of the backend API endpoints, database structures, and socket event names, please refer to the pre-generated **[project_documentation.pdf](./project_documentation.pdf)** located at the root of this project.
