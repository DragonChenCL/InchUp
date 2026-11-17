import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock3, Gift, Leaf, Play, Plus, Sparkles, Users } from 'lucide-react';
import type { AppState } from '../../shared/types';
import { addDays, allTasks, daysLeft, prettyDate, progress, type TaskWithGoal } from '../lib';
import { Empty, ProgressBar, SectionLink } from './ui';
import { Sprite } from './Mascot';
import { JourneyIcon, PromiseSeal, StepTrail } from './brand';
import { MiniCommunityCard, type ViewActions } from './views';

export function Dashboard({ state, actions, query, celebration }: { state: AppState; actions: ViewActions; query: string; celebration: number }) {
  const [celebrating, setCelebrating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(state.today);
  const previousToday = useRef(state.today);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  useEffect(() => {
    const previous = previousToday.current;
    previousToday.current = state.today;
    setSelectedDate(current => current === previous ? state.today : current);
  }, [state.today]);
  useEffect(() => {
    if (!celebration) return;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), 4000);
    return () => clearTimeout(timer);
  }, [celebration]);

  const activeGoals = state.goals.filter(goal => goal.status === 'active');
  const tasks = allTasks(state.goals);
  const todayTasks = tasks.filter(task => task.date === state.today);
  const todayDone = todayTasks.filter(task => task.doneAt).length;
  const pending = tasks.filter(task => !task.doneAt && task.date <= state.today && task.goal.status === 'active')
    .sort((a, b) => a.date.localeCompare(b.date) || a.position - b.position);
  const nextTask = pending[0];
  const mainGoal = [...activeGoals].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const dateTasks = tasks.filter(task => task.date === selectedDate || (selectedDate === state.today && task.date < state.today && !task.doneAt && task.goal.status === 'active'));
  const selectedTasks = dateTasks.filter(task => `${task.title} ${task.goal.title}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'all' || (filter === 'done' ? Boolean(task.doneAt) : !task.doneAt)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.position - b.position);
  const selectedDone = dateTasks.filter(task => task.doneAt).length;
  const monday = addDays(selectedDate, -((new Date(`${selectedDate}T12:00:00Z`).getUTCDay() + 6) % 7));
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  const allDone = selectedDate === state.today && dateTasks.length > 0 && selectedDone === dateTasks.length;

  return <>
    <div className="page-heading today-heading">
      <div className="heading-copy"><span className="eyebrow"><JourneyIcon name="today" size={17}/>每天一寸，自有进步</span><h1>今天，从这一小步开始<span className="heading-dot">。</span></h1><p>{state.user.name}，{pending.length ? `还有 ${pending.length} 件小事，按自己的节奏来。` : '给自己留一点时间，也给新的可能留一点空间。'}</p></div>
      <button className="button button-white" onClick={actions.onCreate}><Plus size={17}/>新建契约</button>
    </div>

    <section className="today-brief" aria-label="今天的下一步">
      <div className="next-step-card">
        <div className="next-step-label"><span className="step-number">01</span><span>{nextTask ? '下一步 · 就从这里开始' : activeGoals.length ? '留一格，给新的小步子' : '第一步 · 和自己拉个勾'}</span><JourneyIcon name="today" size={22}/></div>
        <h2>{nextTask?.title || (activeGoals.length ? '今天的安排，慢慢来。' : '把一直想做的事，写成一个约定。')}</h2>
        <div className="next-step-bottom"><p>{nextTask ? <><Clock3 size={15}/><strong>{nextTask.minutes} 分钟</strong><span className="next-step-goal">{nextTask.goal.title}</span></> : '小到可以马上开始，就已经很好。'}</p><button className="button button-primary" onClick={() => nextTask ? actions.onFocus(nextTask) : activeGoals.length ? actions.onTask() : actions.onCreate()}>{nextTask ? <Play size={15} fill="currentColor"/> : <Plus size={16}/>} {nextTask ? '开始这一小步' : activeGoals.length ? '安排一小步' : '立下第一个约定'}<ArrowRight size={16}/></button></div>
      </div>
      <div className="companion-note"><div className="companion-note-copy"><span className="notebook-label">寸寸的今日便签</span><p>不用一下子很厉害，<br/><strong>每一小步，都算数。</strong></p><StepTrail/></div><div className="companion-portrait"><Sprite mood={celebrating ? 'celebrate' : 'idle'} size={116}/></div></div>
    </section>

    <div className="daily-summary" aria-label="今日行动概览">
      <div><span>待完成</span><strong>{pending.length}<small>件</small></strong></div>
      <div><span>今天完成</span><strong>{todayDone}<small>/ {todayTasks.length} 件</small></strong></div>
      <div><span>连续行动</span><strong>{state.streak}<small>天</small></strong></div>
      <div><span>进行中的约定</span><strong>{activeGoals.length}<small>个</small></strong></div>
    </div>

    <div className="dashboard-columns">
      <section className="panel task-panel">
        <div className="panel-heading"><h2><JourneyIcon name="today" size={21}/>{selectedDate === state.today ? '今天的小步子' : `${prettyDate(selectedDate)}的小步子`}<span className="count-badge">{dateTasks.length}</span></h2><button className="text-button" onClick={() => actions.onTask()}><Plus size={16}/>添加待办</button></div>
        <div className="week-navigation"><span>{prettyDate(monday)} — {prettyDate(addDays(monday, 6))}</span><div><button className="icon-button" onClick={() => setSelectedDate(addDays(selectedDate, -7))} aria-label="查看上一周同一天"><ChevronLeft size={18}/></button><button className="icon-button" onClick={() => setSelectedDate(addDays(selectedDate, 7))} aria-label="查看下一周同一天"><ChevronRight size={18}/></button></div></div>
        <div className="week-strip">{weekdays.map((day, index) => {
          const date = addDays(monday, index);
          return <button className={`week-day ${selectedDate === date ? 'selected' : ''} ${date === state.today ? 'is-today' : ''}`} key={date} aria-pressed={selectedDate === date} aria-label={`${prettyDate(date)}，星期${day}`} onClick={() => setSelectedDate(date)}><span>周{day}</span><strong>{Number(date.slice(-2))}</strong><i className={tasks.some(task => task.date === date) ? 'has-tasks' : ''}/></button>;
        })}</div>
        <div className="task-toolbar"><div className="segmented-tabs">{([['pending', '待完成'], ['done', '已完成'], ['all', '全部']] as const).map(([key, label]) => <button className={filter === key ? 'active' : ''} key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><button className="mini-date" onClick={() => setSelectedDate(state.today)} aria-label="回到今天">{selectedDate === state.today ? `已完成 ${selectedDone}/${dateTasks.length}` : '回到今天'}<ArrowRight size={13}/></button></div>
        <div className="task-list">{selectedTasks.length ? selectedTasks.map(task => <TaskRow key={task.id} task={task} today={state.today} onToggle={() => actions.onToggle(task)} onFocus={() => actions.onFocus(task)} busy={actions.busy}/>) : <Empty title={query ? '没有找到这一步' : filter === 'done' ? '完成的每一步，会收在这里' : allDone ? '今天的小步子，都走完啦' : '给这一天，安排一件小事'} description={query ? '试试任务名称或所属目标的关键词。' : allDone ? '好好休息，明天继续。今天的努力已经记下了。' : '从一件具体、做得到的小事开始。'} action={query || allDone || filter === 'done' ? undefined : '添加一小步'} onAction={() => actions.onTask()}/>}</div>
        <div className="task-bottom-note"><Leaf size={15}/><span>不赶路，也在前进。</span><StepTrail/></div>
      </section>
      <aside className="dashboard-aside">
        <section className="panel promise-panel"><div className="panel-heading"><h2><JourneyIcon name="goals" size={21}/>最近的约定</h2><SectionLink onClick={() => actions.onNavigate('goals')}>全部</SectionLink></div>{mainGoal ? <><button className="featured-goal" onClick={() => actions.onGoal(mainGoal.id)}><div className="promise-heading"><span className="notebook-label">认真许下 · 一点点兑现</span><PromiseSeal/></div><h3>{mainGoal.title}</h3><p><Clock3 size={15}/>{daysLeft(mainGoal.deadline, state.today) < 0 ? '等待结果申报' : daysLeft(mainGoal.deadline, state.today) === 0 ? '今天截止' : `还有 ${daysLeft(mainGoal.deadline, state.today)} 天`}<span>·</span>{prettyDate(mainGoal.deadline)}</p><div className="progress-caption"><span>任务进度</span><strong>{progress(mainGoal)}%</strong></div><ProgressBar value={progress(mainGoal)}/></button><div className="pledge-ticket"><div className="pledge-title"><Gift size={16}/><span>{mainGoal.stakeTitle ? '约定里的小心意' : '送给未来的自己'}</span></div><strong>{mainGoal.stakeTitle || '认真完成，就是最好的奖励'}</strong><p>{mainGoal.stakeTitle ? '如未完成，自愿送给一位有缘的佬友。' : '轻装上阵，把精力留给想做的事。'}</p></div></> : <Empty title="给未来，留一个约定" description="把想做的事，变成可以开始的一步。" action="创建契约" onAction={actions.onCreate}/>}</section>
        <section className="ai-note"><div className="ai-note-top"><Sparkles size={22}/><span className="notebook-label">拆小一点，更容易开始</span></div><h3>大目标，交给小步骤。</h3><p>让 AI 帮你安排最近七天，<br/>一次只关注眼前的一步。</p><button onClick={() => actions.onPlan()}>帮我拆解目标<ArrowUpRight size={17}/></button></section>
      </aside>
    </div>
    <section className="community-preview"><div className="section-heading"><div><h2><JourneyIcon name="community" size={22}/> 路上，也有人同行</h2><p>看看佬友们正在认真做的事。</p></div><SectionLink onClick={() => actions.onNavigate('community')}>去广场看看</SectionLink></div><div className="community-mini-grid">{state.community.filter(goal => goal.user.id !== state.user.id).slice(0, 3).map((goal, index) => <MiniCommunityCard goal={goal} key={goal.id} index={index}/>)}{!state.community.some(goal => goal.user.id !== state.user.id) && <div className="community-empty"><Users size={24}/><p>公开你的契约，让同行从这里开始。</p><button className="text-button" onClick={actions.onCreate}>立个约定<ArrowRight size={15}/></button></div>}</div></section>
  </>;
}

function TaskRow({ task, today, onToggle, onFocus, busy }: { task: TaskWithGoal; today: string; onToggle: () => void; onFocus: () => void; busy: boolean }) {
  return <div className={`task-row ${task.doneAt ? 'is-done' : ''}`}>
    <button className="task-checkbox" onClick={onToggle} aria-label={`${task.doneAt ? '取消完成' : '完成'}：${task.title}`} aria-pressed={Boolean(task.doneAt)} disabled={busy || task.goal.status !== 'active'}><span>{task.doneAt && <Check size={15} strokeWidth={3}/>}</span></button>
    <div className="task-text"><strong>{task.title}</strong><p><span className="task-category">{task.goal.title}</span>{!task.doneAt && task.date < today && <span className="overdue-label">待补上</span>}</p></div>
    <span className="task-duration"><Clock3 size={14}/>{task.minutes}<small>分钟</small></span>
    {task.doneAt ? <span className="task-done-label"><Check size={16}/><span className="sr-only">已完成</span></span> : <button className="task-start" onClick={onFocus} aria-label={`专注完成：${task.title}`} disabled={task.goal.status !== 'active'}><Play size={16}/></button>}
  </div>;
}
