import type { SubscriptionPlan } from '../contexts/AuthContext';
import { PLAN_TO_PRICE_MAP, PRICE_TO_PLAN_MAP } from '../utils/subscriptionConstants';
import Stripe from 'stripe';

// Define Stripe API endpoints
const STRIPE_API = {
  createCustomer: '/api/create-stripe-customer',
  updateCustomer: '/api/update-stripe-customer',
  createSession: '/api/create-checkout-session',
  retrieveSession: '/api/retrieve-session',
  getSubscription: '/api/subscriptions',
  getCustomerSubscriptions: '/api/customer-subscriptions',
  updateSubscription: '/api/subscriptions',
  cancelSubscription: '/api/subscriptions/cancel',
  createPortalSession: '/api/create-portal-session'
};

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  start_date: number;
  canceled_at: number | null;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
      }
    }>
  };
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface CheckoutSessionParams {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface CustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CustomerUpdateParams {
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

class StripeService {
  private apiRoot: string;

  constructor(apiRoot = '') {
    this.apiRoot = apiRoot;
  }

  /**
   * Find a Stripe customer by email
   */
  private async findCustomerByEmail(stripe: Stripe, email: string): Promise<StripeCustomer | null> {
    try {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error: any) {
      console.error('Error searching for Stripe customer:', error);
      return null;
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(params: CustomerParams): Promise<StripeCustomer> {
    if (!import.meta.env.VITE_STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured');
    }

    const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    try {
      // First check if customer already exists
      const existingCustomer = await this.findCustomerByEmail(stripe, params.email);
      if (existingCustomer) {
        console.log('Customer already exists in Stripe:', existingCustomer.id);
        return existingCustomer;
      }

      // Create new customer if none exists
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
        description: 'Customer created through etherOI platform'
      });
      return customer;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create Stripe customer';
      console.error('Stripe customer creation error:', error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a Stripe customer
   */
  async updateCustomer(customerId: string, updates: CustomerUpdateParams): Promise<StripeCustomer> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.updateCustomer}/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to update Stripe customer');
    }

    return response.json();
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: CheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.createSession}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: params.priceId,
        customerId: params.customerId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Get checkout session details
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.retrieveSession}/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to retrieve checkout session');
    }

    return response.json();
  }

  /**
   * Create a customer portal session using Stripe SDK
   */
  async createCustomerPortalSession(params: CustomerPortalParams): Promise<{ url: string }> {
    if (!import.meta.env.VITE_STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured');
    }

    const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    try {
      // First check if portal configuration exists
      let configurations = await stripe.billingPortal.configurations.list({
        limit: 1,
        active: true
      });

      // If no configuration exists, create a default one
      if (!configurations.data.length) {
        const defaultConfig = await stripe.billingPortal.configurations.create({
          business_profile: {
            headline: 'etherOI Subscription Management'
          },
          features: {
            customer_update: {
              allowed_updates: ['email', 'address'],
              enabled: true
            },
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            subscription_cancel: { enabled: true },
            subscription_pause: { enabled: false }
          }
        });
        configurations.data = [defaultConfig];
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
        configuration: configurations.data[0].id
      });

      return { url: session.url };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create portal session';
      console.error('Stripe portal session creation error:', error);
      
      // Provide more specific error message for common issues
      if (error.type === 'StripeInvalidRequestError') {
        if (error.message.includes('No such customer')) {
          throw new Error('Customer not found in Stripe');
        } else if (error.message.includes('configuration')) {
          throw new Error('Stripe customer portal configuration is missing or invalid. Please check your Stripe dashboard settings.');
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.getSubscription}/${subscriptionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to retrieve subscription');
    }

    return response.json();
  }

  /**
   * Get subscriptions for a customer
   */
  async getCustomerSubscriptions(customerId: string): Promise<{ data: StripeSubscription[] }> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.getCustomerSubscriptions}/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to retrieve customer subscriptions');
    }

    return response.json();
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<StripeSubscription> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.updateSubscription}/${subscriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: newPriceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to update subscription');
    }

    return response.json();
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{ canceled: boolean }> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.cancelSubscription}/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to cancel subscription');
    }

    return response.json();
  }

  /**
   * Retrieve checkout session by ID
   */
  async retrieveSession(sessionId: string): Promise<any> {
    const response = await fetch(`${this.apiRoot}${STRIPE_API.retrieveSession}/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      // throw new Error(error.message || 'Failed to retrieve checkout session');
    }

    return response.json();
  }

  /**
   * Create a Stripe customer or return the billing portal URL
   */
  async createStripeCustomer(params: CustomerParams): Promise<StripeCustomer> {
    if (!import.meta.env.VITE_STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured');
    }

    const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
        description: 'Customer created through etherOI platform'
      });
      return customer;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create Stripe customer';
      console.error('Stripe customer creation error:', error);
      throw new Error(errorMessage);
    }
  }
}

// Export a singleton instance of the service
const stripeService = new StripeService();
export default stripeService;
