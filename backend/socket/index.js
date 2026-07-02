/**
 * Socket.IO handler
 * Rooms:
 *   rider:<userId>   — joined by riders to receive ride updates
 *   driver:<driverId> — joined by drivers to receive cancellations
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.id}`);

    // Client joins their personal room after auth
    socket.on('join', ({ userId, role }) => {
      const room = `${role}:${userId}`;
      socket.join(room);
      console.log(`   ↳ joined room: ${room}`);
    });

    // Driver broadcasts location while on a trip
    socket.on('driver:location_update', ({ driverId, lat, lng, rideId }) => {
      // Emit to the rider tracking this ride
      if (rideId) {
        socket.broadcast.emit(`ride:${rideId}:driver_location`, { lat, lng });
      }
      socket.broadcast.emit('driver:location_update', { driverId, lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`🔌  Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
