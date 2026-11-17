import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Coffee, ListTodo, Minimize2, Moon, Play, X } from 'lucide-react';

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

export function Mascot({ preferences, celebration, nextTask, onFocus }: { preferences: MascotPreferences; celebration: number; nextTask?: string; onFocus: () => void }) {
  const [position, setPosition] = useState({ x: Math.max(16, window.innerWidth - 190), y: Math.max(90, window.innerHeight - 190) });
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
    const handle = () => setPosition(p => ({ x: Math.max(8, Math.min(p.x, window.innerWidth - 150)), y: Math.max(90, Math.min(p.y, window.innerHeight - 180)) }));
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    if (!celebration) return;
    clearMotionTimers();
    if (node.current) setPosition(layoutPositionFromVisualRect());
    setWalking(false);
    setTurning(false);
    setTurnDirection(null);
    setCelebrating(true);
    setSpeech('又往前走了一步！今天的你，有点厉害哦。');
    if (!preferences.quiet) setOpen(true);
    const timeout = setTimeout(() => { setCelebrating(false); setOpen(false); }, 5000);
    return () => clearTimeout(timeout);
  }, [celebration, preferences.quiet]);

  useEffect(() => {
    if (!preferences.enabled || !preferences.roaming || dragging || hovered || open || collapsed || celebrating || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (node.current) setPosition(layoutPositionFromVisualRect());
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
      // 散步避开桌面侧栏，保留导航和设置按钮的点击区域。
      const leftBoundary = window.innerWidth > 720 ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar')) + 20 : 20;
      const nextX = leftBoundary + Math.random() * Math.max(0, window.innerWidth - leftBoundary - 170);
      const distance = Math.abs(nextX - positionRef.current.x);
      const duration = Math.max(2.8, Math.min(7.5, distance / 82));
      const nextFacingLeft = nextX < positionRef.current.x;
      const nextY = Math.max(100, window.innerHeight - 190 - Math.random() * 30);
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
  }, [preferences.enabled, preferences.roaming, dragging, hovered, open, collapsed, celebrating]);

  if (!preferences.enabled) return null;
  if (collapsed) return <button className="mascot-restore" onClick={() => setCollapsed(false)} title="叫寸寸回来" aria-label="展开鼠妹寸寸"><span>🐭</span></button>;

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

  return <div ref={node} className={`floating-mascot ${walking ? 'is-walking' : ''} ${facingLeft ? 'facing-left' : ''} ${turning ? 'is-turning' : ''} ${turnDirection ? `turn-to-${turnDirection}` : ''} ${dragging ? 'is-dragging' : ''}`} style={{ left: position.x, top: position.y, '--move-duration': dragging || !walking ? '0s' : `${travelDuration}s` } as CSSProperties} onMouseEnter={() => { if (walking) setPosition(layoutPositionFromVisualRect()); clearMotionTimers(); setWalking(false); setTurning(false); setTurnDirection(null); setHovered(true); }} onMouseLeave={() => setHovered(false)}>
    {open && <div className="mascot-bubble" style={{ left: position.x < 140 ? 0 : 'auto', right: position.x < 140 ? 'auto' : 0, top: position.y < 260 ? 180 : 'auto', bottom: position.y < 260 ? 'auto' : 185 }}><button className="bubble-close" onClick={() => setOpen(false)} aria-label="关闭寸寸对话"><X size={13} /></button><span className="bubble-name">寸寸 <span>· 你的自律搭子</span></span><p>{speech}</p><div className="bubble-actions"><button onClick={() => setSpeech(nextTask ? `今天先做「${nextTask}」。不用一口气全做完，先开始就赢了一半。` : '今天的待办已经收好啦！可以加一个小任务，也可以好好休息。')}><ListTodo size={13} />今天做什么</button><button onClick={() => { setOpen(false); onFocus(); }}><Play size={13} />陪我专注</button></div><button className="bubble-rest" onClick={() => { setOpen(false); setCollapsed(true); }}><Minimize2 size={12} />先在角落休息一下</button></div>}
    <button className="mascot-touch" aria-label="与寸寸互动，按住可以拖动" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { clearMotionTimers(); drag.current = null; setDragging(false); setWalking(false); setTurning(false); setTurnDirection(null); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(value => !value); } }}><Sprite size={138} mood={celebrating ? 'celebrate' : walking ? 'walk' : 'idle'} /><span className="pet-ground" /></button>
    <span className="mascot-tag">{preferences.quiet ? <Moon size={10} /> : <Coffee size={10} />}寸寸陪伴中</span>
  </div>;
}
