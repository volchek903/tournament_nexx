import { Trophy } from 'lucide-react';
import { PlayerPill } from '@/components/shared/PlayerPill';
import { Card } from '@/components/ui/card';
import type { Tournament, User } from '@/types/app';

interface BracketViewProps {
  tournament: Tournament;
  users: User[];
  manageLinkBase?: string;
  canManage?: boolean;
}

export function BracketView({ tournament, users, manageLinkBase, canManage }: BracketViewProps) {
  const usersMap = new Map(users.map((user) => [user.id, user]));
  const matchMap = new Map(tournament.matches.map((match) => [match.id, match]));

  const visibleRounds = tournament.rounds
    .map((round) => {
      if (round.bracket !== 'main' || round.round !== 1) {
        return round;
      }

      const visibleMatchIds = round.matchIds.filter((matchId) => {
        const match = matchMap.get(matchId);
        if (!match) return false;
        const participantCount = Number(Boolean(match.player1Id)) + Number(Boolean(match.player2Id));
        return participantCount === 2;
      });

      return { ...round, matchIds: visibleMatchIds };
    })
    .filter((round) => round.matchIds.length > 0 || round.bracket !== 'main');

  return (
    <div className="space-y-6">
      {tournament.groups.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {tournament.groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{group.title}</div>
              <div className="space-y-2">
                {group.standings.map((standing) => {
                  const user = usersMap.get(standing.userId);
                  return (
                    <div key={standing.userId} className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm">
                      <span className="text-white">{user?.login ?? 'Игрок'}</span>
                      <span className="text-slate-400">{standing.points} очков</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {visibleRounds.map((round) => (
              <div key={round.id} className="w-72 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{round.title}</div>
                {round.matchIds.length === 0 ? (
                  <Card className="p-4 text-sm text-slate-500">Визуальная секция для MVP.</Card>
                ) : (
                  round.matchIds.map((matchId) => {
                    const match = matchMap.get(matchId);
                    if (!match) return null;
                    const p1 = match.player1Id ? usersMap.get(match.player1Id) : null;
                    const p2 = match.player2Id ? usersMap.get(match.player2Id) : null;
                    return (
                      <Card key={match.id} className="space-y-3 p-3">
                        <PlayerPill user={p1} subtitle={match.player1Team || p1?.publicId} faded={match.loserId === p1?.id} />
                        <PlayerPill user={p2} subtitle={match.player2Team || p2?.publicId} faded={match.loserId === p2?.id} />
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-slate-500">
                            {match.player1Score} : {match.player2Score}
                          </div>
                          {match.winnerId && (
                            <div className="flex items-center gap-1 text-amber-300">
                              <Trophy className="h-4 w-4" />
                              <span>Победитель</span>
                            </div>
                          )}
                        </div>
                        {canManage && manageLinkBase && match.status !== 'completed' && p1 && p2 && (
                          <a
                            href={`${manageLinkBase}/${match.id}`}
                            className="block rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-center text-sm font-semibold text-blue-200"
                          >
                            Управлять матчем
                          </a>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
