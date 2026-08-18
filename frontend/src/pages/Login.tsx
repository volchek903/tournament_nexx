import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';

const schema = z.object({
  email: z.string().min(1, 'Введите email или admin'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAppStore((state) => state.login);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const state = (location.state ?? {}) as { from?: string; tournamentId?: string };
    const result = await login(values.email, values.password, { tournamentId: state.tournamentId });
    if (!result.ok) {
      setSubmitError(result.message ?? 'Не удалось войти');
      return;
    }
    navigate(state.from ?? '/profile', { replace: true });
  };

  const onInvalid = () => {
    setSubmitError('Форма не отправлена. Введи логин или email и пароль.');
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center px-4">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Вход</div>
          <h1 className="text-4xl font-bold">Вернись в турнир</h1>
          <p className="text-slate-400">
            Обычный вход работает по email и паролю. Для демо-переключения в аккаунт создателя текущего турнира используй `admin` / `user`.
          </p>
        </div>
        <Card className="p-6">
          <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Email или demo login</label>
              <Input placeholder="you@example.com или admin" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Пароль</label>
              <Input type="password" placeholder="Введите пароль" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Входим...' : 'Войти'}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/register" className="text-blue-300">Регистрация</Link>
            <span className="text-slate-500">Восстановить пароль</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
