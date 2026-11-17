import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Coffee, ListTodo, Minimize2, Moon, Play, X } from 'lucide-react';

type Mood = 'idle' | 'walk' | 'celebrate';

export function Sprite({ mood = 'idle', size = 140, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const [frame, setFrame] = useState(4);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setFrame(mood === 'walk' ? 0 : mood === 'celebrate' ? 6 : 4);
    if (reduced) return;
    if (mood === 'idle') {
      let blink: ReturnType<typeof setTimeout>;
      const interval = setInterval(() => { setFrame(5); blink = setTimeout(() => setFrame(4), 220); }, 4300);
      return () => { clearInterval(interval); clearTimeout(blink); };
    }
    const interval = setInterval(() => setFrame(current => mood === 'walk' ? (current + 1) % 4 : current === 6 ? 7 : 6), mood === 'walk' ? 160 : 400);
    return () => clearInterval(interval);
  }, [mood]);
  return <div className={`mascot-sprite sprite-${mood} ${className}`} style={{ width: size, height: size * 4 / 3, backgroundPosition: `${frame % 4 / 3 * 100}% ${frame < 4 ? 0 : 100}%` }} role="img" aria-label={`鼠妹寸寸${mood === 'walk' ? '正在走路' : mood === 'celebrate' ? '正在庆祝' : '正在陪伴你'}`} />;
}

export interface MascotPreferences { enabled: boolean; roaming: boolean; quiet: boolean }

export function Mascot({ preferences, celebration, nextTask, onFocus }: { preferences: MascotPreferences; celebration: number; nextTask?: string; onFocus: () => void }) {
  const [position, setPosition] = useState({ x: Math.max(16, window.innerWidth - 190), y: Math.max(90, window.innerHeight - 190) });
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [speech, setSpeech] = useState('我会陪着你，一点一点往前走。');
  const node = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);

  useEffect(() => {
    const handle = () => setPosition(p => ({ x: Math.max(8, Math.min(p.x, window.innerWidth - 150)), y: Math.max(90, Math.min(p.y, window.innerHeight - 180)) }));
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    if (!celebration) return;
    clearTimeout(moveTimer.current);
    setWalking(false);
    setCelebrating(true);
    setSpeech('又往前走了一步！今天的你，有点厉害哦。');
    if (!preferences.quiet) setOpen(true);
    const timeout = setTimeout(() => { setCelebrating(false); setOpen(false); }, 5000);
    return () => clearTimeout(timeout);
  }, [celebration, preferences.quiet]);

  useEffect(() => {
    if (!preferences.enabled || !preferences.roaming || dragging || hovered || open || collapsed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      const nextX = 20 + Math.random() * Math.max(0, window.innerWidth - 190);
      setFacingLeft(nextX < positionRef.current.x);
      setWalking(true);
      setPosition({ x: nextX, y: Math.max(100, window.innerHeight - 190 - Math.random() * 30) });
      moveTimer.current = setTimeout(() => setWalking(false), 4500);
    }, 18000);
    return () => { clearInterval(timer); clearTimeout(moveTimer.current); };
  }, [preferences.enabled, preferences.roaming, dragging, hovered, open, collapsed]);

  if (!preferences.enabled) return null;
  if (collapsed) return <button className="mascot-restore" onClick={() => setCollapsed(false)} title="叫寸寸回来" aria-label="展开鼠妹寸寸"><span>🐭</span></button>;

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = node.current!.getBoundingClientRect();
    clearTimeout(moveTimer.current);
    setWalking(false);
    setPosition({ x: rect.left, y: rect.top });
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
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

  return <div ref={node} className={`floating-mascot ${walking ? 'is-walking' : ''} ${facingLeft ? 'facing-left' : ''} ${dragging ? 'is-dragging' : ''}`} style={{ left: position.x, top: position.y, '--move-duration': dragging || !walking ? '0s' : '4.5s' } as CSSProperties} onMouseEnter={() => { const box = node.current?.getBoundingClientRect(); if (box && walking) setPosition({ x: box.left, y: box.top }); setWalking(false); setHovered(true); }} onMouseLeave={() => setHovered(false)}>
    {open && <div className="mascot-bubble" style={{ left: position.x < 140 ? 0 : 'auto', right: position.x < 140 ? 'auto' : 0, top: position.y < 260 ? 180 : 'auto', bottom: position.y < 260 ? 'auto' : 185 }}><button className="bubble-close" onClick={() => setOpen(false)} aria-label="关闭寸寸对话"><X size={13} /></button><span className="bubble-name">寸寸 <span>· 你的自律搭子</span></span><p>{speech}</p><div className="bubble-actions"><button onClick={() => setSpeech(nextTask ? `今天先做「${nextTask}」。不用一口气全做完，先开始就赢了一半。` : '今天的待办已经收好啦！可以加一个小任务，也可以好好休息。')}><ListTodo size={13} />今天做什么</button><button onClick={() => { setOpen(false); onFocus(); }}><Play size={13} />陪我专注</button></div><button className="bubble-rest" onClick={() => { setOpen(false); setCollapsed(true); }}><Minimize2 size={12} />先在角落休息一下</button></div>}
    <button className="mascot-touch" aria-label="与寸寸互动，按住可以拖动" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { drag.current = null; setDragging(false); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(value => !value); } }}><Sprite size={138} mood={celebrating ? 'celebrate' : walking ? 'walk' : 'idle'} /><span className="pet-ground" /></button>
    <span className="mascot-tag">{preferences.quiet ? <Moon size={10} /> : <Coffee size={10} />}寸寸陪伴中</span>
  </div>;
}
