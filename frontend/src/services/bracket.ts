import { getDisciplineLabel, generateId } from '@/lib/utils';
import type {
  MatchBracket,
  Tournament,
  TournamentFormat,
  TournamentGroup,
  TournamentMatch,
  TournamentRound,
} from '@/types/app';

function roundTitle(round: number, totalRounds: number) {
  if (totalRounds === 1) return 'Финал';
  if (round === totalRounds) return 'Финал';
  if (round === totalRounds - 1) return 'Полуфинал';
  if (round === totalRounds - 2) return 'Четвертьфинал';
  return `Раунд ${round}`;
}

function createMatch(
  tournamentId: string,
  bracket: MatchBracket,
  round: number,
  position: number,
  totalRounds: number,
): TournamentMatch {
  return {
    id: generateId('match'),
    tournamentId,
    bracket,
    round,
    position,
    label: bracket === 'main' ? roundTitle(round, totalRounds) : `${bracket} ${round}`,
    player1Id: null,
    player2Id: null,
    player1Team: '',
    player2Team: '',
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
    loserId: null,
    status: 'pending',
    nextMatchId: null,
    nextSlot: null,
  };
}

function buildSingleElimination(tournamentId: string, size: number, participantIds: string[]) {
  const totalRounds = Math.log2(size);
  const rounds: TournamentRound[] = [];
  const matches: TournamentMatch[] = [];
  const roundBuckets: TournamentMatch[][] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const count = size / 2 ** round;
    const bucket: TournamentMatch[] = [];
    for (let position = 0; position < count; position += 1) {
      const match = createMatch(tournamentId, 'main', round, position, totalRounds);
      bucket.push(match);
      matches.push(match);
    }
    roundBuckets.push(bucket);
    rounds.push({
      id: generateId('round'),
      title: roundTitle(round, totalRounds),
      bracket: 'main',
      round,
      matchIds: bucket.map((item) => item.id),
    });
  }

  for (let round = 0; round < roundBuckets.length - 1; round += 1) {
    roundBuckets[round].forEach((match, index) => {
      const next = roundBuckets[round + 1][Math.floor(index / 2)];
      match.nextMatchId = next.id;
      match.nextSlot = index % 2 === 0 ? 1 : 2;
    });
  }

  roundBuckets[0].forEach((match, index) => {
    match.player1Id = participantIds[index * 2] ?? null;
    match.player2Id = participantIds[index * 2 + 1] ?? null;
    match.status = match.player1Id && match.player2Id ? 'ready' : 'pending';
  });

  return { rounds, matches };
}

function buildGroups(tournament: Tournament) {
  const groupCount = Math.max(2, Math.min(4, tournament.maxParticipants / 4));
  const groups: TournamentGroup[] = [];
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const memberIds = tournament.participantIds.filter((_, index) => index % groupCount === groupIndex);
    groups.push({
      id: generateId('group'),
      title: `Группа ${String.fromCharCode(65 + groupIndex)}`,
      memberIds,
      standings: memberIds.map((userId, index) => ({
        userId,
        played: 0,
        wins: 0,
        losses: 0,
        points: memberIds.length - index,
      })),
    });
  }
  return groups;
}

export function buildTournamentStructure(
  tournament: Tournament,
  participantIds = tournament.participantIds,
): Pick<Tournament, 'rounds' | 'matches' | 'groups'> {
  const { rounds, matches } = buildSingleElimination(tournament.id, tournament.maxParticipants, participantIds);

  if (tournament.format === 'single_elimination') {
    return { rounds, matches, groups: [] };
  }

  if (tournament.format === 'double_elimination') {
    const extraRounds: TournamentRound[] = [
      {
        id: generateId('round'),
        title: 'Loser Bracket',
        bracket: 'losers',
        round: 1,
        matchIds: [],
      },
      {
        id: generateId('round'),
        title: 'Grand Final',
        bracket: 'grand_final',
        round: rounds.length + 1,
        matchIds: [],
      },
    ];
    return { rounds: [...rounds, ...extraRounds], matches, groups: [] };
  }

  return { rounds, matches, groups: buildGroups({ ...tournament, participantIds }) };
}

export function completeMatch(tournament: Tournament, matchId: string, payload: {
  player1Score: number;
  player2Score: number;
  winnerId: string;
  loserId: string | null;
  player1Team?: string;
  player2Team?: string;
}) {
  const matches = tournament.matches.map((match) => {
    if (match.id !== matchId) return { ...match };
    return {
      ...match,
      player1Score: payload.player1Score,
      player2Score: payload.player2Score,
      winnerId: payload.winnerId,
      loserId: payload.loserId,
      player1Team: payload.player1Team ?? match.player1Team,
      player2Team: payload.player2Team ?? match.player2Team,
      status: 'completed' as const,
    };
  });

  const completed = matches.find((match) => match.id === matchId);
  if (!completed) return tournament;

  if (completed.nextMatchId && completed.winnerId) {
    const nextIndex = matches.findIndex((item) => item.id === completed.nextMatchId);
    if (nextIndex >= 0) {
      const next = matches[nextIndex];
      matches[nextIndex] = {
        ...next,
        player1Id: completed.nextSlot === 1 ? completed.winnerId : next.player1Id,
        player2Id: completed.nextSlot === 2 ? completed.winnerId : next.player2Id,
        status:
          (completed.nextSlot === 1 ? completed.winnerId : next.player1Id) &&
          (completed.nextSlot === 2 ? completed.winnerId : next.player2Id)
            ? 'ready'
            : next.status,
      };
    }
  }

  const championshipMatch = matches.find((match) => match.nextMatchId === null);
  const championId =
    championshipMatch?.status === 'completed' && championshipMatch.winnerId
      ? championshipMatch.winnerId
      : tournament.championId;

  return {
    ...tournament,
    matches,
    championId,
    status: championId ? 'completed' : tournament.status,
  };
}

export function describeFormat(format: TournamentFormat) {
  switch (format) {
    case 'single_elimination':
      return 'Single Elimination';
    case 'double_elimination':
      return 'Double Elimination';
    default:
      return 'Группы + Playoff';
  }
}

export function createTournamentCover(disciplineLabel: string) {
  return `linear-gradient(135deg, rgba(59,130,246,0.24), rgba(124,58,237,0.34)), ${disciplineLabel}`;
}

export function getTournamentSubtitle(tournament: Tournament) {
  return `${getDisciplineLabel(tournament.discipline, tournament.customDiscipline)} · ${describeFormat(tournament.format)}`;
}
