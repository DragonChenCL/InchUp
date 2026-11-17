import type { Goal, Task } from '../shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(path, data === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.error || '操作暂时没有完成，请稍后重试。');
  return result as T;
}

export function addDays(date: string, offset: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86400_000).toISOString().slice(0, 10);
}

export function prettyDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', ...options }).format(new Date(value.length === 10 ? `${value}T12:00:00+08:00` : value));
}

export function daysLeft(deadline: string, today: string): number {
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86400_000);
}

export function progress(goal: Pick<Goal, 'status' | 'tasks'>): number {
  if (goal.status === 'completed') return 100;
  return goal.tasks.length ? Math.round(goal.tasks.filter(t => t.doneAt).length / goal.tasks.length * 100) : 0;
}

export type TaskWithGoal = Task & { goal: Goal };

export function allTasks(goals: Goal[]): TaskWithGoal[] {
  return goals.flatMap(goal => goal.tasks.map(task => ({ ...task, goal })));
}

export function readSaved<T>(key: string, initial: T): T {
  try { const raw = localStorage.getItem(key); return raw ? { ...initial, ...JSON.parse(raw) } : initial; }
  catch { return initial; }
}

export const stakeNames = { vps: '服务器 / VPS', physical: '实物', service: '技术服务', other: '其他心意' };
export const statusNames = { active: '进行中', completed: '已达成', failed: '本轮未完成' };
