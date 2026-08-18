import { Link, Navigate, useParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function WinnerScreen() {
  const { id } = useParams();
  const tournament = useAppStore((state) => state.tournaments.find((item) => item.id === id) ?? null);
  const champion = useAppStore((state) => state.users.find((user) => user.id === tournament?.championId) ?? null);

  if (!tournament) return <Navigate to="/404" replace />;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4">
      <Card className="w-full p-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
          <Trophy className="h-10 w-10" />
        </div>
        <div className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-500">Победитель турнира</div>
        <h1 className="mt-3 text-4xl font-bold text-white">{champion?.login ?? 'Чемпион ещё не определён'}</h1>
        <p className="mt-3 text-slate-400">
          {champion ? `Победитель ${tournament.title}` : 'Заверши финал, чтобы увидеть чемпиона.'}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {getDisciplineLabel(tournament.discipline)} · {tournament.participantIds.length} участников
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={`/tournaments/${tournament.id}`}>
            <Button variant="secondary">Вернуться к турниру</Button>
          </Link>
          <Link to="/rankings">
            <Button>Открыть рейтинг</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
