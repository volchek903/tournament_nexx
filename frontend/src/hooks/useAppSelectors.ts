import { useAppStore } from '@/store/appStore';

export function useCurrentUser() {
  return useAppStore((state) => state.users.find((user) => user.id === state.currentUserId) ?? null);
}

export function useTournamentById(id?: string) {
  return useAppStore((state) => state.tournaments.find((item) => item.id === id) ?? null);
}
