import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { createSeed } from '../src/data/seed';

const auth = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: { user: { id: string } } | null) => void),
  profile: {},
  signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
}));
// Leaflet layout is exercised in real browsers; jsdom has no layout/ResizeObserver.
vi.mock('../src/features/maps/WasteMap', () => ({ default: () => <div>Map</div> }));
vi.mock('../src/services/supabase', () => ({
  isDemo: false,
  supabase: {
    auth: {
      signUp: auth.signUp,
      onAuthStateChange: (callback: typeof auth.callback) => {
        auth.callback = callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: auth.profile, error: null }) }) }),
    }),
  },
  SupabaseRepository: class {
    async load() {
      return {
        profiles: [auth.profile],
        requests: [],
        assignments: [],
        collections: [],
        history: [],
      };
    }
  },
}));
import App from '../src/app/App';
import { AppProvider } from '../src/app/context';

it('token refresh preserves an in-progress resident form rather than unmounting it', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  auth.profile = createSeed().profiles[0];
  const id = createSeed().profiles[0].auth_user_id;
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/resident/pickup']}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  act(() => auth.callback!('SIGNED_IN', { user: { id } }));
  await userEvent.type(
    await screen.findByLabelText('Approximate quantity *'),
    '2 bags in progress',
  );
  act(() => auth.callback!('TOKEN_REFRESHED', { user: { id } }));
  expect(await screen.findByLabelText('Approximate quantity *')).toHaveValue('2 bags in progress');
  vi.unstubAllGlobals();
});

it('connected signup validates inputs and sends resident-only metadata to Auth', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  auth.signUp.mockClear();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/signup']}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  act(() => auth.callback!('INITIAL_SESSION', null));
  await userEvent.click(await screen.findByRole('button', { name: 'Create resident account' }));
  expect(auth.signUp).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText('Full name'), 'QA Resident');
  await userEvent.type(screen.getByLabelText('Phone number'), '-------');
  await userEvent.selectOptions(screen.getByLabelText('Ward'), 'Ward 1');
  await userEvent.type(screen.getByLabelText('Email'), 'qa@example.test');
  await userEvent.type(screen.getByLabelText('Password'), 'QA-only-password-123');
  await userEvent.click(screen.getByRole('button', { name: 'Create resident account' }));
  expect(auth.signUp).not.toHaveBeenCalled();
  await userEvent.clear(screen.getByLabelText('Phone number'));
  await userEvent.type(screen.getByLabelText('Phone number'), '9999912345');
  await userEvent.click(screen.getByRole('button', { name: 'Create resident account' }));
  expect(auth.signUp).toHaveBeenCalledWith({
    email: 'qa@example.test',
    password: 'QA-only-password-123',
    options: { data: { name: 'QA Resident', phone: '9999912345', ward: 'Ward 1' } },
  });
  expect(await screen.findByText(/Check your email to confirm your account/)).toBeVisible();
  expect(screen.queryByLabelText('Demo role')).toBeNull();
  vi.unstubAllGlobals();
});
