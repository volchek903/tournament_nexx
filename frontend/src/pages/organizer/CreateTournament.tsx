import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { BRACKET_SIZES, DISCIPLINES, FORMAT_OPTIONS } from '@/constants/domain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { generatePassword } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const schema = z.object({
  title: z.string().min(3, 'Введите название турнира'),
  discipline: z.enum(['football', 'basketball', 'volleyball', 'tennis', 'table_tennis', 'hockey', 'esports', 'other']),
  customDiscipline: z.string().optional(),
  format: z.enum(['single_elimination', 'double_elimination', 'groups_playoff']),
  maxParticipants: z.coerce.number().min(4),
  description: z.string().min(8, 'Кратко опишите турнир'),
  prize: z.string().optional(),
  rules: z.string().optional(),
  startDate: z.string().min(1, 'Выберите дату'),
  startTime: z.string().min(1, 'Выберите время'),
  password: z.string().min(4, 'Минимум 4 символа'),
});

type FormValues = z.infer<typeof schema>;

export default function CreateTournament() {
  const navigate = useNavigate();
  const createTournament = useAppStore((state) => state.createTournament);
  const [step, setStep] = useState<number>(1);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      discipline: 'football',
      format: 'single_elimination',
      maxParticipants: 8,
      password: generatePassword(),
    },
  });

  const values = watch();

  const nextStep = async () => {
    const fieldsByStep: Record<number, Array<keyof FormValues>> = {
      1: ['title', 'discipline', 'customDiscipline'],
      2: ['format', 'maxParticipants'],
      3: ['description', 'prize', 'rules', 'startDate', 'startTime', 'password'],
    };
    const ok = await trigger(fieldsByStep[step] ?? []);
    if (ok) setStep((value: number) => Math.min(4, value + 1));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Создание турнира</h1>
        <p className="mt-2 text-slate-400">Сначала рабочий wizard и логика, потом визуальный polish.</p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={`h-2 flex-1 rounded-full ${item <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        <form
          onSubmit={handleSubmit(async (formValues) => {
            const result = await createTournament({
              title: formValues.title,
              discipline: formValues.discipline,
              customDiscipline: formValues.customDiscipline ?? '',
              format: formValues.format,
              maxParticipants: formValues.maxParticipants,
              description: formValues.description,
              prize: formValues.prize ?? '',
              rules: formValues.rules ?? '',
              startAt: new Date(`${formValues.startDate}T${formValues.startTime}:00`).toISOString(),
              password: formValues.password,
            });
            if (result.ok && result.entityId) navigate(`/organizer/tournaments/${result.entityId}/success`);
          })}
          className="space-y-6"
        >
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Название турнира</label>
                <Input {...register('title')} />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Дисциплина</label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {DISCIPLINES.filter((item) => item.value !== 'table_tennis').map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setValue('discipline', item.value)}
                      className={`rounded-xl border px-4 py-3 text-left ${
                        values.discipline === item.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {values.discipline === 'other' && (
                <div>
                  <label className="mb-1.5 block text-sm text-slate-300">Название дисциплины</label>
                  <Input {...register('customDiscipline')} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Формат турнира</label>
                <div className="grid gap-3 lg:grid-cols-3">
                  {FORMAT_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setValue('format', item.value)}
                      className={`rounded-xl border px-4 py-4 text-left ${
                        values.format === item.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="mt-2 text-sm text-slate-400">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Количество участников</label>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {BRACKET_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setValue('maxParticipants', size)}
                      className={`rounded-xl border px-4 py-3 ${
                        values.maxParticipants === size ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-sm text-slate-300">Описание</label>
                <Textarea rows={4} {...register('description')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Приз</label>
                <Input placeholder="200 BYN" {...register('prize')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Пароль</label>
                <div className="flex gap-2">
                  <Input {...register('password')} />
                  <Button type="button" variant="secondary" onClick={() => setValue('password', generatePassword())}>
                    Генерировать
                  </Button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Дата</label>
                <Input type="date" {...register('startDate')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Время</label>
                <Input type="time" {...register('startTime')} />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-sm text-slate-300">Дополнительные правила</label>
                <Textarea rows={3} {...register('rules')} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {[
                ['Название', values.title],
                ['Дисциплина', values.customDiscipline || DISCIPLINES.find((item) => item.value === values.discipline)?.label],
                ['Формат', FORMAT_OPTIONS.find((item) => item.value === values.format)?.label],
                ['Участники', values.maxParticipants],
                ['Старт', `${values.startDate} ${values.startTime}`],
                ['Приз', values.prize || 'Без приза'],
                ['Пароль', values.password],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((value: number) => Math.max(1, value - 1))}>
              Назад
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={nextStep}>Дальше</Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Создаём...' : 'Создать турнир'}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
