import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BRACKET_SIZES } from '@/constants/domain';
import { BracketView } from '@/components/bracket/BracketView';
import { PlayerPill } from '@/components/shared/PlayerPill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useCurrentUser, useTournamentById } from '@/hooks/useAppSelectors';
import { copyText, getDisciplineLabel } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function ManageTournament() {
  const { id } = useParams();
  const currentUser = useCurrentUser();
  const tournament = useTournamentById(id);
  const users = useAppStore((state) => state.users);
  const addParticipantByPublicId = useAppStore((state) => state.addParticipantByPublicId);
  const removeParticipant = useAppStore((state) => state.removeParticipant);
  const resizeTournament = useAppStore((state) => state.resizeTournament);
  const startTournament = useAppStore((state) => state.startTournament);
  const [lookupId, setLookupId] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  if (!tournament) return <Navigate to="/404" replace />;
  if (currentUser?.id !== tournament.organizerId) return <Navigate to="/tournaments" replace />;

  const participants = tournament.participantIds
    .map((participantId) => users.find((user) => user.id === participantId) ?? null)
    .filter(Boolean);

  const mutationToast = (result: { ok: boolean; message?: string | null }, successMessage: string) => {
    if (result.ok) toast.success(successMessage);
    else toast.error(result.message);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Панель организатора</div>
          <h1 className="mt-2 text-3xl font-bold text-white">{tournament.title}</h1>
          <p className="mt-2 text-slate-400">
            {getDisciplineLabel(tournament.discipline, tournament.customDiscipline)} · {tournament.participantIds.length} / {tournament.maxParticipants}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => copyText(tournament.code).then(() => toast.success('Код скопирован'))}>
            Копировать код
          </Button>
          <Button variant="secondary" onClick={() => copyText(tournament.password).then(() => toast.success('Пароль скопирован'))}>
            Копировать пароль
          </Button>
          <Link to={`/tournaments/${tournament.id}`}>
            <Button variant="ghost">Страница турнира</Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-slate-500">Статус</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {tournament.status === 'registration' ? 'Регистрация' : tournament.status === 'ongoing' ? 'Идёт' : 'Завершён'}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-500">Участники</div>
          <div className="mt-2 text-2xl font-semibold text-white">{tournament.participantIds.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-500">Размер сетки</div>
          <div className="mt-2 text-2xl font-semibold text-white">{tournament.maxParticipants}</div>
        </Card>
      </div>

      {tournament.status === 'registration' && (
        <Card className="mb-8 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">Управление до старта</div>
              <div className="text-sm text-slate-500">Можно добавлять участников, менять размер сетки и запускать турнир.</div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setAddOpen(true)}>+ Добавить участника</Button>
              <Button
                onClick={async () => mutationToast(await startTournament(tournament.id), 'Турнир запущен')}
                disabled={tournament.participantIds.length < 2}
              >
                Начать турнир
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {BRACKET_SIZES.map((size) => (
              <Button
                key={size}
                variant={tournament.maxParticipants === size ? 'primary' : 'secondary'}
                onClick={async () => mutationToast(await resizeTournament(tournament.id, size), 'Размер сетки обновлён')}
              >
                {size}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-4 text-lg font-semibold text-white">Список участников</div>
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-sm text-slate-500">Здесь пока пусто</div>
            ) : (
              participants.map((participant) => (
                <div key={participant!.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <PlayerPill user={participant!} />
                  </div>
                  {tournament.status === 'registration' && (
                    <Button
                      variant="danger"
                      onClick={async () => mutationToast(await removeParticipant(tournament.id, participant!.id), 'Участник удалён')}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-lg font-semibold text-white">Сетка</div>
          <BracketView
            tournament={tournament}
            users={users}
            canManage={tournament.status === 'ongoing'}
            manageLinkBase={`/organizer/tournaments/${tournament.id}/matches`}
          />
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Добавить участника по ID">
        <div className="space-y-4">
          <Input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="PL-483921" />
          <Button
            className="w-full"
            onClick={async () => {
              const result = await addParticipantByPublicId(tournament.id, lookupId);
              if (result.ok) {
                toast.success('Участник добавлен');
                setLookupId('');
                setAddOpen(false);
              } else {
                toast.error(result.message);
              }
            }}
          >
            Найти и добавить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
