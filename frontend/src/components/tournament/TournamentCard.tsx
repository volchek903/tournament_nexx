import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { describeFormat } from '@/services/bracket';
import { formatDateTime, getDisciplineLabel } from '@/lib/utils';
import { TOURNAMENT_STATUS_LABELS } from '@/constants/domain';
import type { Tournament } from '@/types/app';

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-28 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-slate-950" />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">{tournament.title}</div>
            <div className="text-sm text-slate-400">{getDisciplineLabel(tournament.discipline, tournament.customDiscipline)}</div>
          </div>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-blue-300">{TOURNAMENT_STATUS_LABELS[tournament.status]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
          <div>{describeFormat(tournament.format)}</div>
          <div>{tournament.participantIds.length} / {tournament.maxParticipants}</div>
          <div>{formatDateTime(tournament.startAt)}</div>
          <div>{tournament.prize || 'Без приза'}</div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Код {tournament.code}</span>
          <Link to={`/tournaments/${tournament.id}`} className="text-sm font-semibold text-blue-300 transition hover:text-blue-200">
            Подробнее
          </Link>
        </div>
      </div>
    </Card>
  );
}
