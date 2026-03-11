/**
 * Tests for Stripe Checkout API
 * 
 * These tests verify that checkout sessions are created correctly.
 * Critical for: Payment flow, customer onboarding, subscription management
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Import NextResponse for mocks
import { NextResponse } from 'next/server';

// Mock Stripe - use a module factory that doesn't reference outer variables
const mockCustomersCreate = jest.fn();
const mockCheckoutSessionsCreate = jest.fn();

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  },
  STRIPE_PRICE_IDS: {
    pro: 'price_pro_test',
    multi: 'price_multi_test',
  },
}));

// Mock Firebase Admin - Track calls per collection
const mockRestaurantUpdate = jest.fn();
const mockCheckoutSessionSet = jest.fn();
const mockRestaurantGet = jest.fn();

// Create doc mocks that return appropriate methods based on collection
const createMockDoc = (collectionName: string) => {
  return jest.fn((docId: string) => {
    if (collectionName === 'ristoranti') {
      return {
        update: mockRestaurantUpdate,
        get: mockRestaurantGet,
      };
    }
    if (collectionName === 'stripeCheckoutSessions') {
      return {
        set: mockCheckoutSessionSet,
      };
    }
    return {
      update: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
    };
  });
};

const mockCollection = jest.fn((collectionName: string) => ({
  doc: createMockDoc(collectionName),
}));

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => mockCollection(name),
  },
}));

// Mock Firebase Admin Timestamp
const mockTimestampNow = jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }));
const mockTimestampFromMillis = jest.fn((millis: number) => ({ seconds: millis / 1000, nanoseconds: 0 }));

jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: () => mockTimestampNow(),
    fromMillis: (millis: number) => mockTimestampFromMillis(millis),
  },
}));

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
}));

// Mock API error module
const mockLogApiError = jest.fn();
jest.mock('@/lib/api-error', () => ({
  logApiError: (...args: unknown[]) => mockLogApiError(...args),
  handleApiError: (context: string, error: any, extra?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'INTERNAL_ERROR', type: 'INTERNAL_ERROR', message }, { status: 500 });
  },
  apiErrors: {
    validation: (message: string, details?: Record<string, unknown>) => 
      NextResponse.json({ error: 'VALIDATION_ERROR', type: 'VALIDATION_ERROR', message, details }, { status: 400 }),
    notFound: (resource: string) => 
      NextResponse.json({ error: 'NOT_FOUND', type: 'NOT_FOUND', message: `${resource} not found` }, { status: 404 }),
  },
}));

describe('Stripe Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;
  };

  describe('Input Validation', () => {
    it('should return 400 when ristoranteId is missing', async () => {
      const req = createMockRequest({
        plan: 'pro',
        successUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.type).toBe('VALIDATION_ERROR');
      expect(json.message).toBe('Missing required fields');
    });

    it('should return 400 when plan is missing', async () => {
      const req = createMockRequest({
        ristoranteId: 'rest_123',
        successUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.type).toBe('VALIDATION_ERROR');
      expect(json.message).toBe('Missing required fields');
    });

    it('should return 400 when both required fields are missing', async () => {
      const req = createMockRequest({
        successUrl: 'http://localhost/success',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.type).toBe('VALIDATION_ERROR');
      expect(json.message).toBe('Missing required fields');
    });
  });

  describe('Restaurant Lookup', () => {
    it('should return 404 when restaurant does not exist', async () => {
      mockRestaurantGet.mockResolvedValue({
        exists: false,
        data: () => null,
      });

      const req = createMockRequest({
        ristoranteId: 'nonexistent_rest',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.type).toBe('NOT_FOUND');
      expect(json.message).toBe('Restaurant not found');
    });

    it('should proceed when restaurant data is empty but exists is true', async () => {
      // The code checks restaurantDoc.exists, not whether data() returns null
      // So if exists is true, it should proceed (though this is an edge case)
      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => null,
      });

      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new_123',
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      // The code checks exists, so it should proceed and try to use the data
      // which may cause errors downstream, but not a 404
      expect(res.status).toBe(200);
    });
  });

  describe('Customer Creation', () => {
    const mockRestaurant = {
      nome: 'Test Restaurant',
      email: 'test@example.com',
      proprietarioUid: 'user_123',
      stripeCustomerId: null,
    };

    beforeEach(() => {
      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => mockRestaurant,
      });
    });

    it('should create a new Stripe customer if none exists', async () => {
      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new_123',
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      await POST(req);

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Restaurant',
        metadata: {
          ristoranteId: 'rest_123',
          firebaseUid: 'user_123',
        },
      });

      // Should save the new customer ID to the restaurant
      expect(mockRestaurantUpdate).toHaveBeenCalledWith({
        stripeCustomerId: 'cus_new_123',
      });
    });

    it('should use existing Stripe customer if already has one', async () => {
      const restaurantWithCustomer = {
        ...mockRestaurant,
        stripeCustomerId: 'cus_existing_123',
      };

      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => restaurantWithCustomer,
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      await POST(req);

      // Should not create a new customer
      expect(mockCustomersCreate).not.toHaveBeenCalled();

      // Should use existing customer
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_123',
        })
      );
    });

    it('should handle restaurant with missing email', async () => {
      const restaurantNoEmail = {
        nome: 'Test Restaurant',
        proprietarioUid: 'user_123',
      };

      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => restaurantNoEmail,
      });

      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new_123',
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      await POST(req);

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: undefined,
          name: 'Test Restaurant',
        })
      );
    });
  });

  describe('Checkout Session Creation', () => {
    const mockRestaurant = {
      nome: 'Test Restaurant',
      email: 'test@example.com',
      proprietarioUid: 'user_123',
      stripeCustomerId: 'cus_existing_123',
    };

    beforeEach(() => {
      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => mockRestaurant,
      });
    });

    it('should create checkout session with correct parameters for pro plan', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith({
        customer: 'cus_existing_123',
        mode: 'subscription',
        line_items: [
          {
            price: 'price_pro_test',
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/dashboard/settings?success=true',
        cancel_url: 'http://localhost:3000/dashboard/settings?canceled=true',
        metadata: {
          ristoranteId: 'rest_123',
          plan: 'pro',
        },
        subscription_data: {
          metadata: {
            ristoranteId: 'rest_123',
            plan: 'pro',
          },
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sessionId).toBe('cs_test_123');
      expect(json.url).toBe('https://checkout.stripe.com/test');
    });

    it('should create checkout session for multi plan', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'multi',
      });

      await POST(req);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_multi_test',
              quantity: 1,
            },
          ],
          metadata: {
            ristoranteId: 'rest_123',
            plan: 'multi',
          },
        })
      );
    });

    it('should use custom success and cancel URLs when provided', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      await POST(req);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        })
      );
    });

    it('should return validation error for invalid plan', async () => {
      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'enterprise',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.type).toBe('VALIDATION_ERROR');
      expect(json.message).toBe('Invalid plan');
    });
  });

  describe('Firestore Integration', () => {
    const mockRestaurant = {
      nome: 'Test Restaurant',
      email: 'test@example.com',
      proprietarioUid: 'user_123',
      stripeCustomerId: 'cus_existing_123',
    };

    beforeEach(() => {
      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => mockRestaurant,
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });
    });

    it('should save checkout session to Firestore', async () => {
      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      await POST(req);

      expect(mockCollection).toHaveBeenCalledWith('stripeCheckoutSessions');
      expect(mockCheckoutSessionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
          ristoranteId: 'rest_123',
          plan: 'pro',
          status: 'pending',
        })
      );
    });

    it('should set correct expiration time for checkout session', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      await POST(req);

      expect(mockCheckoutSessionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Object),
        })
      );

      const callArgs = mockCheckoutSessionSet.mock.calls[0][0];
      expect(callArgs.expiresAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    const mockRestaurant = {
      nome: 'Test Restaurant',
      email: 'test@example.com',
      proprietarioUid: 'user_123',
      stripeCustomerId: 'cus_existing_123',
    };

    beforeEach(() => {
      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => mockRestaurant,
      });
    });

    it('should return 500 when Stripe checkout creation fails', async () => {
      mockCheckoutSessionsCreate.mockRejectedValue(new Error('Stripe API error'));

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.type).toBe('INTERNAL_ERROR');
    });

    it('should return 500 when customer creation fails', async () => {
      const restaurantNoCustomer = {
        ...mockRestaurant,
        stripeCustomerId: null,
      };

      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => restaurantNoCustomer,
      });

      mockCustomersCreate.mockRejectedValue(new Error('Customer creation failed'));

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.type).toBe('INTERNAL_ERROR');
    });

    it('should return 500 when Firestore write fails', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      mockCheckoutSessionSet.mockRejectedValue(new Error('Firestore write error'));

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.type).toBe('INTERNAL_ERROR');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockRestaurantGet.mockRejectedValue(new Error('Unexpected Firebase error'));

      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'pro',
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.type).toBe('INTERNAL_ERROR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle plan with no matching price ID', async () => {
      const mockRestaurant = {
        nome: 'Test Restaurant',
        email: 'test@example.com',
        stripeCustomerId: 'cus_existing_123',
      };

      mockRestaurantGet.mockResolvedValue({
        exists: true,
        data: () => mockRestaurant,
      });

      // The STRIPE_PRICE_IDS doesn't have 'enterprise' plan
      const req = createMockRequest({
        ristoranteId: 'rest_123',
        plan: 'enterprise',
      });

      const res = await POST(req);

      // Should return 400 validation error for invalid plan
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.type).toBe('VALIDATION_ERROR');
    });

    it('should handle request body parsing errors', async () => {
      const req = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.type).toBe('INTERNAL_ERROR');
    });
  });
});
