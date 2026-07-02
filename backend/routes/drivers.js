const express = require('express');
const Driver = require('../models/Driver');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/drivers/me
router.get('/me', requireAuth('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id }).populate('user', 'username');
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drivers/location  — update GPS position
router.patch('/location', requireAuth('driver'), async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined)
    return res.status(400).json({ error: 'lat and lng are required' });

  try {
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      { location: { lat, lng } },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });

    // Broadcast new location to any rider tracking this driver
    req.io.emit('driver:location_update', { driverId: driver._id, lat, lng });

    res.json({ location: driver.location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drivers/availability
router.patch('/availability', requireAuth('driver'), async (req, res) => {
  const { isAvailable } = req.body;
  if (typeof isAvailable !== 'boolean')
    return res.status(400).json({ error: 'isAvailable must be a boolean' });

  try {
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      { isAvailable },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    res.json({ isAvailable: driver.isAvailable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
