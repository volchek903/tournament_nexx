import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Trophy, Users } from 'lucide-react';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';

export default function Home() {
  const currentUser = useCurrentUser();
  const allTournaments = useAppStore((state) => state.tournaments);
  const users = useAppStore((state) => state.users);
  const tournaments = useMemo(() => allTournaments.slice(0, 3), [allTournaments]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-blue-300">
            Private Tournament MVP
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
              Создай настоящий турнир с друзьями
            </h1>
            <p className="max-w-2xl text-lg text-slate-400">
              Соберите участников, создайте сетку, проводите матчи и определите чемпиона без таблиц, бумажек и ручного подсчёта.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/tournaments">
              <Button>
                Найти турнир
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={currentUser ? '/profile' : '/register'}>
              <Button variant="secondary">Начать играть</Button>
            </Link>
            {!currentUser && (
              <Link to="/login">
                <Button variant="ghost">Войти</Button>
              </Link>
            )}
            {currentUser?.role === 'organizer' && (
              <Link to="/organizer/tournaments/new">
                <Button variant="secondary">Создать турнир</Button>
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Турниров', value: String(useAppStore.getState().tournaments.length) },
              { label: 'Игроков', value: String(users.length) },
              { label: 'Организаторов', value: String(users.filter((user) => user.role === 'organizer').length) },
            ].map(({ label, value }) => (
              <Card key={label} className="p-4">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </Card>
            ))}
          </div>
        </div>

        <motion.div
          className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mock bracket</h2>
            <Trophy className="h-5 w-5 text-blue-300" />
          </div>
          <div className="grid gap-3 text-sm text-slate-300">
            {['AlexPro ── MaxStorm', 'DenisPlay ── Frost', 'Titan ── Wolf', 'Sova ── Vortex'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                {item}
              </div>
            ))}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-4 text-blue-100">
              Победители автоматически проходят дальше, а профиль и рейтинг обновляются после завершения турнира.
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {[
          { title: 'Создай турнир', text: 'Выбираешь дисциплину, формат, размер сетки и дату старта.', Icon: Trophy },
          { title: 'Пригласи друзей', text: 'Каждый турнир получает уникальный код и пароль для входа.', Icon: Users },
          { title: 'Проведи соревнование', text: 'Организатор управляет матчами и определяет чемпиона.', Icon: ShieldCheck },
        ].map(({ title, text, Icon }) => (
          <Card key={title} className="p-5">
            <Icon className="mb-4 h-5 w-5 text-blue-300" />
            <div className="mb-2 text-lg font-semibold text-white">{title}</div>
            <div className="text-sm text-slate-400">{text}</div>
          </Card>
        ))}
      </section>

      <section className="py-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Актуальные турниры</h2>
            <p className="text-sm text-slate-500">Все основные маршруты уже связаны, теперь можно проходить сценарии end-to-end.</p>
          </div>
          <Link to="/tournaments" className="text-sm font-semibold text-blue-300">
            Все турниры
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>
    </div>
  );
}
