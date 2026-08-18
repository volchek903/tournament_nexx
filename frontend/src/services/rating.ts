import type { AppStateData, Discipline, RatingEntry, Tournament, TournamentHistoryEntry, User } from '@/types/app';

function createEmptyStats() {
  return {
    tournamentsPlayed: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    tournamentWins: 0,
    bestPlace: null as number | null,
  };
}

function getFinishedTournaments(tournaments: Tournament[]) {
  return tournaments.filter((item) => item.status === 'completed');
}

function computeHistoryEntry(tournament: Tournament, userId: string): TournamentHistoryEntry {
  const completedMatches = tournament.matches.filter(
    (match) => match.status === 'completed' && (match.player1Id === userId || match.player2Id === userId),
  );
  const wins = completedMatches.filter((match) => match.winnerId === userId).length;
  const losses = completedMatches.filter((match) => match.loserId === userId).length;
  const place = tournament.championId === userId ? 1 : wins > 0 ? 2 : null;

  return {
    tournamentId: tournament.id,
    title: tournament.title,
    discipline: tournament.discipline,
    finishedAt: tournament.startAt,
    place,
    participantCount: tournament.participantIds.length,
    wins,
    losses,
  };
}

export function recalculateUsers(data: AppStateData): User[] {
  const finishedTournaments = getFinishedTournaments(data.tournaments);

  return data.users.map((user) => {
    const stats = createEmptyStats();
    const history = finishedTournaments
      .filter((tournament) => tournament.participantIds.includes(user.id))
      .map((tournament) => computeHistoryEntry(tournament, user.id));

    history.forEach((entry) => {
      stats.tournamentsPlayed += 1;
      stats.matchesPlayed += entry.wins + entry.losses;
      stats.wins += entry.wins;
      stats.losses += entry.losses;
      if (entry.place === 1) stats.tournamentWins += 1;
      if (entry.place && (!stats.bestPlace || entry.place < stats.bestPlace)) {
        stats.bestPlace = entry.place;
      }
    });

    const disciplineRatings = user.disciplineRatings.map((item) => {
      const disciplineHistory = history.filter((entry) => entry.discipline === item.discipline);
      const rating =
        1200 +
        disciplineHistory.reduce((acc, entry) => {
          const placeBonus = entry.place === 1 ? 70 : entry.place === 2 ? 30 : 10;
          return acc + entry.wins * 12 - entry.losses * 6 + placeBonus;
        }, 0);
      return { ...item, rating };
    });

    return {
      ...user,
      statistics: stats,
      disciplineRatings,
      tournamentHistory: history,
    };
  });
}

export function buildRatingEntries(users: User[], discipline: Discipline): RatingEntry[] {
  return users
    .map((user) => {
      const rating = user.disciplineRatings.find((item) => item.discipline === discipline)?.rating ?? 1200;
      const winRate =
        user.statistics.matchesPlayed > 0
          ? Math.round((user.statistics.wins / user.statistics.matchesPlayed) * 1000) / 10
          : 0;
      return {
        userId: user.id,
        login: user.login,
        avatar: user.avatar,
        discipline,
        rating,
        tournaments: user.statistics.tournamentsPlayed,
        matches: user.statistics.matchesPlayed,
        wins: user.statistics.wins,
        winRate,
      };
    })
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.login.localeCompare(b.login));
}
