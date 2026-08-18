import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { copyText, getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function Profile() {
  const currentUser = useCurrentUser();
  const tournaments = useAppStore((state) => state.tournaments);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [tab, setTab] = useState<'overview' | 'my' | 'history'>('overview');
  const [login, setLogin] = useState(currentUser?.login ?? '');

  if (!currentUser) return <Navigate to="/login" replace />;

  const myTournaments = tournaments.filter((tournament) => tournament.participantIds.includes(currentUser.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Card className="mb-8 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
            {currentUser.avatar}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{currentUser.login}</h1>
              {currentUser.role === 'organizer' && (
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-blue-300">
                  Организатор
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>ID: {currentUser.publicId}</span>
              <button
                onClick={() => {
                  copyText(currentUser.publicId);
                  toast.success('ID скопирован');
                }}
                className="text-blue-300"
              >
                Скопировать ID
              </button>
            </div>
          </div>
          {currentUser.role === 'organizer' ? (
            <Link to="/organizer/tournaments/new">
              <Button>Создать турнир</Button>
            </Link>
          ) : (
            <Link to="/organizer/request">
              <Button variant="secondary">Стать организатором</Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ['overview', 'Обзор'],
          ['my', 'Мои турниры'],
          ['history', 'История'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value as typeof tab)}
            className={`rounded-full px-3 py-2 text-sm ${
              tab === value ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Турниров', currentUser.statistics.tournamentsPlayed],
                ['Матчей', currentUser.statistics.matchesPlayed],
                ['Побед', currentUser.statistics.wins],
                ['Поражений', currentUser.statistics.losses],
                ['Win Rate', currentUser.statistics.matchesPlayed ? `${Math.round((currentUser.statistics.wins / currentUser.statistics.matchesPlayed) * 1000) / 10}%` : '0%'],
                ['Турнирных побед', currentUser.statistics.tournamentWins],
                ['Лучшее место', currentUser.statistics.bestPlace ? `🥇 ${currentUser.statistics.bestPlace}` : '—'],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
                </Card>
              ))}
            </div>

            <Card className="p-5">
              <div className="mb-4 text-lg font-semibold text-white">Рейтинг по дисциплинам</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentUser.disciplineRatings.map((rating) => (
                  <div key={rating.discipline} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="text-sm text-slate-500">{getDisciplineLabel(rating.discipline)}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{rating.rating}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-4 text-lg font-semibold text-white">Редактирование профиля</div>
            <div className="space-y-3">
              <Input value={login} onChange={(e) => setLogin(e.target.value)} />
              <Button
                onClick={async () => {
                  const result = await updateProfile({ login });
                  if (result.ok) toast.success('Профиль обновлён');
                  else toast.error(result.message);
                }}
              >
                Сохранить логин
              </Button>
              {currentUser.organizerStatus === 'pending' && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Заявка организатора отправлена и ожидает одобрения.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'my' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {myTournaments.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Вы пока не участвуете ни в одном турнире</Card>
          ) : (
            myTournaments.map((tournament) => (
              <Card key={tournament.id} className="p-5">
                <div className="text-lg font-semibold text-white">{tournament.title}</div>
                <div className="mt-1 text-sm text-slate-400">{getDisciplineLabel(tournament.discipline)}</div>
                <div className="mt-4 flex gap-3">
                  <Link to={`/tournaments/${tournament.id}`} className="text-sm font-semibold text-blue-300">Открыть турнир</Link>
                  <Link to={`/tournaments/${tournament.id}/bracket`} className="text-sm font-semibold text-slate-400">Сетка</Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {currentUser.tournamentHistory.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Вы ещё не завершили ни одного турнира</Card>
          ) : (
            currentUser.tournamentHistory.map((entry) => (
              <Card key={entry.tournamentId} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{entry.title}</div>
                    <div className="text-sm text-slate-400">{getDisciplineLabel(entry.discipline)}</div>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <div>{entry.participantCount} участников</div>
                    <div>{entry.place ? `Место: ${entry.place}` : 'Без места'}</div>
                    <div>{entry.wins} побед / {entry.losses} поражений</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
