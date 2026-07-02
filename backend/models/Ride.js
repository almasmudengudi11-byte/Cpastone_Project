const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickup: { type: locationSchema, required: true },
    dropoff: { type: locationSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    fare: { type: Number, default: 0 },         // in USD
    distance: { type: Number, default: 0 },     // in km
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    riderRating: { type: Number, default: null, min: 1, max: 5 }, // star rating from rider
    isRated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
