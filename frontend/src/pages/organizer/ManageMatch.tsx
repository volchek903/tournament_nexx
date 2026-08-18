import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCurrentUser, useTournamentById } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';

export default function ManageMatch() {
  const { id, matchId } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const tournament = useTournamentById(id);
  const users = useAppStore((state) => state.users);
  const updateMatch = useAppStore((state) => state.updateMatch);
  const match = tournament?.matches.find((item) => item.id === matchId) ?? null;
  const p1 = users.find((user) => user.id === match?.player1Id) ?? null;
  const p2 = users.find((user) => user.id === match?.player2Id) ?? null;
  const [score1, setScore1] = useState(match?.player1Score ?? 0);
  const [score2, setScore2] = useState(match?.player2Score ?? 0);
  const [team1, setTeam1] = useState(match?.player1Team ?? '');
  const [team2, setTeam2] = useState(match?.player2Team ?? '');

  if (!tournament) return <Navigate to="/404" replace />;
  if (currentUser?.id !== tournament.organizerId) return <Navigate to="/tournaments" replace />;
  if (!match) return <Navigate to={`/organizer/tournaments/${tournament.id}/manage`} replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Управление матчем</h1>
          <p className="mt-2 text-slate-400">Раунд {match.round} · позиция {match.position + 1}</p>
        </div>
        <Link to={`/organizer/tournaments/${tournament.id}/manage`}>
          <Button variant="secondary">Назад</Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="space-y-4">
            <div className="text-center text-xl font-semibold text-white">{p1?.login ?? 'Ожидается игрок'}</div>
            <Input value={team1} onChange={(e) => setTeam1(e.target.value)} placeholder="Команда игрока 1" />
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => setScore1((value) => Math.max(0, value - 1))}>−</Button>
              <div className="text-4xl font-bold text-white">{score1}</div>
              <Button variant="secondary" onClick={() => setScore1((value) => value + 1)}>+</Button>
            </div>
          </div>
          <div className="text-center text-slate-500">VS</div>
          <div className="space-y-4">
            <div className="text-center text-xl font-semibold text-white">{p2?.login ?? 'Ожидается игрок'}</div>
            <Input value={team2} onChange={(e) => setTeam2(e.target.value)} placeholder="Команда игрока 2" />
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => setScore2((value) => Math.max(0, value - 1))}>−</Button>
              <div className="text-4xl font-bold text-white">{score2}</div>
              <Button variant="secondary" onClick={() => setScore2((value) => value + 1)}>+</Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            disabled={!p1 || !p2 || score1 === score2}
            onClick={async () => {
              const winnerId = score1 > score2 ? p1?.id : p2?.id;
              const loserId = score1 > score2 ? p2?.id ?? null : p1?.id ?? null;
              if (!winnerId) return;
              const result = await updateMatch(tournament.id, {
                matchId: match.id,
                player1Score: score1,
                player2Score: score2,
                winnerId,
                loserId,
                player1Team: team1,
                player2Team: team2,
              });
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success(`Победитель ${score1 > score2 ? p1?.login : p2?.login}`);
              const isFinal = tournament.matches.find((item) => item.id === match.id)?.nextMatchId === null;
              navigate(isFinal ? `/tournaments/${tournament.id}/winner` : `/organizer/tournaments/${tournament.id}/manage`);
            }}
          >
            Завершить матч
          </Button>
        </div>
      </Card>
    </div>
  );
}
