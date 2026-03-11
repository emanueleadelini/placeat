import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Extend render options type
type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialUser?: { uid: string; email: string } | null;
};

/**
 * Custom render function that wraps components with necessary providers
 * For now, this is a basic implementation. Add Firebase Auth provider wrapper
 * when you have authentication context set up.
 */
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialUser = null, ...renderOptions } = options;

  // Wrapper component for providers
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    // Add your Firebase providers here when you have them
    // Example:
    // return (
    //   <AuthContext.Provider value={{ user: initialUser }}>
    //     {children}
    //   </AuthContext.Provider>
    // );
    return <>{children}</>;
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export userEvent setup helper
export { userEvent };

/**
 * Helper to create mock Firestore timestamps
 */
export const createMockTimestamp = (date: Date = new Date()) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: () => false,
});

/**
 * Helper to wait for promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to create a mock Firebase document snapshot
 */
export const createMockDocSnapshot = (
  exists: boolean,
  data: Record<string, unknown> | null = null,
  id: string = 'mock-id'
) => ({
  exists: exists as boolean,
  data: () => data,
  id,
  ref: { id, path: `collection/${id}` },
});
