import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, Check, Clock3, Flame, Flower2, Medal, Sprout } from 'lucide-react';
import type { AppState } from '../../shared/types';
import { addDays, allTasks, prettyDate, type TaskWithGoal } from '../lib';
import { Empty } from './ui';
import './growth-view.css';

type GrowthViewProps = { state: AppState; query: string; onExport: () => void };

const beijingFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 将完成时间转换成北京时间日期，避免 UTC 跨日导致记录落在错误的一天。 */
function beijingDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = Object.fromEntries(beijingFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** 以周一为一周的第一天，与热力图左侧的星期标记保持一致。 */
function beijingWeekday(date: string): number {
  return (new Date(`${date}T12:00:00+08:00`).getUTCDay() + 6) % 7;
}

function formatGrowthDate(date: string): string {
  return prettyDate(date, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function matchesQuery(task: TaskWithGoal, query: string): boolean {
  return `${task.title} ${task.goal.title}`.toLowerCase().includes(query.toLowerCase());
}

export function GrowthView({ state, query, onExport }: GrowthViewProps) {
  const [selectedDate, setSelectedDate] = useState(state.today);
  const heatmapScroll = useRef<HTMLDivElement>(null);
  useEffect(() => setSelectedDate(state.today), [state.today]);
  useEffect(() => {
    const element = heatmapScroll.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, [state.today]);
  const tasks = useMemo(() => allTasks(state.goals)
    .filter(task => task.doneAt && matchesQuery(task, query))
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!)), [state.goals, query]);
  const total = state.history.reduce((sum, item) => sum + item.count, 0);
  const minutes = state.history.reduce((sum, item) => sum + item.minutes, 0);
  const completed = state.goals.filter(goal => goal.status === 'completed').length;
  const historyByDate = useMemo(() => {
    if (!query) return new Map(state.history.map(item => [item.date, item.count]));
    const counts = new Map<string, number>();
    tasks.forEach(task => {
      const date = beijingDateKey(task.doneAt!);
      counts.set(date, (counts.get(date) || 0) + 1);
    });
    return counts;
  }, [state.history, tasks, query]);
  const taskDateKeys = useMemo(() => Array.from(new Set(tasks.map(task => beijingDateKey(task.doneAt!)))), [tasks]);
  const timelineDates = useMemo(() => Array.from(new Set(taskDateKeys)).sort((a, b) => b.localeCompare(a)), [taskDateKeys]);
  const heatmap = useMemo(() => {
    const rangeStart = addDays(state.today, -83);
    const rangeEnd = state.today;
    const gridStart = addDays(rangeStart, -beijingWeekday(rangeStart));
    const gridEnd = addDays(rangeEnd, 6 - beijingWeekday(rangeEnd));
    const totalDays = Math.round((Date.parse(`${gridEnd}T12:00:00Z`) - Date.parse(`${gridStart}T12:00:00Z`)) / 86400_000) + 1;
    const dates = Array.from({ length: totalDays }, (_, index) => addDays(gridStart, index));
    const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, index) => dates.slice(index * 7, index * 7 + 7));
    const monthKeys = weeks.map(week => week.map(date => date >= rangeStart && date <= rangeEnd ? date.slice(0, 7) : '').find(Boolean) || '');
    return { rangeStart, rangeEnd, weeks, monthKeys };
  }, [state.today]);
  const selectedTasks = tasks.filter(task => beijingDateKey(task.doneAt!) === selectedDate);
  const selectedCount = historyByDate.get(selectedDate) || 0;

  return <div className="growth-page">
    <div className="page-heading growth-page-heading"><div className="heading-copy"><span className="eyebrow"><span className="tiny-star">✳</span>那些看起来很小的事，正在慢慢改变你</span><h1>你走过的每一步，都算数<span className="heading-dot">。</span></h1><p>回头看看，原来已经走了这么远。</p></div><button className="button button-white" onClick={onExport}><ArrowDownToLine size={16} />导出我的记录</button></div>

    <div className="growth-summary">
      <div><span className="growth-icon"><Sprout size={29} /></span><p>累计完成<strong>{total}<small>件小事</small></strong></p></div>
      <div><span className="growth-icon peach"><Clock3 size={29} /></span><p>预计投入累计<strong>{(minutes / 60).toFixed(1)}<small>小时</small></strong></p></div>
      <div><span className="growth-icon butter"><Medal size={29} /></span><p>兑现约定<strong>{completed}<small>次</small></strong></p></div>
    </div>

    <section className="panel heatmap-panel growth-heatmap-panel"><div className="panel-heading"><h2><span className="heading-line sage-line" />把认真生活，涂成颜色</h2><span className="muted">最近 84 天</span></div><div className="heatmap-layout growth-heatmap-layout"><div className="heatmap-days growth-week-labels" aria-hidden="true"><span>一</span><span>三</span><span>五</span><span>日</span></div><div className="growth-heatmap-scroll" ref={heatmapScroll}><div className="growth-heatmap-months" style={{ gridTemplateColumns: `repeat(${heatmap.weeks.length}, minmax(12px, 1fr))` }} aria-hidden="true">{heatmap.monthKeys.map((month, index) => <span key={`${month}-${index}`}>{month && (index === 0 || month !== heatmap.monthKeys[index - 1]) ? `${Number(month.slice(5))}月` : ''}</span>)}</div><div className="heatmap growth-heatmap-grid" role="group" aria-label="最近 84 天的完成热力图" style={{ gridTemplateColumns: `repeat(${heatmap.weeks.length}, minmax(12px, 1fr))` }}>{heatmap.weeks.flatMap(week => week.map(date => { const inRange = date >= heatmap.rangeStart && date <= heatmap.rangeEnd; if (!inRange) return <span className="heatmap-cell growth-heatmap-cell heatmap-cell-outside" aria-hidden="true" key={date} />; const count = historyByDate.get(date) || 0; const isSelected = date === selectedDate; return <button type="button" className={`heatmap-cell growth-heatmap-cell heat-${Math.min(count, 4)} ${isSelected ? 'is-selected' : ''}`} key={date} onClick={() => setSelectedDate(date)} aria-label={`${formatGrowthDate(date)}：完成 ${count} 件事`} aria-pressed={isSelected} title={`${formatGrowthDate(date)}：完成 ${count} 件事`} />; }))}</div></div><div className="heatmap-quote growth-heatmap-quote"><Flower2 size={30} /><p>每天一点点，<br />就会很不一样。</p></div></div><div className="heatmap-bottom growth-heatmap-bottom"><span><Flame size={14} />当前连续行动 {state.streak} 天</span><span>少<i className="heatmap-cell heat-0" /><i className="heatmap-cell heat-1" /><i className="heatmap-cell heat-2" /><i className="heatmap-cell heat-3" /><i className="heatmap-cell heat-4" />多</span></div><div className="growth-day-detail" aria-live="polite"><div><span className="growth-detail-kicker">{selectedDate === state.today ? '今天的完成' : '选中日期'}</span><h3>{formatGrowthDate(selectedDate)}</h3></div><span className="growth-detail-count">{selectedCount} 件小事</span>{selectedTasks.length ? <div className="growth-day-task-list">{selectedTasks.map(task => <div className="growth-day-task" key={task.id}><span className="history-check"><Check size={13} /></span><div><strong>{task.title}</strong><p>{task.goal.title}</p></div><span><Clock3 size={12} />{task.minutes} 分钟</span></div>)}</div> : <p className="growth-day-empty">这一天还没有匹配的完成记录，换一天看看吧。</p>}</div></section>

    <section className="panel timeline-panel growth-timeline-panel"><div className="panel-heading"><h2><span className="heading-line" />小步子的回响</h2><span className="muted">按北京时间完成日期记录</span></div>{tasks.length ? <div className="history-timeline">{timelineDates.map(date => <div className="history-day" key={date}><h3><span />{formatGrowthDate(date)}</h3>{tasks.filter(task => beijingDateKey(task.doneAt!) === date).map(task => <div className="history-item" key={task.id}><span className="history-check"><Check size={13} /></span><div><strong>{task.title}</strong><p>{task.goal.title}</p></div><span><Clock3 size={12} />{task.minutes} 分钟</span></div>)}</div>)}</div> : <Empty title="第一步的回响，就在这里等你" description="完成一件待办后，寸寸会帮你把它认真收好。" />}</section>
  </div>;
}
