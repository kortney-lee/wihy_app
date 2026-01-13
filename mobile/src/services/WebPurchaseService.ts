// Web stub for purchaseService - web uses Stripe, not IAP
// This file prevents the expo-in-app-purchases import on web

export const purchaseService = {
  initialize: async () => {
    console.log('Web: Using Stripe for payments, not IAP');
    return Promise.resolve();
  },
  getProducts: () => [],
  purchase: async (_productId: string) => {
    throw new Error('Use Stripe for web payments');
  },
  restorePurchases: async () => [],
  finishTransaction: async () => {},
  cleanup: () => {},
};
