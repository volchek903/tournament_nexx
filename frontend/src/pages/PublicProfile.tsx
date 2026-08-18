import { Navigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function PublicProfile() {
  const { id } = useParams();
  const user = useAppStore((state) => state.users.find((item) => item.id === id) ?? null);

  if (!user) return <Navigate to="/404" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Card className="mb-6 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
            {user.avatar}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{user.login}</h1>
            <p className="text-slate-400">ID: {user.publicId}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <div className="mb-4 text-lg font-semibold text-white">Статистика</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Турниров', user.statistics.tournamentsPlayed],
              ['Матчей', user.statistics.matchesPlayed],
              ['Побед', user.statistics.wins],
              ['Поражений', user.statistics.losses],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-lg font-semibold text-white">Рейтинг по дисциплинам</div>
          <div className="space-y-3">
            {user.disciplineRatings.map((rating) => (
              <div key={rating.discipline} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <span className="text-slate-300">{getDisciplineLabel(rating.discipline)}</span>
                <span className="font-semibold text-white">{rating.rating}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 text-lg font-semibold text-white">Последние турниры</div>
        <div className="space-y-3">
          {user.tournamentHistory.length === 0 ? (
            <div className="text-sm text-slate-500">Истории пока нет</div>
          ) : (
            user.tournamentHistory.slice(0, 5).map((entry) => (
              <div key={entry.tournamentId} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="font-medium text-white">{entry.title}</div>
                <div className="text-sm text-slate-400">
                  {getDisciplineLabel(entry.discipline)} · {entry.wins} побед / {entry.losses} поражений
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
