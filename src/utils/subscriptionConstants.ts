// Subscription plan IDs in our application
export const PLAN_IDS = {
  FREE: '1',
  STARTER: '2',
  PRO: '3',
  ENTERPRISE: '4'
};

// Mapping between our app's plan IDs and Stripe price IDs
// These are actual test Stripe price IDs (the same ones used previously in stripe-service.ts)
export const PLAN_TO_PRICE_MAP: Record<string, string> = {
  // Free plan doesn't have a price ID
  [PLAN_IDS.FREE]: '',
  // Test price IDs for Stripe
  [PLAN_IDS.STARTER]: 'price_1QzuV407Sez9m06J0x9IUqhR',   // Starter plan (Monthly)
  [PLAN_IDS.PRO]: 'price_1QzuVA07Sez9m06JbNwIzPcV',       // Pro plan (Monthly)
  [PLAN_IDS.ENTERPRISE]: 'price_1QzueA07Sez9m06JkNgQEjoH',  // Enterprise plan (Monthly)
  '2_yearly': 'price_1R3sf407Sez9m06JbDNww2NK', // Starter plan (Yearly)
  '3_yearly': 'price_1R3sfM07Sez9m06J1fVVUcQw', // Pro plan (Yearly)
  '4_yearly': 'price_1R3sfS07Sez9m06J92oF5Ubv'  // Enterprise plan (Yearly)
};

// Reverse mapping for looking up plan IDs from price IDs
export const PRICE_TO_PLAN_MAP: Record<string, string> =
  Object.entries(PLAN_TO_PRICE_MAP).reduce((acc, [planId, priceId]) => {
    if (priceId) acc[priceId] = planId.replace('_yearly', '');
    return acc;
  }, {} as Record<string, string>);

// Default pricing data
export const PLAN_PRICING = {
  [PLAN_IDS.FREE]: {
    monthly: 0.00,
    yearly: 0.00
  },
  [PLAN_IDS.STARTER]: {
    monthly: 9.99,
    yearly: 99.99  // ~2 months free
  },
  [PLAN_IDS.PRO]: {
    monthly: 19.99,
    yearly: 199.99  // ~2 months free
  },
  [PLAN_IDS.ENTERPRISE]: {
    monthly: 99.99,
    yearly: 999.99  // ~2 months free
  }
};

// Plan features and limits
export const PLAN_FEATURES = {
  [PLAN_IDS.FREE]: {
    apiCalls: 100,
    storage: 100 * 1024 * 1024, // 100 MB
    modelLimit: 5,
    supportLevel: 'email',
    customization: false,
    analytics: false
  },
  [PLAN_IDS.STARTER]: {
    apiCalls: 1000,
    storage: 500 * 1024 * 1024, // 500 MB
    modelLimit: 20,
    supportLevel: 'priority_email',
    customization: true,
    analytics: false
  },
  [PLAN_IDS.PRO]: {
    apiCalls: 10000,
    storage: 2 * 1024 * 1024 * 1024, // 2 GB
    modelLimit: 50,
    supportLevel: 'live_chat',
    customization: true,
    analytics: true
  },
  [PLAN_IDS.ENTERPRISE]: {
    apiCalls: 100000,
    storage: 10 * 1024 * 1024 * 1024, // 10 GB
    modelLimit: 100,
    supportLevel: 'dedicated',
    customization: true,
    analytics: true
  }
};

// Plan names
export const PLAN_NAMES = {
  [PLAN_IDS.FREE]: 'Free',
  [PLAN_IDS.STARTER]: 'Starter',
  [PLAN_IDS.PRO]: 'Pro',
  [PLAN_IDS.ENTERPRISE]: 'Enterprise'
};
