import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, CheckCheck, Clock3, Gift, Globe2, Heart, ListPlus, LoaderCircle, LockKeyhole, Pause, Play, Plus, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import type { CreateGoalInput, Goal, ModelSettings, PlannedTask } from '../../shared/types';
import { addDays, api, prettyDate, stakeNames, type TaskWithGoal } from '../lib';
import { Modal, SubmitButton } from './ui';
import { Sprite } from './Mascot';
import './contract-form.css';

export function CreateGoalDialog({ today, busy, onClose, onSubmit }: { today: string; busy: boolean; onClose: () => void; onSubmit: (input: CreateGoalInput & { acceptRules: boolean }) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(addDays(today, 14));
  const [isPublic, setPublic] = useState(true);
  const [hasStake, setHasStake] = useState(false);
  const [stakeTitle, setStakeTitle] = useState('');
  const [stakeType, setStakeType] = useState<CreateGoalInput['stakeType']>('vps');
  const [stakeDetail, setStakeDetail] = useState('');
  const [accepted, setAccepted] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); await onSubmit({ title, description, deadline, isPublic, stakeTitle: hasStake ? stakeTitle : '', stakeType, stakeDetail: hasStake ? stakeDetail : '', acceptRules: accepted }); }
  return <Modal title="立下一个小小的约定" subtitle="不用一下子变得很厉害，先给想做的事一个开始。" onClose={onClose} wide><form onSubmit={submit} className="form-stack contract-form">
    <div className="contract-steps" aria-label="创建契约的两个部分">
      <div className="contract-step"><span>01</span><div><strong>写下目标</strong><small>把想做的事说清楚</small></div></div>
      <span className="contract-step-line" aria-hidden="true" />
      <div className="contract-step"><span>02</span><div><strong>约定规则</strong><small>给未来的自己一个边界</small></div></div>
    </div>

    <section className="contract-section" aria-labelledby="contract-goal-heading">
      <div className="contract-section-heading"><span className="contract-section-icon lilac"><Target size={17} /></span><div><h3 id="contract-goal-heading">写下这次想完成的事</h3><p>越具体，下一步越容易开始。</p></div></div>
      <label className="field">我想完成什么<input value={title} onChange={event => setTitle(event.target.value)} placeholder="比如：两周内，让个人博客真正上线" minLength={2} maxLength={100} required autoFocus /></label>
      <label className="field">做到什么，才算完成？<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="写下具体的验收标准，比如：完成首页、文章列表，并发布至少一篇文章。" minLength={2} maxLength={2000} rows={3} required /><small>这是创建后的验收标准，之后会固定下来。</small></label>
      <div className="form-columns"><label className="field">约定截止日期<input type="date" value={deadline} min={today} max={addDays(today, 366)} onChange={event => setDeadline(event.target.value)} required /><small>截止于北京时间当天 23:59，之后保留补报窗口。</small></label><div className="field">谁可以看见<label className="choice-box"><input type="checkbox" checked={isPublic} onChange={event => setPublic(event.target.checked)} /><Globe2 size={17} /><span>公开给佬友见证<small>关闭后，目标和任务只对自己可见。</small></span></label></div></div>
      <p className="contract-fixed-note"><LockKeyhole size={14} />验收标准和截止日期创建后固定，请在提交前确认清楚。</p>
    </section>

    <section className="contract-section contract-rules-section" aria-labelledby="contract-rules-heading">
      <div className="contract-section-heading"><span className="contract-section-icon peach"><ShieldCheck size={17} /></span><div><h3 id="contract-rules-heading">约定规则</h3><p>规则提前说清楚，执行时就少一点犹豫。</p></div></div>
      <div className="contract-rule-grid">
        <div className="contract-rule"><span>24h</span><p><strong>补报窗口</strong>截止后保留 24 小时，只能补报截止前已完成的情况。</p></div>
        <div className="contract-rule"><span>诚</span><p><strong>如实申报</strong>窗口结束仍未申报，会按未完成结算。</p></div>
        <div className="contract-rule"><span><Gift size={15} /></span><p><strong>赠品活动</strong>设置赠品后，未完成会开启 48 小时免费抽奖。</p></div>
        <div className="contract-rule"><span><Globe2 size={15} /></span><p><strong>公开边界</strong>私人目标保持私密；赠品说明会在抽奖中公开。</p></div>
      </div>
      <div className={`stake-form ${hasStake ? 'is-active' : ''}`}><label className="stake-switch"><span className="soft-icon peach"><Gift size={20} /></span><span><strong>给这个约定，加一点分量</strong><small>选填。未完成时，自愿赠送一份心意。</small></span><input className="switch-input" type="checkbox" checked={hasStake} onChange={event => setHasStake(event.target.checked)} aria-label="设置自愿赠品" /></label>{hasStake && <div className="stake-fields"><div className="form-columns"><label className="field">我愿意送出<input value={stakeTitle} onChange={event => setStakeTitle(event.target.value)} placeholder="一台闲置 VPS 的 30 天使用权" minLength={2} maxLength={100} required /></label><label className="field">赠品类型<select value={stakeType} onChange={event => setStakeType(event.target.value as CreateGoalInput['stakeType'])}>{Object.entries(stakeNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label></div><label className="field">资源详情与交付方式<textarea value={stakeDetail} onChange={event => setStakeDetail(event.target.value)} placeholder="说明数量、有效期、转让条件、交付方式；实物请写清运费由谁承担。" minLength={2} maxLength={2000} rows={2} required /></label><p className="field-note"><Heart size={13} />请只填写本人有权赠送、能够转让的资源。平台记录承诺，交付由双方自愿完成。</p></div>}</div>
    </section>

    <label className="consent contract-consent"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} required /><span>我已读懂以上规则，并会按固定的验收标准如实申报。未申报按未完成结算；设置赠品时会开启 48 小时免费报名，私人目标保持私密，赠品说明会在抽奖中公开。</span></label>
    <div className="modal-footer contract-footer"><span><ShieldCheck size={14} />如实记录，自愿履约</span><SubmitButton busy={busy}>创建契约</SubmitButton></div>
  </form></Modal>;
}

export function AddTaskDialog({ goals, today, initialGoalId, busy, onClose, onSubmit }: { goals: Goal[]; today: string; initialGoalId?: string; busy: boolean; onClose: () => void; onSubmit: (goalId: string, task: PlannedTask) => Promise<void> }) {
  const active = goals.filter(g => g.status === 'active' && g.deadline >= today);
  const [goalId, setGoalId] = useState(initialGoalId || active[0]?.id || '');
  const [title, setTitle] = useState('');
  const [taskDate, setTaskDate] = useState(today);
  const [duration, setDuration] = useState(25);
  const goal = active.find(g => g.id === goalId);
  return <Modal title="加上今天的一小步" subtitle="动作越具体，开始就越容易。" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); await onSubmit(goalId, { title, date: taskDate, minutes: duration }); }}><label className="field">属于哪个目标<select value={goalId} onChange={event => { setGoalId(event.target.value); setTaskDate(today); }} required>{active.map(g => <option value={g.id} key={g.id}>{g.title}</option>)}</select></label><label className="field">这一步，具体做什么<input value={title} onChange={event => setTitle(event.target.value)} placeholder="比如：画出首页上方的第一张草图" maxLength={150} required autoFocus /></label><div className="form-columns"><label className="field">安排在哪一天<input type="date" min={today} max={goal?.deadline} value={taskDate} onChange={event => setTaskDate(event.target.value)} required /></label><label className="field">预计需要几分钟<input type="number" min={1} max={480} value={duration} onChange={event => setDuration(Number(event.target.value))} required /></label></div><div className="modal-footer"><span><ListPlus size={14} />先做一件小事就很好</span><SubmitButton busy={busy} disabled={!goal}>加入待办</SubmitButton></div></form></Modal>;
}

export function PlanDialog({ goals, today, initialGoalId, settings, busy, onClose, onSettings, onAdopt }: { goals: Goal[]; today: string; initialGoalId?: string; settings: ModelSettings; busy: boolean; onClose: () => void; onSettings: () => void; onAdopt: (goalId: string, tasks: PlannedTask[]) => Promise<void> }) {
  const active = goals.filter(g => g.status === 'active' && g.deadline >= today);
  const [goalId, setGoalId] = useState(initialGoalId || active[0]?.id || '');
  const [dailyMinutes, setDailyMinutes] = useState(settings.dailyMinutes);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<{ summary: string; tasks: PlannedTask[]; model: string; durationMs: number } | null>(null);
  async function generate(event: FormEvent) {
    event.preventDefault(); setGenerating(true); setError(''); setPlan(null);
    try { setPlan(await api('/api/ai/plan', { ...settings, dailyMinutes, goalId })); }
    catch (e) { setError(e instanceof Error ? e.message : '生成暂时没有成功。'); }
    finally { setGenerating(false); }
  }
  return <Modal title="让寸寸帮你拆一拆" subtitle="使用你自己的模型，安排未来七天做得到的小任务。" onClose={onClose} wide>{!settings.apiKey ? <div className="model-needed"><Sparkles size={28} /><h3>先连接你的模型搭子</h3><p>填好接口地址、模型和 API Key 后，就能生成计划。密钥只保留在当前页面内存中。</p><button className="button button-primary" onClick={onSettings}>前往模型设置<ArrowRight size={16} /></button></div> : <><form className="form-stack" onSubmit={generate}><div className="form-columns"><label className="field">这次拆解哪个目标<select value={goalId} disabled={generating || busy} onChange={event => { setGoalId(event.target.value); setPlan(null); }} required>{active.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label><label className="field">每天可以投入几分钟<input type="number" value={dailyMinutes} disabled={generating || busy} min={5} max={480} onChange={event => { setDailyMinutes(Number(event.target.value)); setPlan(null); }} required /></label></div><div className="model-connected"><span className="status-dot" />{settings.model}<span>· 每天最多三件事，先安排最近七天</span></div>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button button-soft" type="submit" disabled={generating || busy || !goalId}>{generating ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}{generating ? '寸寸正在认真安排…' : plan ? '再帮我想一版' : '拆成可执行的小任务'}</button></form>{plan && <div className="plan-preview"><div className="plan-summary"><Sparkles size={18} /><div><p>{plan.summary}</p><small>{plan.model} · 耗时 {(plan.durationMs / 1000).toFixed(2)} 秒 · 思考强度 {settings.reasoningEffort === 'auto' ? '模型默认' : settings.reasoningEffort}</small></div></div>{Array.from(new Set(plan.tasks.map(t => t.date))).sort().map(date => <div className="plan-day" key={date}><strong>{prettyDate(date)}<span>{plan.tasks.filter(t => t.date === date).reduce((sum, t) => sum + t.minutes, 0)} 分钟</span></strong>{plan.tasks.filter(t => t.date === date).map((task, index) => <p key={index}><span className="tiny-check"><Check size={10} /></span>{task.title}<small>{task.minutes} 分钟</small></p>)}</div>)}<p className="field-note">采纳后会替换该目标从今天起尚未完成的任务，已完成的记录保留。目标截止时间和验收标准保持原约定。</p><div className="modal-footer"><button className="button button-ghost" onClick={() => setPlan(null)}>我再想想</button><button className="button button-primary" disabled={busy} onClick={() => onAdopt(goalId, plan.tasks)}>{busy ? <LoaderCircle size={16} className="spin" /> : <CheckCheck size={16} />}就按这个节奏来</button></div></div>}</>}</Modal>;
}

export function SettleDialog({ goal, busy, onClose, onSubmit }: { goal: Goal; busy: boolean; onClose: () => void; onSubmit: (status: 'completed' | 'failed', evidence: string) => Promise<void> }) {
  const [status, setStatus] = useState<'completed' | 'failed'>('completed');
  const [evidence, setEvidence] = useState('');
  const [confirm, setConfirm] = useState(false);
  return <Modal title="给这次努力，一个真实的记录" subtitle={goal.title} onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); await onSubmit(status, evidence); }}><div className="settle-options"><button type="button" className={status === 'completed' ? 'selected' : ''} onClick={() => setStatus('completed')}><CheckCheck size={25} /><strong>我做到了</strong><span>兑现了和自己的约定</span></button><button type="button" className={status === 'failed' ? 'selected peach-choice' : ''} onClick={() => setStatus('failed')}><Heart size={25} /><strong>这轮没完成</strong><span>如实面对，下次继续</span></button></div><div className="acceptance-note"><Target size={17} /><div><strong>当初的验收标准</strong><p>{goal.description}</p></div></div>{status === 'completed' ? <label className="field">留下一点成果，送给未来的自己<textarea rows={3} value={evidence} maxLength={2000} onChange={event => setEvidence(event.target.value)} placeholder="可以是一段总结、一个作品链接，或者一句：我坚持下来了。（选填）" /></label> : <div className="gentle-note"><Gift size={20} /><p>{goal.stakeTitle ? `「${goal.stakeTitle}」将进入 48 小时免费抽奖，平台记录结果，由你自愿交付给中奖者。` : '这次没有设置赠品。留下真实记录，带着经验重新出发就好。'}</p></div>}<label className="consent"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} required /><span>我按创建时约定的验收标准如实申报，理解本次结算将保留记录。</span></label><div className="modal-footer"><span><LockKeyhole size={14} />信任，从如实记录开始</span><SubmitButton busy={busy}>确认这次记录</SubmitButton></div></form></Modal>;
}

export function RulesDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="寸进的小小约定" subtitle="认真对待目标，也温柔对待自己。" onClose={onClose}><div className="rules-list">{[
    ['01', '靠自觉，也有清楚的规则', '由本人判断并申报是否完成，证据自愿提供。AI 帮忙拆解任务，完成情况由你自己决定。'],
    ['02', '让承诺具体，让过程有余地', '创建时固定截止日期和验收标准。漏做一天可以调整后续任务，最终按约定的目标验收。时间统一使用北京时间。'],
    ['03', '到期之后，留一天补报', '截止后有 24 小时补报窗口，用于补报截止前已完成的情况。窗口结束仍未申报，则按未完成结算。服务恢复运行时会补处理到期记录。'],
    ['04', '礼物出于自愿，抽取保持公平', '未完成且设置赠品时，开启 48 小时免费报名。每个账号一份资格，赠送者不能参与自己的活动；截止后以服务端随机数抽取并固定结果。无人参与则直接结束。'],
    ['05', '资源交付，由双方确认', '平台不托管钱款、服务器账号或实物。请提供本人有权赠送的资源，并写清交付条件。赠送者标记已交付，中奖者确认已收到。'],
    ['06', '成功值得庆祝，失败也能重新开始', '这里没有羞辱和围攻。你可以让目标保持私密；设置赠品的活动会公开资源详情。体验空间内的账号和资源均用于演示。'],
  ].map(([number, title, description]) => <div key={number}><span>{number}</span><section><h3>{title}</h3><p>{description}</p></section></div>)}</div><button className="button button-primary full-width" onClick={onClose}>好，咱们慢慢来<Heart size={16} /></button></Modal>;
}

export function FocusSession({ task, busy, onClose, onDone }: { task: TaskWithGoal | null; busy: boolean; onClose: () => void; onDone: () => Promise<void> }) {
  const total = (task?.minutes || 25) * 60;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const deadline = useRef(Date.now() + total * 1000);
  useEffect(() => {
    if (paused) return;
    deadline.current = Date.now() + remaining * 1000;
    const timer = setInterval(() => { const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)); setRemaining(seconds); if (!seconds) clearInterval(timer); }, 250);
    return () => clearInterval(timer);
    // 用绝对结束时间计算剩余时长，后台页面恢复后也不会累积计时误差。
  }, [paused]);
  const display = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
  return <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="和寸寸一起专注"><button className="focus-close icon-button" aria-label="结束本次专注" onClick={onClose}><X size={24} /></button><span className="focus-eyebrow"><span className="status-dot" />这一小段时间，只做一件事</span><h1>{task?.title || '留一点时间，给正在努力的自己'}</h1><p>{task?.goal.title || '寸寸会在这里安静地陪着你。'}</p><div className="focus-clock"><svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="140" className="clock-track" /><circle cx="150" cy="150" r="140" className="clock-progress" style={{ strokeDasharray: 880, strokeDashoffset: 880 * (1 - remaining / total) }} /></svg><div><span>{display}</span><small>{!remaining ? '这段专注结束啦' : paused ? '休息一下，随时回来' : '专注中的你，闪闪发光'}</small></div></div><div className="focus-controls">{remaining > 0 && <button className="button button-white" onClick={() => setPaused(value => !value)}>{paused ? <Play size={17} /> : <Pause size={17} />}{paused ? '继续专注' : '暂停一下'}</button>}<button className="button button-primary" disabled={busy} onClick={onDone}>{busy ? <LoaderCircle size={17} className="spin" /> : <Check size={17} />}{task ? '任务完成，记下一步' : '收好这段专注'}</button></div><div className="focus-mascot"><Sprite mood={!remaining ? 'celebrate' : 'idle'} size={120} /><span>“慢慢来，我陪你。”</span></div></div>;
}
