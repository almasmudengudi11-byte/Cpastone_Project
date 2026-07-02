const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleInfo: {
      make: { type: String, default: 'Unknown' },
      model: { type: String, default: 'Unknown' },
      plate: { type: String, default: 'XXX-000' },
      color: { type: String, default: 'White' },
    },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    isAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
