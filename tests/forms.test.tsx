import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { AppProvider } from '../src/app/context';
import { RequestForm } from '../src/features/resident/RequestForm';
// Layout-dependent Leaflet behavior is covered by Playwright, not jsdom.
vi.mock('../src/features/maps/WasteMap', () => ({ default: () => <div>Map</div> }));

beforeEach(() => localStorage.clear());
it('resident form provides accessible required field feedback', async () => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <AppProvider>
          <RequestForm />
        </AppProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Submit pickup request' }));
  expect(await screen.findByText('Enter an approximate quantity')).toBeVisible();
  expect(screen.getByLabelText('Pickup address *')).toBeVisible();
  expect(
    screen.getByText('Please segregate waste and confirm before requesting pickup'),
  ).toBeVisible();
});
