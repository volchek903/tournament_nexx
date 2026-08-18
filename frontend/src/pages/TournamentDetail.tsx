import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BracketView } from '@/components/bracket/BracketView';
import { PlayerPill } from '@/components/shared/PlayerPill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useCurrentUser, useTournamentById } from '@/hooks/useAppSelectors';
import { describeFormat } from '@/services/bracket';
import { formatDateTime, getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function TournamentDetail() {
  const { id } = useParams();
  const tournament = useTournamentById(id);
  const currentUser = useCurrentUser();
  const users = useAppStore((state) => state.users);
  const joinTournament = useAppStore((state) => state.joinTournament);
  const [joinOpen, setJoinOpen] = useState(false);
  const [password, setPassword] = useState('');

  const organizer = useMemo(
    () => users.find((user) => user.id === tournament?.organizerId) ?? null,
    [tournament?.organizerId, users],
  );

  if (!tournament) return <Navigate to="/404" replace />;

  const participants = tournament.participantIds
    .map((participantId) => users.find((user) => user.id === participantId) ?? null)
    .filter(Boolean);
  const isParticipant = currentUser ? tournament.participantIds.includes(currentUser.id) : false;
  const isOrganizer = currentUser?.id === tournament.organizerId;

  const handleJoin = async () => {
    const result = await joinTournament(tournament.id, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success('Вы присоединились к турниру');
    setJoinOpen(false);
    setPassword('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="h-56 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-slate-950" />
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{tournament.code}</div>
                <h1 className="mt-2 text-3xl font-bold text-white">{tournament.title}</h1>
                <p className="mt-2 text-slate-400">{tournament.description}</p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                {tournament.status === 'registration' ? 'Регистрация' : tournament.status === 'ongoing' ? 'Идёт' : 'Завершён'}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Дисциплина</div>
                <div className="mt-2 font-semibold text-white">{getDisciplineLabel(tournament.discipline, tournament.customDiscipline)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Формат</div>
                <div className="mt-2 font-semibold text-white">{describeFormat(tournament.format)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Дата и время</div>
                <div className="mt-2 font-semibold text-white">{formatDateTime(tournament.startAt)}</div>
              </Card>
            </div>
            <div className="flex flex-wrap gap-3">
              {currentUser ? (
                !isParticipant && tournament.status === 'registration' && tournament.participantIds.length < tournament.maxParticipants ? (
                  <Button onClick={() => setJoinOpen(true)}>Присоединиться</Button>
                ) : isParticipant ? (
                  <Button variant="secondary" disabled>Вы уже участвуете</Button>
                ) : null
              ) : (
                <Link to="/login" state={{ from: `/tournaments/${tournament.id}` }}>
                  <Button>Войти для участия</Button>
                </Link>
              )}

              {!currentUser && (
                <Link to="/login" state={{ from: `/tournaments/${tournament.id}`, tournamentId: tournament.id }}>
                  <Button variant="secondary">admin / user → создатель</Button>
                </Link>
              )}

              {isOrganizer && (
                <Link to={`/organizer/tournaments/${tournament.id}/manage`}>
                  <Button variant="secondary">Управлять турниром</Button>
                </Link>
              )}
              <Link to={`/tournaments/${tournament.id}/bracket`}>
                <Button variant="ghost">Открыть сетку</Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Информация</div>
            <div className="mt-2 text-lg font-semibold text-white">{tournament.participantIds.length} / {tournament.maxParticipants} участников</div>
          </div>
          <div className="space-y-4 text-sm text-slate-400">
            <div>Приз: <span className="text-white">{tournament.prize || 'Не указан'}</span></div>
            <div>Правила: <span className="text-white">{tournament.rules || 'Без дополнительных правил'}</span></div>
            <div>
              Организатор:{' '}
              {organizer ? (
                <Link to={`/players/${organizer.id}`} className="text-blue-300">{organizer.login}</Link>
              ) : (
                <span className="text-white">Не найден</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">Участники</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((participant) => (
            <PlayerPill key={participant!.id} user={participant!} />
          ))}
          {Array.from({ length: Math.max(0, tournament.maxParticipants - participants.length) }).map((_, index) => (
            <PlayerPill key={`empty-${index}`} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Сетка турнира</h2>
          <span className="text-sm text-slate-500">Публичный просмотр доступен всем</span>
        </div>
        <BracketView
          tournament={tournament}
          users={users}
          canManage={isOrganizer && tournament.status === 'ongoing'}
          manageLinkBase={`/organizer/tournaments/${tournament.id}/matches`}
        />
      </div>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Введите пароль турнира">
        <div className="space-y-4">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль турнира" />
          <Button className="w-full" onClick={() => void handleJoin()}>Присоединиться</Button>
        </div>
      </Modal>
    </div>
  );
}
