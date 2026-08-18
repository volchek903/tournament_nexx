import { Link, Navigate, useParams } from 'react-router-dom';
import { BracketView } from '@/components/bracket/BracketView';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useTournamentById } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';

export default function Bracket() {
  const { id } = useParams();
  const tournament = useTournamentById(id);
  const users = useAppStore((state) => state.users);
  const currentUser = useCurrentUser();

  if (!tournament) return <Navigate to="/404" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
          <p className="mt-1 text-slate-400">Полная турнирная сетка и управление матчами.</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/tournaments/${tournament.id}`}>
            <Button variant="secondary">Назад к турниру</Button>
          </Link>
          {currentUser?.id === tournament.organizerId && (
            <Link to={`/organizer/tournaments/${tournament.id}/manage`}>
              <Button>Панель организатора</Button>
            </Link>
          )}
        </div>
      </div>
      <BracketView
        tournament={tournament}
        users={users}
        canManage={currentUser?.id === tournament.organizerId && tournament.status === 'ongoing'}
        manageLinkBase={`/organizer/tournaments/${tournament.id}/matches`}
      />
    </div>
  );
}
