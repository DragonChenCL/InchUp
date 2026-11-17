import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownToLine, ArrowRight, Bell, BookOpen, Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Coffee, ExternalLink, Gift, Globe2, Heart, LayoutDashboard, Leaf, LoaderCircle, LogIn, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, TrendingUp, Users, X } from 'lucide-react';
import type { AppState, CreateGoalInput, Goal, ModelSettings, PlannedTask, Task } from '../shared/types';
import { addDays, allTasks, api, ApiError, daysLeft, prettyDate, progress, readSaved, stakeNames, statusNames, type TaskWithGoal } from './lib';
import { Avatar, Empty, Logo, Modal, ProgressBar } from './components/ui';
import { Mascot, Sprite, type MascotPreferences } from './components/Mascot';
import { AddTaskDialog, CreateGoalDialog, FocusSession, PlanDialog, RulesDialog, SettleDialog } from './components/dialogs';
import { CommunityView, Dashboard, GiveawaysView, GoalsView, GrowthView, SettingsView } from './components/views';

const navigation = [
  { id: 'today', name: '今日工作台', icon: LayoutDashboard },
  { id: 'goals', name: '我的契约', icon: Target },
  { id: 'community', name: '佬友广场', icon: Users },
  { id: 'giveaways', name: '资源抽奖', icon: Gift },
  { id: 'growth', name: '成长记录', icon: TrendingUp },
];
type DialogState = { type: 'create' } | { type: 'task' | 'plan'; goalId?: string } | { type: 'settle' | 'detail'; goalId: string } | { type: 'rules' | 'login' } | null;
type Toast = { message: string; error?: boolean } | null;
const defaultModel: ModelSettings = { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: '', dailyMinutes: 60, reasoningEffort: 'auto' };
const reasoningEfforts = new Set<ModelSettings['reasoningEffort']>(['auto', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh']);

function loadModelSettings(): ModelSettings {
  const saved = readSaved('inchup-model', defaultModel);
  return { ...defaultModel, ...saved, apiKey: '', reasoningEffort: reasoningEfforts.has(saved.reasoningEffort) ? saved.reasoningEffort : 'auto' };
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const [view, setView] = useState(location.hash.slice(1) || 'today');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [celebration, setCelebration] = useState(0);
  const [focus, setFocus] = useState<TaskWithGoal | null | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [model, setModel] = useState<ModelSettings>(loadModelSettings);
  const [preferences, setPreferences] = useState<MascotPreferences>(() => readSaved('inchup-mascot', { enabled: true, roaming: true, quiet: false }));
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await api<AppState>('/api/state');
    setState(next); setConnectionLost(false); setLoadError(''); setLoginRequired(false);
    return next;
  }, []);

  useEffect(() => {
    refresh().catch(error => { setLoginRequired(error instanceof ApiError && error.status === 401); setLoadError(error instanceof Error ? error.message : '暂时无法连接本地服务。'); });
    const timer = setInterval(() => refresh().catch(() => setConnectionLost(true)), 60_000);
    const hashChange = () => { setView(location.hash.slice(1) || 'today'); setSidebarOpen(false); setQuery(''); };
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('hashchange', hashChange);
    window.addEventListener('keydown', shortcut);
    if (new URLSearchParams(location.search).has('auth_error')) { setToast({ message: '社区登录暂时未完成，请重新授权。', error: true }); history.replaceState(null, '', `${location.pathname}${location.hash}`); }
    return () => { clearInterval(timer); window.removeEventListener('hashchange', hashChange); window.removeEventListener('keydown', shortcut); };
  }, [refresh]);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timer); }, [toast]);

  function navigate(next: string) { location.hash = next; setSidebarOpen(false); }
  function celebrate() { setCelebration(Date.now()); }
  async function act(action: () => Promise<unknown>, message: string, after?: (next: AppState) => void) {
    setBusy(true);
    try { await action(); const next = await refresh(); if (message) setToast({ message }); after?.(next); return true; }
    catch (error) { setToast({ message: error instanceof Error ? error.message : '这一步暂时没有完成。', error: true }); return false; }
    finally { setBusy(false); }
  }

  function login() {
    if (state?.config.linuxdo) location.href = '/auth/linuxdo';
    else setDialog({ type: 'login' });
  }

  async function logout() {
    setBusy(true);
    try { await api('/api/logout', {}); setModel(value => ({ ...value, apiKey: '' })); location.reload(); }
    catch (error) { setToast({ message: error instanceof Error ? error.message : '退出暂时没有完成。', error: true }); }
    finally { setBusy(false); }
  }

  function exportData() {
    if (!state) return;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: state.user, goals: state.goals, history: state.history, giveaways: state.giveaways.filter(g => g.ownerId === state.user.id || g.joined) }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = href; link.download = `寸进成长记录-${state.today}.json`; link.click(); URL.revokeObjectURL(href);
    setToast({ message: '已经把你的每一小步，收进成长档案了。' });
  }

  async function toggleTask(task: Task) {
    await act(() => api(`/api/tasks/${task.id}`, { done: !task.doneAt }), task.doneAt ? '已恢复为待办，按自己的节奏继续。' : '又往前走了一步，做得好！', () => { if (!task.doneAt) celebrate(); });
  }

  function openTask(type: 'task' | 'plan', goalId?: string) {
    if (!state) return;
    if (state.goals.some(g => g.status === 'active' && g.deadline >= state.today && (!goalId || g.id === goalId))) setDialog({ type, goalId });
    else if (goalId) setToast({ message: '这个目标已到截止日之后，请先申报结果。', error: true });
    else setDialog({ type: 'create' });
  }

  function startFocus(task?: TaskWithGoal) {
    const pending = state ? allTasks(state.goals).find(t => !t.doneAt && t.date <= state.today && t.goal.status === 'active') : undefined;
    setFocus(task || pending || null); setDialog(null); setNotifications(false);
  }

  if (!state) return <div className="boot-screen"><Logo/>{loginRequired ? <><Sprite size={210}/><h1>给想做的事，一个开始。</h1><p>使用 LINUX DO 登录，和寸寸一起每天往前一点。</p><a className="button button-primary" href="/auth/linuxdo"><LogIn size={17}/>使用 LINUX DO 登录</a></> : loadError ? <><span className="boot-flower">✳</span><h1>小天地暂时没连上</h1><p>{loadError}</p><button className="button button-primary" onClick={() => { setLoadError(''); refresh().catch(error => setLoadError(error.message)); }}>重新连接<ArrowRight size={16}/></button></> : <><div className="boot-mascot"><Sprite size={165}/></div><p><LoaderCircle size={17} className="spin"/>寸寸正在整理今天的小天地…</p></>}{toast && <ToastNotice toast={toast} onClose={() => setToast(null)}/>}</div>;

  const actions = { onCreate: () => setDialog({ type: 'create' } as DialogState), onTask: (id?: string) => openTask('task', id), onPlan: (id?: string) => openTask('plan', id), onGoal: (id: string) => setDialog({ type: 'detail', goalId: id } as DialogState), onSettle: (id: string) => setDialog({ type: 'settle', goalId: id } as DialogState), onFocus: startFocus, onToggle: toggleTask, onNavigate: navigate, busy };
  const currentName = navigation.find(item => item.id === view)?.name || '模型与设置';
  const activeCount = state.goals.filter(g => g.status === 'active').length;
  const nextTask = allTasks(state.goals).find(t => !t.doneAt && t.date <= state.today && t.goal.status === 'active');
  const dialogGoal = dialog && 'goalId' in dialog ? state.goals.find(g => g.id === dialog.goalId) : undefined;
  const recentDone = allTasks(state.goals).filter(t => t.doneAt).sort((a, b) => b.doneAt!.localeCompare(a.doneAt!)).slice(0, 4);
  const closingGoals = state.goals.filter(g => g.status === 'active' && daysLeft(g.deadline, state.today) <= 2);

  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-backdrop" aria-label="关闭导航" onClick={() => setSidebarOpen(false)}/>}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}><Logo/><span className="nav-caption">我的小天地</span><nav aria-label="主导航">{navigation.map(item => <a className={`nav-item ${view === item.id ? 'active' : ''}`} href={`#${item.id}`} key={item.id}><item.icon size={19}/><span>{item.name}</span>{item.id === 'goals' && activeCount > 0 && <small>{activeCount.toString().padStart(2, '0')}</small>}{item.id === 'community' && <span className="nav-spark">✧</span>}</a>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><span className="note-doodle">✳</span><span className="note-tiny-spark">✧</span><strong>不用一下子很厉害，<br/>每天进步一点就好。</strong><p>你的每一小步，都算数。</p><span className="note-underline"/></div><button className={`nav-item nav-settings ${view === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}><Settings2 size={18}/><span>模型与设置</span></button><button className="nav-item nav-help" onClick={() => setDialog({ type: 'rules' })}><CircleHelp size={18}/><span>使用指南</span><ArrowUpRightIcon/></button><div className="sidebar-account"><Avatar user={state.user}/><div><strong>{state.user.source === 'demo' ? '先体验，再出发' : state.user.name}</strong><span>{state.user.source === 'demo' ? 'LINUX DO 佬友，欢迎你' : `LINUX DO · Lv.${state.user.trustLevel}`}</span></div><button className="account-more" aria-label="社区账号设置" onClick={() => navigate('settings')}><ChevronDown size={15}/></button></div></div></aside>
    <div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="打开导航" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><span className="topbar-home">我的小天地</span><ChevronDown size={12} className="breadcrumb-chevron"/><strong>{currentName}</strong></div><div className="topbar-right"><label className="global-search"><Search size={16}/><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="找找目标或待办" aria-label="搜索当前页面的目标或待办"/>{query ? <button aria-label="清空搜索" onClick={() => setQuery('')}><X size={13}/></button> : <kbd>Ctrl K</kbd>}</label><span className="topbar-divider"/><div className="notifications-wrap"><button className={`icon-button notification-button ${notifications ? 'selected' : ''}`} aria-label="查看我的动态" aria-expanded={notifications} onClick={() => setNotifications(value => !value)}><Bell size={19}/>{closingGoals.length > 0 && <i/>}</button>{notifications && <><button className="popover-dismiss" aria-label="关闭我的动态" onClick={() => setNotifications(false)}/><div className="notification-popover"><h3>你的小小动态<span>✧</span></h3>{closingGoals.map(g => <button key={g.id} onClick={() => { setNotifications(false); setDialog({ type: 'detail', goalId: g.id }); }}><span className="notice-icon peach"><Clock3 size={15}/></span><span><strong>{g.title}</strong><small>快到约定的日子了，看看进度吧。</small></span></button>)}{recentDone.slice(0, 3).map(t => <div className="notification-item" key={t.id}><span className="notice-icon sage"><Check size={15}/></span><span><strong>{t.title}</strong><small>{prettyDate(t.doneAt!)} · 又迈出了一小步</small></span></div>)}{!recentDone.length && !closingGoals.length && <p className="notification-empty">这里会记下你的完成动态和临近截止的约定。</p>}</div></>}</div>{state.user.source === 'demo' ? <button className="login-button" onClick={login}><span className="linuxdo-symbol">L<span>•</span></span>LINUX DO 登录<ArrowRight size={13}/></button> : <button className="topbar-user" onClick={() => navigate('settings')}><Avatar user={state.user} size="small"/><span>{state.user.name}</span></button>}</div></header>
      <main className="main-content"><div className="date-line"><span>{prettyDate(state.today, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}<span className="date-divider">/</span>今天也是新的开始</span>{state.user.source === 'demo' && <span className="demo-pill"><Coffee size={11}/>本地体验空间</span>}</div>{connectionLost && <div className="connection-note">暂时与服务断开，已显示的记录会保留。<button onClick={() => refresh().catch(() => setToast({ message: '仍未连上服务，请确认本地进程正在运行。', error: true }))}>重新连接</button></div>}
        {view === 'today' ? <Dashboard state={state} actions={actions} query={query} celebration={celebration}/> : view === 'goals' ? <GoalsView state={state} actions={actions} query={query}/> : view === 'community' ? <CommunityView state={state} actions={actions} query={query}/> : view === 'giveaways' ? <GiveawaysView state={state} query={query} busy={busy} onJoin={id => act(() => api(`/api/giveaways/${id}/join`, {}), '报名收好啦，静待有缘。')} onDelivery={(id, status) => act(() => api(`/api/giveaways/${id}/delivery`, { status }), status === 'sent' ? '已记录交付，等待对方确认。' : '心意送达，感谢这次真诚的分享。')} onRules={() => setDialog({ type: 'rules' })}/> : view === 'growth' ? <GrowthView state={state} query={query} onExport={exportData}/> : <SettingsView key={state.user.id} state={state} model={model} preferences={preferences} onSaveModel={next => { setModel(next); const { apiKey: _key, ...saved } = next; localStorage.setItem('inchup-model', JSON.stringify(saved)); setToast({ message: '模型设置已保存。密钥只保留在当前页面，去拆解一个目标吧。' }); }} onPreferences={next => { setPreferences(next); localStorage.setItem('inchup-mascot', JSON.stringify(next)); }} onLogin={login} onLogout={logout} onExport={exportData}/>}
        <footer className="page-footer"><Logo compact/><span>一天一点，慢慢成为喜欢的自己。</span><span className="footer-right">自觉 · 真诚 · 一起前进<Leaf size={12}/></span></footer>
      </main>
    </div>
    <Mascot preferences={preferences} celebration={celebration} nextTask={nextTask?.title} onFocus={() => startFocus()}/>
    {dialog?.type === 'create' && <CreateGoalDialog today={state.today} busy={busy} onClose={() => setDialog(null)} onSubmit={async input => { let id = ''; await act(async () => { const result = await api<{ id: string }>('/api/goals', input); id = result.id; }, '约定已经立下，从第一小步开始吧。', () => { setDialog({ type: 'detail', goalId: id }); navigate('goals'); }); }}/>}
    {dialog?.type === 'task' && <AddTaskDialog goals={state.goals} today={state.today} initialGoalId={dialog.goalId} busy={busy} onClose={() => setDialog(null)} onSubmit={async (id, task) => { await act(() => api(`/api/goals/${id}/tasks`, task), '这一小步已经放进计划里。', () => setDialog(null)); }}/>}
    {dialog?.type === 'plan' && <PlanDialog goals={state.goals} today={state.today} initialGoalId={dialog.goalId} settings={model} busy={busy} onClose={() => setDialog(null)} onSettings={() => { setDialog(null); navigate('settings'); }} onAdopt={async (id, tasks) => { await act(() => api(`/api/goals/${id}/plan`, { tasks }), '计划收好啦，先完成今天这一小步。', () => { setDialog(null); navigate('today'); }); }}/>}
    {dialog?.type === 'settle' && dialogGoal && <SettleDialog goal={dialogGoal} busy={busy} onClose={() => setDialog(null)} onSubmit={async (status, evidence) => { await act(() => api(`/api/goals/${dialogGoal.id}/settle`, { status, evidence }), status === 'completed' ? '你做到了！这个约定，已经认真兑现。' : '已经如实记录。带上经验，下一次咱们继续。', () => { setDialog(null); if (status === 'completed') celebrate(); navigate(status === 'failed' && dialogGoal.stakeTitle ? 'giveaways' : 'goals'); }); }}/>}
    {dialog?.type === 'detail' && dialogGoal && <GoalDetail goal={dialogGoal} today={state.today} busy={busy} onClose={() => setDialog(null)} onTask={() => openTask('task', dialogGoal.id)} onPlan={() => openTask('plan', dialogGoal.id)} onSettle={() => setDialog({ type: 'settle', goalId: dialogGoal.id })} onToggle={toggleTask} onCopy={async () => { try { await navigator.clipboard.writeText(`我在寸进立下一个约定：${dialogGoal.title}\n截止：${dialogGoal.deadline}\n验收：${dialogGoal.description}${dialogGoal.stakeTitle ? `\n未完成时，我自愿送出：${dialogGoal.stakeTitle}\n交付说明：${dialogGoal.stakeDetail}` : ''}\n每天往前一点，欢迎一起见证。`); setToast({ message: '约定文案已复制，由你选择如何分享。' }); } catch { setToast({ message: '浏览器未允许复制，请在契约详情中手动选择文字。', error: true }); } }}/>}
    {dialog?.type === 'rules' && <RulesDialog onClose={() => setDialog(null)}/>}
    {dialog?.type === 'login' && <Modal title="把社区身份，带进小天地" subtitle="LINUX DO 登录需要先配置应用凭证。" onClose={() => setDialog(null)}><div className="login-config"><span className="linuxdo-large">L<span>•</span></span><p>在 <a href="https://connect.linux.do" target="_blank" rel="noreferrer">LINUX DO Connect <ExternalLink size={12}/></a> 申请应用，将项目根目录的 <code>.env.example</code> 复制为 <code>.env</code>，填写以下配置后重启服务：</p><pre>LINUXDO_CLIENT_ID=你的应用 ID{ '\n'}LINUXDO_CLIENT_SECRET=你的应用密钥{ '\n'}LINUXDO_REDIRECT_URI=http://localhost:5173/auth/linuxdo/callback</pre><div className="gentle-note"><ShieldCheck size={18}/><p>回调地址须与 Connect 应用配置一致。应用密钥留在服务端，登录后使用真实社区身份，体验数据继续独立保留。</p></div><button className="button button-primary full-width" onClick={() => setDialog(null)}>明白，先体验一下<ArrowRight size={16}/></button></div></Modal>}
    {focus !== undefined && <FocusSession task={focus} busy={busy} onClose={() => setFocus(undefined)} onDone={async () => { if (focus) await act(() => api(`/api/tasks/${focus.id}`, { done: true }), '专注完成，又前进了一小步！', () => { setFocus(undefined); celebrate(); }); else { setFocus(undefined); celebrate(); setToast({ message: '这段留给自己的时间，也很有意义。' }); } }}/>}
    {toast && <ToastNotice toast={toast} onClose={() => setToast(null)}/>}
  </div>;
}

function GoalDetail({ goal, today, busy, onClose, onTask, onPlan, onSettle, onToggle, onCopy }: { goal: Goal; today: string; busy: boolean; onClose: () => void; onTask: () => void; onPlan: () => void; onSettle: () => void; onToggle: (task: Task) => void; onCopy: () => void }) {
  return <Modal title={goal.title} subtitle={`${prettyDate(goal.deadline)} 截止 · ${goal.isPublic ? '公开见证' : '仅自己可见'} · ${statusNames[goal.status]}`} onClose={onClose} wide><div className="goal-detail"><div className="acceptance-note"><Target size={19}/><div><strong>和自己约好的验收标准</strong><p>{goal.description}</p></div></div><div className="progress-caption"><span>已经走过 {goal.tasks.filter(t => t.doneAt).length} / {goal.tasks.length} 步</span><strong>{progress(goal)}%</strong></div><ProgressBar value={progress(goal)}/>{goal.stakeTitle && <div className="detail-stake"><Gift size={23}/><div><small>{stakeNames[goal.stakeType]} · 自愿承诺</small><strong>{goal.stakeTitle}</strong><p>{goal.stakeDetail}</p></div></div>}<div className="detail-task-heading"><h3>一步一步，走到这里</h3>{goal.status === 'active' && <button className="text-button" onClick={onTask}><Plus size={14}/>添加待办</button>}</div>{goal.tasks.length ? <div className="detail-task-list">{goal.tasks.map(task => <div key={task.id} className={task.doneAt ? 'done' : ''}><button className={`task-checkbox ${task.doneAt ? 'checked' : ''}`} disabled={busy || goal.status !== 'active'} aria-label={`${task.doneAt ? '取消完成' : '完成'}：${task.title}`} onClick={() => onToggle(task)}>{task.doneAt && <Check size={13}/>}</button><span><strong>{task.title}</strong><small>{task.date === today ? '今天' : prettyDate(task.date)} · {task.minutes} 分钟</small></span>{task.doneAt && <span className="detail-done"><CheckCheck size={14}/></span>}</div>)}</div> : <Empty title="第一小步，还等着你来写" description="自己安排，或者让寸寸帮你拆成七天的小任务。"/>}{goal.evidence && <div className="goal-evidence"><span>✧</span><div><strong>留给未来自己的成果</strong><p>{goal.evidence}</p></div></div>}<div className="modal-footer"><button className="text-button" onClick={onCopy}><Globe2 size={15}/>复制约定文案</button>{goal.status === 'active' ? <div className="button-group"><button className="button button-soft" onClick={onPlan}><Sparkles size={15}/>AI 拆解</button><button className="button button-primary" onClick={onSettle}>申报结果<ArrowRight size={15}/></button></div> : <button className="button button-soft" onClick={onClose}>收好这段旅程<Heart size={15}/></button>}</div></div></Modal>;
}

function ToastNotice({ toast, onClose }: { toast: NonNullable<Toast>; onClose: () => void }) {
  const [container, setContainer] = useState<Element | null>(null);
  useLayoutEffect(() => { setContainer(document.querySelector('dialog[open]')); }, [toast.message]);
  const content = <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}><span className="toast-icon">{toast.error ? <Coffee size={18}/> : <Check size={18}/>}</span><p>{toast.message}</p><button aria-label="关闭提示" onClick={onClose}><X size={16}/></button></div>;
  return container?.isConnected ? createPortal(content, container) : content;
}

function ArrowUpRightIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>; }
