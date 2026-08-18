import { addDays, addHours, subDays } from 'date-fns';
import { DEFAULT_AVATARS, DISCIPLINES } from '@/constants/domain';
import { buildTournamentStructure, createTournamentCover } from '@/services/bracket';
import type { AppStateData, Discipline, Tournament, User } from '@/types/app';

function disciplineRatings() {
  return DISCIPLINES.map((discipline) => ({
    discipline: discipline.value,
    rating: 1200 + Math.floor(Math.random() * 180),
  }));
}

const baseUsers = [
  'AlexPro',
  'MaxStorm',
  'DenisPlay',
  'Frost',
  'Titan',
  'Wolf',
  'Sova',
  'Vortex',
  'Leon',
  'Urban',
  'Rush',
  'NextLevel',
];

export function createSeedUsers(): User[] {
  return baseUsers.map((login, index) => ({
    id: `user_${index + 1}`,
    publicId: `PL-${483921 + index}`,
    login,
    email: `${login.toLowerCase()}@demo.app`,
    password: index === 0 ? 'user' : 'demo123',
    avatar: DEFAULT_AVATARS[index] ?? login.slice(0, 2).toUpperCase(),
    role: index === 0 ? 'organizer' : 'player',
    organizerStatus: index === 0 ? 'approved' : 'not_requested',
    organizerRequest: null,
    statistics: {
      tournamentsPlayed: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      tournamentWins: 0,
      bestPlace: null,
    },
    disciplineRatings: disciplineRatings(),
    tournamentHistory: [],
  }));
}

function tournamentBase(
  id: string,
  organizerId: string,
  title: string,
  discipline: Discipline,
  format: Tournament['format'],
  maxParticipants: number,
  participantIds: string[],
  startAt: Date,
  status: Tournament['status'],
  description: string,
  prize: string,
) {
  const tournament: Tournament = {
    id,
    code: id.slice(-6).toUpperCase(),
    password: 'PLAY2026',
    title,
    description,
    discipline,
    customDiscipline: '',
    format,
    maxParticipants,
    participantIds,
    prize,
    rules: 'Матч проходит до двух побед.',
    startAt: startAt.toISOString(),
    status,
    organizerId,
    rounds: [],
    matches: [],
    groups: [],
    championId: null,
    createdAt: subDays(startAt, 5).toISOString(),
    cover: createTournamentCover(DISCIPLINES.find((item) => item.value === discipline)?.label ?? title),
  };
  const structure = buildTournamentStructure(tournament, participantIds);
  return { ...tournament, ...structure };
}

export function createSeedTournaments(users: User[]): Tournament[] {
  const organizerId = users[0].id;
  const userIds = users.map((user) => user.id);

  const future = tournamentBase(
    'summer_football',
    organizerId,
    'Summer Football Cup',
    'football',
    'single_elimination',
    16,
    userIds.slice(0, 10),
    addDays(new Date(), 2),
    'registration',
    'Приватный футбольный турнир для друзей и локального комьюнити.',
    '200 BYN',
  );

  const ongoing = tournamentBase(
    'street_basket',
    organizerId,
    'Street Basketball Night',
    'basketball',
    'double_elimination',
    8,
    userIds.slice(0, 8),
    addHours(new Date(), 5),
    'ongoing',
    'Вечерний баскетбольный турнир с короткими матчами.',
    'Сертификат MVP',
  );
  ongoing.matches[0].player1Id = userIds[0];
  ongoing.matches[0].player2Id = userIds[1];
  ongoing.matches[0].status = 'ready';
  ongoing.matches[1].player1Id = userIds[2];
  ongoing.matches[1].player2Id = userIds[3];
  ongoing.matches[1].status = 'ready';

  const completed = tournamentBase(
    'cyber_weekend',
    organizerId,
    'Cyber Weekend',
    'esports',
    'single_elimination',
    16,
    userIds.slice(0, 16),
    subDays(new Date(), 7),
    'completed',
    'Киберспортивный уикенд для быстрых серий playoff.',
    '500 BYN',
  );
  completed.matches.forEach((match, index) => {
    if (match.round === 1) {
      const p1 = completed.participantIds[index * 2] ?? null;
      const p2 = completed.participantIds[index * 2 + 1] ?? null;
      match.player1Id = p1;
      match.player2Id = p2;
      match.player1Score = 2;
      match.player2Score = 1;
      match.winnerId = p1;
      match.loserId = p2;
      match.status = 'completed';
    }
  });
  completed.championId = completed.participantIds[0];

  const groups = tournamentBase(
    'volley_friends',
    organizerId,
    'Volleyball Friends Cup',
    'volleyball',
    'groups_playoff',
    8,
    userIds.slice(4, 12),
    addDays(new Date(), 4),
    'registration',
    'Групповой этап для друзей и финальный playoff.',
    'Кубок и медали',
  );

  return [future, ongoing, completed, groups];
}

export function createSeedData(): AppStateData {
  const users = createSeedUsers();
  const tournaments = createSeedTournaments(users);
  return {
    users,
    tournaments,
    currentUserId: null,
    lastCreatedTournamentId: null,
  };
}
