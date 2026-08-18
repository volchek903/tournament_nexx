import { create } from 'zustand';
import { apiRequest } from '@/services/api';
import type { AppStateData, Discipline, TournamentFormat } from '@/types/app';

interface CreateTournamentPayload {
  title: string;
  discipline: Discipline;
  customDiscipline: string;
  format: TournamentFormat;
  maxParticipants: number;
  description: string;
  prize: string;
  rules: string;
  startAt: string;
  password: string;
}

interface OrganizerRequestPayload {
  name: string;
  contact: string;
  reason: string;
}

interface MatchPayload {
  matchId: string;
  player1Score: number;
  player2Score: number;
  winnerId: string;
  loserId: string | null;
  player1Team?: string;
  player2Team?: string;
}

interface MutationResult {
  ok: boolean;
  message?: string | null;
  entityId?: string | null;
}

interface AppStore extends AppStateData {
  initialized: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  register: (payload: { login: string; email: string; password: string; avatar?: string }) => Promise<MutationResult>;
  login: (identifier: string, password: string, options?: { tournamentId?: string }) => Promise<MutationResult>;
  logout: () => Promise<void>;
  requestOrganizerAccess: (payload: OrganizerRequestPayload) => Promise<MutationResult>;
  approveOrganizerAccess: () => Promise<MutationResult>;
  updateProfile: (payload: { login: string }) => Promise<MutationResult>;
  createTournament: (payload: CreateTournamentPayload) => Promise<MutationResult>;
  joinTournament: (tournamentId: string, password: string) => Promise<MutationResult>;
  addParticipantByPublicId: (tournamentId: string, publicId: string) => Promise<MutationResult>;
  removeParticipant: (tournamentId: string, userId: string) => Promise<MutationResult>;
  resizeTournament: (tournamentId: string, maxParticipants: number) => Promise<MutationResult>;
  startTournament: (tournamentId: string) => Promise<MutationResult>;
  updateMatch: (tournamentId: string, payload: MatchPayload) => Promise<MutationResult>;
  resetDemo: () => Promise<void>;
}

const initialState: AppStateData = {
  users: [],
  tournaments: [],
  currentUserId: null,
  lastCreatedTournamentId: null,
};

function applyState(state: AppStateData) {
  return {
    users: state.users,
    tournaments: state.tournaments,
    currentUserId: state.currentUserId,
    lastCreatedTournamentId: state.lastCreatedTournamentId,
  };
}

async function runMutation(
  setState: (state: AppStateData) => void,
  request: () => Promise<{ ok: boolean; message?: string | null; entityId?: string | null; state: AppStateData }>,
): Promise<MutationResult> {
  try {
    const result = await request();
    setState(result.state);
    return { ok: result.ok, message: result.message, entityId: result.entityId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Ошибка запроса к серверу',
    };
  }
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  initialized: false,
  loading: false,

  initialize: async () => {
    set({ loading: true });
    try {
      const result = await apiRequest('/state', { method: 'GET' });
      set({ ...applyState(result.state), initialized: true, loading: false });
    } catch (error) {
      console.error(error);
      set({ initialized: true, loading: false });
    }
  },

  register: async (payload) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest('/auth/register', { method: 'POST', body: payload }),
    );
  },

  login: async (identifier, password, options) => {
    return runMutation(
      (state) => set(applyState(state)),
      () =>
        apiRequest('/auth/login', {
          method: 'POST',
          body: { identifier, password, tournamentId: options?.tournamentId ?? null },
        }),
    );
  },

  logout: async () => {
    const result = await apiRequest('/auth/logout', { method: 'POST' });
    set(applyState(result.state));
  },

  requestOrganizerAccess: async (payload) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest('/organizer/request', { method: 'POST', body: payload }),
    );
  },

  approveOrganizerAccess: async () => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest('/organizer/approve', { method: 'POST' }),
    );
  },

  updateProfile: async (payload) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest('/users/me', { method: 'PATCH', body: payload }),
    );
  },

  createTournament: async (payload) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest('/tournaments', { method: 'POST', body: payload }),
    );
  },

  joinTournament: async (tournamentId, password) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/join`, { method: 'POST', body: { password } }),
    );
  },

  addParticipantByPublicId: async (tournamentId, publicId) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/participants`, { method: 'POST', body: { publicId } }),
    );
  },

  removeParticipant: async (tournamentId, userId) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/participants/${userId}`, { method: 'DELETE' }),
    );
  },

  resizeTournament: async (tournamentId, maxParticipants) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/resize`, { method: 'POST', body: { maxParticipants } }),
    );
  },

  startTournament: async (tournamentId) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/start`, { method: 'POST' }),
    );
  },

  updateMatch: async (tournamentId, payload) => {
    return runMutation(
      (state) => set(applyState(state)),
      () => apiRequest(`/tournaments/${tournamentId}/matches/${payload.matchId}`, { method: 'POST', body: payload }),
    );
  },

  resetDemo: async () => {
    const result = await apiRequest('/demo/reset', { method: 'POST' });
    set(applyState(result.state));
  },
}));
