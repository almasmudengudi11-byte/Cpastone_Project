const Stripe = require('stripe');

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const isMock = stripeSecret === 'sk_test_mock';

let stripeInstance = null;
if (!isMock) {
  stripeInstance = new Stripe(stripeSecret, {
    apiVersion: '2024-11-20.accredited',
  });
}

const stripeConfig = {
  isMock,
  createMockSession: async (amount) => {
    return {
      id: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/rider/wallet?session_id=mock_session_active`,
      amount_total: amount * 100,
    };
  }
};

module.exports = {
  stripe: stripeInstance,
  stripeConfig
};
