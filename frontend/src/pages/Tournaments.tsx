import { useMemo, useState } from 'react';
import { DISCIPLINES, FORMAT_OPTIONS } from '@/constants/domain';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';
import { describeFormat } from '@/services/bracket';

export default function Tournaments() {
  const tournaments = useAppStore((state) => state.tournaments);
  const [search, setSearch] = useState('');
  const [discipline, setDiscipline] = useState<'all' | (typeof DISCIPLINES)[number]['value']>('all');
  const [format, setFormat] = useState<'all' | (typeof FORMAT_OPTIONS)[number]['value']>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = tournaments.filter((tournament) => {
      const searchMatch =
        !query ||
        tournament.title.toLowerCase().includes(query) ||
        tournament.code.toLowerCase().includes(query);
      const disciplineMatch = discipline === 'all' || tournament.discipline === discipline;
      const formatMatch = format === 'all' || tournament.format === format;
      return searchMatch && disciplineMatch && formatMatch;
    });
    return items.sort((a, b) => {
      const aExact = a.code.toLowerCase() === query ? 1 : 0;
      const bExact = b.code.toLowerCase() === query ? 1 : 0;
      return bExact - aExact;
    });
  }, [discipline, format, search, tournaments]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Турниры</h1>
        <p className="mt-2 text-slate-400">Найди соревнование и докажи, что ты лучший.</p>
      </div>

      <Card className="mb-6 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <Input
            placeholder="Название или код турнира"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as typeof discipline)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            <option value="all">Все дисциплины</option>
            {DISCIPLINES.filter((item) => item.value !== 'table_tennis').map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            <option value="all">Все форматы</option>
            {FORMAT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{describeFormat(item.value)}</option>
            ))}
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">Здесь пока пусто</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {filtered.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
}
