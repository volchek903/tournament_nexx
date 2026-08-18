import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { copyText } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export default function TournamentSuccess() {
  const { id } = useParams();
  const tournament = useAppStore((state) => state.tournaments.find((item) => item.id === id) ?? null);

  if (!tournament) return <Navigate to="/404" replace />;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4">
      <Card className="w-full p-8 text-center">
        <div className="text-sm uppercase tracking-[0.24em] text-blue-300">Турнир создан</div>
        <h1 className="mt-4 text-4xl font-bold text-white">{tournament.title}</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Код</div>
            <div className="mt-2 text-2xl font-semibold text-white">{tournament.code}</div>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                copyText(tournament.code);
                toast.success('Код скопирован');
              }}
            >
              Скопировать
            </Button>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Пароль</div>
            <div className="mt-2 text-2xl font-semibold text-white">{tournament.password}</div>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                copyText(tournament.password);
                toast.success('Пароль скопирован');
              }}
            >
              Скопировать
            </Button>
          </Card>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/organizer/tournaments/${tournament.id}/manage`}>
            <Button>Управлять турниром</Button>
          </Link>
          <Link to={`/tournaments/${tournament.id}`}>
            <Button variant="secondary">Открыть турнир</Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              copyText(`Код: ${tournament.code} | Пароль: ${tournament.password}`);
              toast.success('Данные турнира скопированы');
            }}
          >
            Скопировать данные
          </Button>
        </div>
      </Card>
    </div>
  );
}
