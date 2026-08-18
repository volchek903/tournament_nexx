import { clsx } from 'clsx';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ru } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';
import { DISCIPLINES } from '@/constants/domain';
import type { Discipline } from '@/types/app';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateTournamentCode(existingCodes: string[]) {
  let code = '';
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (existingCodes.includes(code));
  return code;
}

export function generatePublicPlayerId(existingIds: string[]) {
  let id = '';
  do {
    id = `PL-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (existingIds.includes(id));
  return id;
}

export function generatePassword() {
  return `PLAY${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getDisciplineLabel(value: Discipline, custom?: string) {
  if (value === 'other') return custom || 'Другое';
  return DISCIPLINES.find((item) => item.value === value)?.label ?? 'Другое';
}

export function formatDateTime(date: string) {
  return format(new Date(date), 'd MMMM · HH:mm', { locale: ru });
}

export function getCountdown(date: string) {
  return formatDistanceToNowStrict(new Date(date), { locale: ru, addSuffix: false });
}

export function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  return Promise.resolve();
}

export function isValidFutureStart(startAt: string) {
  return new Date(startAt).getTime() - Date.now() >= 5 * 60 * 1000;
}

export function getInitials(login: string) {
  return login
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
