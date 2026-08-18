import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISCIPLINES } from '@/constants/domain';
import { Card } from '@/components/ui/card';
import { buildRatingEntries } from '@/services/rating';
import { getDisciplineLabel } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';
import type { Discipline } from '@/types/app';

export default function Rankings() {
  const currentUser = useCurrentUser();
  const users = useAppStore((state) => state.users);
  const [discipline, setDiscipline] = useState<Discipline>('football');
  const rows = buildRatingEntries(users, discipline);
  const topThree = rows.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Рейтинг игроков</h1>
        <p className="mt-2 text-slate-400">Отдельный рейтинг по каждой дисциплине в demo-версии.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {DISCIPLINES.filter((item) => item.value !== 'table_tennis').map((item) => (
          <button
            key={item.value}
            onClick={() => setDiscipline(item.value)}
            className={`rounded-full px-3 py-2 text-sm ${
              discipline === item.value ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {topThree.map((entry, index) => (
          <Card key={entry.userId} className={`p-6 ${index === 0 ? 'lg:-translate-y-3 border-blue-500/30' : ''}`}>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">#{index + 1}</div>
            <div className="mt-3 text-2xl font-semibold text-white">{entry.login}</div>
            <div className="mt-1 text-sm text-slate-400">{getDisciplineLabel(discipline)}</div>
            <div className="mt-5 text-4xl font-bold text-blue-300">{entry.rating}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[64px_1.2fr_120px_120px_120px_120px] border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span>Место</span>
          <span>Игрок</span>
          <span>Рейтинг</span>
          <span>Турниры</span>
          <span>Матчи</span>
          <span>Win Rate</span>
        </div>
        {rows.map((row, index) => (
          <Link
            key={row.userId}
            to={`/players/${row.userId}`}
            className={`grid grid-cols-[64px_1.2fr_120px_120px_120px_120px] px-4 py-3 text-sm transition hover:bg-slate-900 ${
              currentUser?.id === row.userId ? 'bg-blue-500/10' : ''
            }`}
          >
            <span className="text-slate-500">{index + 1}</span>
            <span className="font-medium text-white">{row.login}</span>
            <span className="text-slate-300">{row.rating}</span>
            <span className="text-slate-300">{row.tournaments}</span>
            <span className="text-slate-300">{row.matches}</span>
            <span className="text-slate-300">{row.winRate}%</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
