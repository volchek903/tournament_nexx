import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { formatDateTime, getCountdown, getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function MyTournaments() {
  const currentUser = useCurrentUser();
  const allTournaments = useAppStore((state) => state.tournaments);
  const tournaments = useMemo(
    () => allTournaments.filter((tournament) => tournament.organizerId === currentUser?.id),
    [allTournaments, currentUser?.id],
  );

  const sections = {
    future: tournaments.filter((tournament) => tournament.status === 'registration'),
    active: tournaments.filter((tournament) => tournament.status === 'ongoing'),
    completed: tournaments.filter((tournament) => tournament.status === 'completed'),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Мои турниры</h1>
          <p className="mt-2 text-slate-400">Все турниры текущего организатора, разбитые по статусам.</p>
        </div>
        <Link to="/organizer/tournaments/new">
          <Button>Создать турнир</Button>
        </Link>
      </div>

      {[
        { title: 'Будущие', items: sections.future },
        { title: 'Идут сейчас', items: sections.active },
        { title: 'Завершённые', items: sections.completed },
      ].map(({ title, items }) => (
        <section key={title} className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
          {items.length === 0 ? (
            <Card className="p-6 text-slate-500">Здесь пока пусто</Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((tournament) => (
                <Card key={tournament.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{tournament.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {getDisciplineLabel(tournament.discipline, tournament.customDiscipline)} · {tournament.participantIds.length} / {tournament.maxParticipants}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{formatDateTime(tournament.startAt)}</div>
                      {tournament.status === 'registration' && (
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-blue-300">
                          Начало через {getCountdown(tournament.startAt)}
                        </div>
                      )}
                    </div>
                    <Link to={`/organizer/tournaments/${tournament.id}/manage`}>
                      <Button variant="secondary">Управлять</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
