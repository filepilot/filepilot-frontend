import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer', () => {
  it('renders the Filepilot brand name', () => {
    render(<Footer />);
    // There may be multiple instances (logo text + footer text)
    expect(screen.getAllByText('Filepilot').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/©2026 Filepilot/i)).toBeInTheDocument();
  });

  it('renders all six column headings', () => {
    render(<Footer />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Help and security')).toBeInTheDocument();
    expect(screen.getByText('Terms and policies')).toBeInTheDocument();
  });

  it('renders some expected column items', () => {
    render(<Footer />);
    expect(screen.getByText('Version control')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Privacy policy')).toBeInTheDocument();
  });

  it('renders social media images', () => {
    render(<Footer />);
    expect(screen.getByAltText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByAltText('X')).toBeInTheDocument();
  });
});
