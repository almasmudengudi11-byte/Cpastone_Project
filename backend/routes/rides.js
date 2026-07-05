const express = require('express');
const { body, validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcFare(distanceKm) {
  const BASE_FARE = 2.5;
  const PER_KM = 1.2;
  return Math.round((BASE_FARE + PER_KM * distanceKm) * 100) / 100;
}

// POST /api/rides  — rider creates a ride request
router.post(
  '/',
  requireAuth('rider'),
  [
    body('pickup.address').notEmpty(),
    body('pickup.lat').isNumeric(),
    body('pickup.lng').isNumeric(),
    body('dropoff.address').notEmpty(),
    body('dropoff.lat').isNumeric(),
    body('dropoff.lng').isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { pickup, dropoff, serviceType, promoApplied } = req.body;
    const distance = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    // Calculate base and perKm rates based on serviceType
    let base = 2.5;
    let perKm = 1.2;
    const sType = serviceType || 'Comfort';
    if (sType === 'Eco') {
      base = 1.5;
      perKm = 0.8;
    } else if (sType === 'Elite') {
      base = 4.5;
      perKm = 2.0;
    } else if (sType === 'Moto') {
      base = 1.0;
      perKm = 0.5;
    }

    const rawFare = base + perKm * distance;
    let discount = 0;

    if (promoApplied) {
      const code = promoApplied.toUpperCase();
      if (code === 'WELCOME10') {
        discount = rawFare * 0.10;
      } else if (code === 'PREMIUM50' && sType === 'Elite') {
        discount = Math.min(rawFare, 5.0);
      } else if (code === 'SAVEMORE') {
        discount = Math.min(rawFare * 0.20, 3.0);
      }
    }

    const finalFare = Math.max(Math.round((rawFare - discount) * 100) / 100, 0.5);
    const savedDiscount = Math.round(discount * 100) / 100;

    try {
      const ride = await Ride.create({
        rider: req.user.id,
        pickup,
        dropoff,
        distance: Math.round(distance * 100) / 100,
        serviceType: sType,
        promoApplied: promoApplied || null,
        discount: savedDiscount,
        fare: finalFare,
      });

      // Notify all connected drivers via socket
      req.io.emit('ride:new_request', ride);

      res.status(201).json(ride);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/rides/available  — drivers see pending rides
router.get('/available', requireAuth('driver'), async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'pending' })
      .populate('rider', 'username')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rides/my  — rider sees their own rides
router.get('/my', requireAuth('rider'), async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id })
      .populate('driver')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rides/driver  — driver sees their own rides
router.get('/driver', requireAuth('driver'), async (req, res) => {
  try {
    const driverProfile = await Driver.findOne({ user: req.user.id });
    if (!driverProfile) return res.status(404).json({ error: 'Driver profile not found' });
    const rides = await Ride.find({ driver: driverProfile._id })
      .populate('rider', 'username')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rides/:id/accept  — driver accepts a ride
router.patch('/:id/accept', requireAuth('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'pending')
      return res.status(409).json({ error: 'Ride is no longer available' });

    const driverProfile = await Driver.findOne({ user: req.user.id });
    if (!driverProfile) return res.status(404).json({ error: 'Driver profile not found' });

    ride.driver = driverProfile._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    const populated = await ride.populate([
      { path: 'rider', select: 'username' },
      { path: 'driver' },
    ]);

    // Notify the specific rider
    req.io.to(`rider:${ride.rider}`).emit('ride:status_update', populated);
    req.io.emit('ride:accepted', { rideId: ride._id });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rides/:id/status  — driver updates status
router.patch('/:id/status', requireAuth('driver'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['in_progress', 'completed'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    ride.status = status;
    if (status === 'in_progress') ride.startedAt = new Date();
    if (status === 'completed') {
      ride.completedAt = new Date();
      // Update driver earnings
      await Driver.findByIdAndUpdate(ride.driver, {
        $inc: { totalRides: 1, totalEarnings: ride.fare },
      });
    }
    await ride.save();

    const populated = await ride.populate([
      { path: 'rider', select: 'username' },
      { path: 'driver' },
    ]);

    req.io.to(`rider:${ride.rider}`).emit('ride:status_update', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rides/history  — rider retrieves past rides
router.get('/history', requireAuth('rider'), async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id })
      .sort({ createdAt: -1 })
      .populate('driver');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rides/:id/cancel  — rider cancels
router.patch('/:id/cancel', requireAuth('rider'), async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, rider: req.user.id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (['completed', 'cancelled'].includes(ride.status))
      return res.status(409).json({ error: 'Cannot cancel this ride' });

    ride.status = 'cancelled';
    await ride.save();

    if (ride.driver) {
      req.io.to(`driver:${ride.driver}`).emit('ride:cancelled', { rideId: ride._id });
    }

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rides/:id/rate  — rider rates driver after completion
router.post('/:id/rate', requireAuth('rider'), async (req, res) => {
  const { rating, tip } = req.body;
  const stars = Number(rating);
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  const tipAmount = Math.max(Number(tip) || 0, 0);

  try {
    const ride = await Ride.findOne({ _id: req.params.id, rider: req.user.id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'completed')
      return res.status(409).json({ error: 'Can only rate completed rides' });
    if (ride.isRated)
      return res.status(409).json({ error: 'You have already rated this ride' });

    ride.riderRating = stars;
    ride.isRated = true;
    if (tipAmount > 0) {
      ride.tip = Math.round(tipAmount * 100) / 100;
    }
    await ride.save();

    // Update driver rating and add tip to earnings
    const driver = await Driver.findById(ride.driver);
    if (driver) {
      const prevTotal = driver.rating * driver.totalRides;
      const count = Math.max(driver.totalRides, 1);
      // If driver.totalRides was 0, count is 1. We update driver rating:
      driver.rating = Math.round(((prevTotal + stars) / (count + 1)) * 10) / 10;
      if (tipAmount > 0) {
        driver.totalEarnings = Math.round((driver.totalEarnings + tipAmount) * 100) / 100;
      }
      await driver.save();
    }

    res.json({ success: true, riderRating: stars, tip: tipAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

