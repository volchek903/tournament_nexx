import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';

const schema = z.object({
  name: z.string().min(2, 'Введите имя'),
  contact: z.string().min(3, 'Введите контакт'),
  reason: z.string().min(8, 'Кратко опишите цель'),
});

type FormValues = z.infer<typeof schema>;

export default function OrganizerRequest() {
  const currentUser = useCurrentUser();
  const requestOrganizerAccess = useAppStore((state) => state.requestOrganizerAccess);
  const approveOrganizerAccess = useAppStore((state) => state.approveOrganizerAccess);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'organizer') return <Navigate to="/organizer/tournaments" replace />;

  if (currentUser.organizerStatus === 'pending') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Заявка отправлена</h1>
          <p className="mt-3 text-slate-400">Для MVP доступ можно одобрить сразу демо-кнопкой.</p>
          <Button
            className="mt-5"
            onClick={async () => {
              await approveOrganizerAccess();
              toast.success('Права организатора активированы');
            }}
          >
            Одобрить в демо
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card className="p-6">
        <h1 className="text-3xl font-bold text-white">Стать организатором</h1>
        <p className="mt-2 text-slate-400">Оставь заявку, чтобы создавать турниры и управлять матчами.</p>
        <form
          onSubmit={handleSubmit(async (values) => {
            await requestOrganizerAccess(values);
            toast.success('Заявка отправлена');
          })}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Имя</label>
            <Input {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Контакт</label>
            <Input {...register('contact')} />
            {errors.contact && <p className="mt-1 text-xs text-red-400">{errors.contact.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Зачем нужен доступ</label>
            <Textarea rows={4} {...register('reason')} />
            {errors.reason && <p className="mt-1 text-xs text-red-400">{errors.reason.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>Отправить заявку</Button>
        </form>
      </Card>
    </div>
  );
}
