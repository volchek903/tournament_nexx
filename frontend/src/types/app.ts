export type UserRole = 'player' | 'organizer';
export type OrganizerRequestStatus = 'not_requested' | 'pending' | 'approved';
export type Discipline =
  | 'football'
  | 'basketball'
  | 'volleyball'
  | 'tennis'
  | 'table_tennis'
  | 'hockey'
  | 'esports'
  | 'other';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'groups_playoff';
export type TournamentStatus = 'registration' | 'ongoing' | 'completed';
export type MatchStatus = 'pending' | 'ready' | 'completed';
export type MatchBracket = 'main' | 'winners' | 'losers' | 'grand_final';

export interface PlayerStatistics {
  tournamentsPlayed: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  tournamentWins: number;
  bestPlace: number | null;
}

export interface DisciplineRating {
  discipline: Discipline;
  rating: number;
}

export interface TournamentHistoryEntry {
  tournamentId: string;
  title: string;
  discipline: Discipline;
  finishedAt: string;
  place: number | null;
  participantCount: number;
  wins: number;
  losses: number;
}

export interface OrganizerRequest {
  name: string;
  contact: string;
  reason: string;
  status: OrganizerRequestStatus;
  requestedAt: string;
}

export interface User {
  id: string;
  publicId: string;
  login: string;
  email: string;
  password: string;
  avatar: string;
  role: UserRole;
  organizerStatus: OrganizerRequestStatus;
  organizerRequest: OrganizerRequest | null;
  statistics: PlayerStatistics;
  disciplineRatings: DisciplineRating[];
  tournamentHistory: TournamentHistoryEntry[];
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  bracket: MatchBracket;
  round: number;
  position: number;
  label: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Team: string;
  player2Team: string;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  loserId: string | null;
  status: MatchStatus;
  nextMatchId: string | null;
  nextSlot: 1 | 2 | null;
}

export interface TournamentRound {
  id: string;
  title: string;
  bracket: MatchBracket;
  round: number;
  matchIds: string[];
}

export interface TournamentGroupStanding {
  userId: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
}

export interface TournamentGroup {
  id: string;
  title: string;
  memberIds: string[];
  standings: TournamentGroupStanding[];
}

export interface Tournament {
  id: string;
  code: string;
  password: string;
  title: string;
  description: string;
  discipline: Discipline;
  customDiscipline: string;
  format: TournamentFormat;
  maxParticipants: number;
  participantIds: string[];
  prize: string;
  rules: string;
  startAt: string;
  status: TournamentStatus;
  organizerId: string;
  rounds: TournamentRound[];
  matches: TournamentMatch[];
  groups: TournamentGroup[];
  championId: string | null;
  createdAt: string;
  cover: string;
}

export interface RatingEntry {
  userId: string;
  login: string;
  avatar: string;
  discipline: Discipline;
  rating: number;
  tournaments: number;
  matches: number;
  wins: number;
  winRate: number;
}

export interface AppStateData {
  users: User[];
  tournaments: Tournament[];
  currentUserId: string | null;
  lastCreatedTournamentId: string | null;
}
