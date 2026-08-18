import type { Discipline, TournamentFormat } from '@/types/app';

export const DISCIPLINES: { value: Discipline; label: string }[] = [
  { value: 'football', label: 'Футбол' },
  { value: 'basketball', label: 'Баскетбол' },
  { value: 'volleyball', label: 'Волейбол' },
  { value: 'tennis', label: 'Теннис' },
  { value: 'table_tennis', label: 'Настольный теннис' },
  { value: 'hockey', label: 'Хоккей' },
  { value: 'esports', label: 'Киберспорт' },
  { value: 'other', label: 'Другое' },
];

export const FORMAT_OPTIONS: { value: TournamentFormat; label: string; description: string }[] = [
  {
    value: 'single_elimination',
    label: 'Single Elimination',
    description: 'Один проигрыш и вылет из турнира.',
  },
  {
    value: 'double_elimination',
    label: 'Double Elimination',
    description: 'Есть второй шанс через loser bracket.',
  },
  {
    value: 'groups_playoff',
    label: 'Группы + Playoff',
    description: 'Групповой этап и затем playoff-сетка.',
  },
];

export const BRACKET_SIZES = [4, 8, 16, 32, 64];
export const MVP_DISCIPLINES = ['football', 'basketball', 'volleyball', 'tennis', 'hockey', 'esports', 'other'];

export const TOURNAMENT_STATUS_LABELS = {
  registration: 'Регистрация',
  ongoing: 'Идёт',
  completed: 'Завершён',
} as const;

export const DEFAULT_AVATARS = [
  'AX', 'MS', 'DP', 'FR', 'TT', 'WF', 'SV', 'VX', 'LN', 'UR', 'RS', 'NL',
];
