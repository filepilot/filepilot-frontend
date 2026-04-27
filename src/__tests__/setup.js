import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically unmount / clean up after each test
afterEach(() => {
  cleanup();
});

// jsdom needs a full URL for axios URL helpers; also stub non-writable members
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost/',
    pathname: '/',
    replace: vi.fn(),
    assign: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});
