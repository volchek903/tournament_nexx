import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 text-center">
      <div>
        <div className="text-sm uppercase tracking-[0.24em] text-slate-500">404</div>
        <h1 className="mt-4 text-5xl font-bold text-white">Страница не найдена</h1>
        <p className="mt-4 text-slate-400">Похоже, маршрут не существует или был перемещён.</p>
        <Link to="/" className="mt-8 inline-block">
          <Button>Вернуться на главную</Button>
        </Link>
      </div>
    </div>
  );
}
