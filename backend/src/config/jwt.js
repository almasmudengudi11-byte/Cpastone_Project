const JWT_CONFIG = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'uber_clone_super_secret_access_jwt_key_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'uber_clone_super_secret_refresh_jwt_key_2026',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

module.exports = { JWT_CONFIG };
