export type UserRole = 'player' | 'organizer';
export type TournamentStatus = 'draft' | 'registration' | 'ongoing' | 'completed';
export type ParticipantStatus = 'registered' | 'eliminated' | 'winner';
export type MatchStatus = 'pending' | 'in_progress' | 'completed';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
}

export interface Tournament {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  discipline: string;
  format: string;
  max_participants: number;
  status: TournamentStatus;
  start_date: string | null;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string | null;
  display_name: string;
  seed: number | null;
  status: ParticipantStatus;
  joined_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  participant1_id: string | null;
  participant2_id: string | null;
  score1: number;
  score2: number;
  winner_id: string | null;
  status: MatchStatus;
  next_match_id: string | null;
  created_at: string;
}
