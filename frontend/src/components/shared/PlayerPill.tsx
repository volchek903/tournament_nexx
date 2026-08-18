import { Link } from 'react-router-dom';
import { cn, getInitials } from '@/lib/utils';
import type { User } from '@/types/app';

interface PlayerPillProps {
  user?: User | null;
  subtitle?: string;
  faded?: boolean;
}

export function PlayerPill({ user, subtitle, faded }: PlayerPillProps) {
  if (!user) {
    return <div className="rounded-xl border border-dashed border-slate-800 px-3 py-3 text-sm text-slate-500">Ожидается участник</div>;
  }

  const content = (
    <div className={cn('flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-3 transition', faded && 'opacity-50 grayscale')}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
        {user.avatar || getInitials(user.login)}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{user.login}</div>
        <div className="text-xs text-slate-500">{subtitle || user.publicId}</div>
      </div>
    </div>
  );

  return <Link to={`/players/${user.id}`}>{content}</Link>;
}
