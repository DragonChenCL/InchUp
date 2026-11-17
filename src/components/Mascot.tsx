import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Coffee, ListTodo, Minimize2, Moon, Play, X } from 'lucide-react';
import './mascot.css';

type Mood = 'idle' | 'walk' | 'celebrate';
type TurnDirection = 'left' | 'right' | null;

export function Sprite({ mood = 'idle', size = 140, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const [frame, setFrame] = useState(4);
  const [previousFrame, setPreviousFrame] = useState(4);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(120);
  const frameRef = useRef(4);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const goToFrame = (next: number, duration = 120) => {
    if (frameRef.current === next) return;
    setPreviousFrame(frameRef.current);
    frameRef.current = next;
    setFrame(next);
    clearTimeout(transitionTimer.current);
    if (duration <= 0) {
      setTransitionDuration(0);
      setTransitioning(false);
      return;
    }
    setTransitionDuration(duration);
    setTransitioning(true);
    transitionTimer.current = setTimeout(() => setTransitioning(false), duration);
  };

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    goToFrame(mood === 'walk' ? 0 : mood === 'celebrate' ? 6 : 4, reduced ? 0 : 110);
    if (reduced) return () => clearTimeout(transitionTimer.current);
    if (mood === 'idle') {
      let blink: ReturnType<typeof setTimeout>;
      const interval = setInterval(() => {
        goToFrame(5, 75);
        blink = setTimeout(() => goToFrame(4, 75), 180);
      }, 4300);
      return () => { clearInterval(interval); clearTimeout(blink); clearTimeout(transitionTimer.current); };
    }
    const interval = setInterval(() => {
      const next = mood === 'walk' ? (frameRef.current + 1) % 4 : frameRef.current === 6 ? 7 : 6;
      goToFrame(next, mood === 'walk' ? 70 : 120);
    }, mood === 'walk' ? 190 : 500);
    return () => { clearInterval(interval); clearTimeout(transitionTimer.current); };
  }, [mood]);

  useEffect(() => () => clearTimeout(transitionTimer.current), []);
  const framePosition = (value: number) => `${value % 4 / 3 * 100}% ${value < 4 ? 0 : 100}%`;
  return <div className={`mascot-sprite sprite-${mood} ${transitioning ? 'is-transitioning' : ''} ${className}`} style={{ width: size, height: size * 4 / 3, '--sprite-fade-duration': `${transitionDuration}ms` } as CSSProperties} role="img" aria-label={`鼠妹寸寸${mood === 'walk' ? '正在走路' : mood === 'celebrate' ? '正在庆祝' : '正在陪伴你'}`}>
    <span className="mascot-sprite-frame mascot-sprite-previous" style={{ backgroundPosition: framePosition(previousFrame) }} aria-hidden="true" />
    <span className="mascot-sprite-frame mascot-sprite-current" style={{ backgroundPosition: framePosition(frame) }} aria-hidden="true" />
  </div>;
}

export interface MascotPreferences { enabled: boolean; roaming: boolean; quiet: boolean }

const MASCOT_WIDTH = 144;
const MASCOT_HEIGHT = 180;

function isVisibleElement(element: Element) {
  const html = element as HTMLElement;
  const rect = html.getBoundingClientRect();
  const style = window.getComputedStyle(html);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}

function overlapArea(a: { left: number; top: number; right: number; bottom: number }, b: DOMRect) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function desktopCandidates() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const sidebar = Number.parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar')) || 222;
  const clampX = (value: number) => Math.max(12, Math.min(viewportWidth - MASCOT_WIDTH - 12, value));
  const clampY = (value: number) => Math.max(76, Math.min(viewportHeight - MASCOT_HEIGHT - 16, value));
  // 只在屏幕边缘选点，避免鼠妹穿过表单、任务列表和顶部工具栏。
  return [
    { x: clampX(viewportWidth - MASCOT_WIDTH - 18), y: clampY(viewportHeight - MASCOT_HEIGHT - 22) },
    { x: clampX(viewportWidth - MASCOT_WIDTH - 18), y: clampY(92) },
    { x: clampX(sidebar + 14), y: clampY(viewportHeight - MASCOT_HEIGHT - 22) },
    { x: clampX(sidebar + 14), y: clampY(92) },
  ];
}

function chooseDesktopPosition(current?: { x: number; y: number }): { x: number; y: number } {
  const obstacles = Array.from(document.querySelectorAll('button, input, textarea, select, [role="dialog"]'))
    .filter(element => !element.closest('.floating-mascot') && isVisibleElement(element));
  const candidates = desktopCandidates().map(candidate => {
    const rect = { left: candidate.x, top: candidate.y, right: candidate.x + MASCOT_WIDTH, bottom: candidate.y + MASCOT_HEIGHT };
    const score = obstacles.reduce((total, element) => total + overlapArea(rect, element.getBoundingClientRect()), 0);
    const distance = current ? Math.hypot(candidate.x - current.x, candidate.y - current.y) : 0;
    return { ...candidate, score, distance };
  });
  const safe = candidates.filter(candidate => candidate.score === 0);
  const pool = safe.length ? safe : candidates;
  const farEnough = pool.filter(candidate => candidate.distance > 80 && (!current || Math.abs(candidate.x - current.x) < 1));
  const chosen = (farEnough.length ? farEnough : pool.filter(candidate => !current || candidate.distance < 1)).sort((a, b) => a.score - b.score || b.distance - a.distance)[0] || (current ? { ...current, score: 0, distance: 0 } : candidates[0]);
  return { x: chosen.x, y: chosen.y };
}

function StepMark() {
  return <span className="mascot-step-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M4 20.5h7v-6h6v-6h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.5 5.5h3.5V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="7" r="2" fill="currentColor" opacity=".55"/></svg></span>;
}

export function Mascot({ preferences, celebration, nextTask, onFocus }: { preferences: MascotPreferences; celebration: number; nextTask?: string; onFocus: () => void }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  const [position, setPosition] = useState(() => chooseDesktopPosition());
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [turning, setTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<TurnDirection>(null);
  const [travelDuration, setTravelDuration] = useState(4.5);
  const [celebrating, setCelebrating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [interactionBlocked, setInteractionBlocked] = useState(false);
  const [speech, setSpeech] = useState('我会陪着你，一点一点往前走。');
  const node = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const facingRef = useRef(false);
  facingRef.current = facingLeft;
  const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);

  const clearMotionTimers = () => {
    clearTimeout(moveTimer.current);
    clearTimeout(turnTimer.current);
    moveTimer.current = undefined;
    turnTimer.current = undefined;
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const handle = () => {
      const nextMobile = media.matches;
      setIsMobile(nextMobile);
      if (nextMobile) {
        clearMotionTimers();
        setWalking(false);
        setTurning(false);
        setTurnDirection(null);
        setOpen(false);
        setMobileExpanded(false);
      } else {
        setPosition(chooseDesktopPosition());
      }
    };
    window.addEventListener('resize', handle);
    media.addEventListener?.('change', handle);
    return () => { window.removeEventListener('resize', handle); media.removeEventListener?.('change', handle); };
  }, []);

  useEffect(() => {
    const checkBlocked = () => {
      const active = document.activeElement;
      const focusedField = active instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      const blocked = Boolean(document.querySelector('dialog[open], .focus-overlay')) || focusedField;
      setInteractionBlocked(previous => previous === blocked ? previous : blocked);
    };
    checkBlocked();
    const observer = new MutationObserver(checkBlocked);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class'] });
    document.addEventListener('focusin', checkBlocked);
    document.addEventListener('focusout', checkBlocked);
    return () => { observer.disconnect(); document.removeEventListener('focusin', checkBlocked); document.removeEventListener('focusout', checkBlocked); };
  }, []);

  useEffect(() => {
    if (!interactionBlocked) return;
    clearMotionTimers();
    setWalking(false);
    setTurning(false);
    setTurnDirection(null);
    setOpen(false);
    setMobileExpanded(false);
  }, [interactionBlocked]);

  useEffect(() => {
    if (!celebration) return;
    clearMotionTimers();
    if (!isMobile) setPosition(chooseDesktopPosition(positionRef.current));
    setWalking(false);
    setTurning(false);
    setTurnDirection(null);
    setCelebrating(true);
    setSpeech('又往前走了一步！今天的你，有点厉害哦。');
    // 手机端只在用户点开入口后展示完整角色，庆祝通过入口状态保留。
    if (!isMobile && !preferences.quiet) setOpen(true);
    const timeout = setTimeout(() => { setCelebrating(false); setOpen(false); }, 5000);
    return () => clearTimeout(timeout);
  }, [celebration, preferences.quiet, isMobile]);

  useEffect(() => {
    if (isMobile || interactionBlocked || !preferences.enabled || !preferences.roaming || dragging || hovered || open || collapsed || celebrating || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWalking(false);
      return;
    }
    const travel = (nextX: number, nextY: number, duration: number, nextFacingLeft: boolean) => {
      setFacingLeft(nextFacingLeft);
      setTravelDuration(duration);
      setWalking(true);
      setPosition({ x: nextX, y: nextY });
      clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => setWalking(false), duration * 1000);
    };
    const timer = setInterval(() => {
      const next = chooseDesktopPosition(positionRef.current);
      const nextX = next.x;
      const nextY = next.y;
      const distance = Math.hypot(nextX - positionRef.current.x, nextY - positionRef.current.y);
      const duration = Math.max(2.8, Math.min(7.5, distance / 82));
      const nextFacingLeft = nextX < positionRef.current.x;
      clearTimeout(moveTimer.current);
      setWalking(false);
      if (nextFacingLeft !== facingRef.current) {
        setTurnDirection(nextFacingLeft ? 'left' : 'right');
        setTurning(true);
        clearTimeout(turnTimer.current);
        turnTimer.current = setTimeout(() => {
          setTurning(false);
          setTurnDirection(null);
          travel(nextX, nextY, duration, nextFacingLeft);
        }, 320);
      } else {
        setTurning(false);
        setTurnDirection(null);
        travel(nextX, nextY, duration, nextFacingLeft);
      }
    }, 18000);
    return () => { clearInterval(timer); clearMotionTimers(); };
  }, [preferences.enabled, preferences.roaming, dragging, hovered, open, collapsed, celebrating, isMobile, interactionBlocked]);

  if (!preferences.enabled || interactionBlocked) return null;
  if (isMobile && !mobileExpanded) return <button className={`mascot-mobile-dock ${celebrating ? 'is-celebrating' : ''}`} aria-expanded={false} onClick={() => { setMobileExpanded(true); setOpen(true); }} title="打开寸寸陪伴" aria-label="打开寸寸对话"><StepMark /><span className="mascot-dock-label">寸寸</span>{celebrating && <i aria-hidden="true" />}</button>;
  if (collapsed && !isMobile) return <button className="mascot-restore" onClick={() => setCollapsed(false)} title="叫寸寸回来" aria-label="展开鼠妹寸寸"><StepMark /></button>;

  function layoutPositionFromVisualRect() {
    const element = node.current!;
    const rect = element.getBoundingClientRect();
    return { x: rect.left - (element.offsetWidth - rect.width) / 2, y: rect.top - (element.offsetHeight - rect.height) };
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const layoutPosition = layoutPositionFromVisualRect();
    clearMotionTimers();
    setWalking(false);
    setTurning(false);
    setTurnDirection(null);
    setPosition(layoutPosition);
    drag.current = { x: event.clientX, y: event.clientY, left: layoutPosition.x, top: layoutPosition.y, moved: false };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) drag.current.moved = true;
    if (drag.current.moved) setPosition({ x: Math.max(0, Math.min(window.innerWidth - 144, drag.current.left + dx)), y: Math.max(80, Math.min(window.innerHeight - 176, drag.current.top + dy)) });
  }

  function pointerUp() {
    const moved = drag.current?.moved;
    drag.current = null;
    setDragging(false);
    if (!moved) setOpen(value => !value);
  }

  function closeConversation() {
    setOpen(false);
    if (isMobile) setMobileExpanded(false);
  }

  const bubbleStyle = isMobile
    ? { left: 'auto', right: 0, top: 'auto', bottom: 116 }
    : { left: position.x < 140 ? 0 : 'auto', right: position.x < 140 ? 'auto' : 0, top: position.y < 260 ? 180 : 'auto', bottom: position.y < 260 ? 'auto' : 185 };
  const wrapperStyle = (isMobile
    ? { right: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', left: 'auto', top: 'auto', '--move-duration': '0s' }
    : { left: position.x, top: position.y, '--move-duration': dragging || !walking ? '0s' : `${travelDuration}s` }) as unknown as CSSProperties;

  return <>{isMobile && <button className="mascot-mobile-dock is-expanded" aria-label="收起寸寸对话" aria-expanded={true} onClick={closeConversation}><StepMark/><span className="mascot-dock-label">寸寸</span></button>}<div ref={node} className={`floating-mascot ${isMobile ? 'mascot-mobile-expanded' : ''} ${walking ? 'is-walking' : ''} ${facingLeft ? 'facing-left' : ''} ${turning ? 'is-turning' : ''} ${turnDirection ? `turn-to-${turnDirection}` : ''} ${dragging ? 'is-dragging' : ''}`} style={wrapperStyle} onMouseEnter={() => { if (isMobile) return; if (walking) setPosition(layoutPositionFromVisualRect()); clearMotionTimers(); setWalking(false); setTurning(false); setTurnDirection(null); setHovered(true); }} onMouseLeave={() => setHovered(false)}>
    {open && <div className="mascot-bubble" style={bubbleStyle}><button className="bubble-close" onClick={closeConversation} aria-label="关闭寸寸对话"><X size={13} /></button><span className="bubble-name">寸寸 <span>· 你的自律搭子</span></span><p>{speech}</p><div className="bubble-actions"><button onClick={() => setSpeech(nextTask ? `今天先做「${nextTask}」。不用一口气全做完，先开始就赢了一半。` : '今天的待办已经收好啦！可以加一个小任务，也可以好好休息。')}><ListTodo size={13} />今天做什么</button><button onClick={() => { closeConversation(); onFocus(); }}><Play size={13} />陪我专注</button></div><button className="bubble-rest" onClick={() => { closeConversation(); setCollapsed(true); }}><Minimize2 size={12} />先在角落休息一下</button></div>}
    <button className="mascot-touch" aria-label={isMobile ? '切换寸寸对话' : '与寸寸互动，按住可以拖动'} onPointerDown={isMobile ? undefined : pointerDown} onPointerMove={isMobile ? undefined : pointerMove} onPointerUp={isMobile ? undefined : pointerUp} onPointerCancel={isMobile ? undefined : () => { clearMotionTimers(); drag.current = null; setDragging(false); setWalking(false); setTurning(false); setTurnDirection(null); }} onClick={isMobile ? () => setOpen(value => !value) : undefined} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(value => !value); } }}><Sprite size={isMobile ? 96 : 138} mood={celebrating ? 'celebrate' : walking ? 'walk' : 'idle'} /><span className="pet-ground" /></button>
    <span className="mascot-tag">{preferences.quiet ? <Moon size={10} /> : <Coffee size={10} />}寸寸陪伴中</span>
  </div></>;
}
