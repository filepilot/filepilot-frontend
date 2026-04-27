import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Logo from '../components/Logo';

describe('Logo', () => {
  it('renders an img with alt text', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: /filepilot logo/i });
    expect(img).toBeInTheDocument();
  });

  it('uses the default size of 28 when no prop provided', () => {
    render(<Logo />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '28');
    expect(img).toHaveAttribute('height', '28');
  });

  it('applies a custom size prop', () => {
    render(<Logo size={48} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
  });
});
