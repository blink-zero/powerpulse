import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../../components/navigation/Footer';
import appConfig from '../../config/appConfig';

// Mock appConfig to control test values
vi.mock('../../config/appConfig', () => ({
  default: {
    version: '1.8.2',
    appName: 'PowerPulse',
    githubUrl: 'https://github.com/blink-zero/powerpulse',
    copyrightYear: 2025,
    copyrightOwner: 'blink-zero'
  }
}));

describe('Footer Component', () => {
  // Helper function to render the Footer with Router context
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  it('renders without crashing', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays the correct version number', () => {
    renderFooter();
    expect(screen.getByText(`v${appConfig.version}`)).toBeInTheDocument();
  });

  it('displays the correct copyright information', () => {
    renderFooter();
    const year = appConfig.copyrightYear;
    const owner = appConfig.copyrightOwner;
    expect(screen.getByText(`© ${year} ${owner}`)).toBeInTheDocument();
  });

  it('includes a link to the GitHub repository', () => {
    renderFooter();
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', appConfig.githubUrl);
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays the app name', () => {
    renderFooter();
    expect(screen.getByText(appConfig.appName)).toBeInTheDocument();
  });

  it('has the correct CSS classes for styling', () => {
    renderFooter();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-white');
    expect(footer).toHaveClass('dark:bg-gray-800');
    expect(footer).toHaveClass('border-t');
  });

  it('is responsive with appropriate padding', () => {
    renderFooter();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('px-4');
    expect(footer).toHaveClass('py-3');
    expect(footer).toHaveClass('sm:px-6');
  });
});
