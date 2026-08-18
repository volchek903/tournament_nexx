import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';

const schema = z
  .object({
    login: z.string().min(3, 'Минимум 3 символа'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(6, 'Подтвердите пароль'),
    avatar: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAppStore((state) => state.register);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const result = await registerUser(values);
    if (!result.ok) {
      setSubmitError(result.message ?? 'Не удалось зарегистрироваться');
      return;
    }
    navigate('/profile', { replace: true });
  };

  const onInvalid = () => {
    setSubmitError('Форма не отправлена. Проверь логин, email и совпадение паролей.');
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center px-4">
      <Card className="w-full p-6">
          <div className="mb-6">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Регистрация</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Создать аккаунт игрока</h1>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Логин</label>
            <Input placeholder="Минимум 3 символа" {...register('login')} />
            {errors.login && <p className="mt-1 text-xs text-red-400">{errors.login.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email</label>
            <Input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Пароль</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Повтор пароля</label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-slate-300">Аватар, опционально</label>
            <Input placeholder="Например AX" {...register('avatar')} />
          </div>
          {submitError && <p className="sm:col-span-2 text-sm text-red-400">{submitError}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Уже есть аккаунт? <Link className="text-blue-300" to="/login">Войти</Link>
        </p>
      </Card>
    </div>
  );
}
