import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, Check, LoaderCircle, Plus, X } from 'lucide-react';
import type { User } from '../../shared/types';
import { BrandMark } from './brand';

export function Logo({ compact = false }: { compact?: boolean }) {
  return <a className="brand" href="#today" aria-label="寸进首页"><BrandMark />{!compact && <span className="brand-type"><strong>寸进<span>InchUp</span></strong><small>每天，往前一点</small></span>}</a>;
}

export function Avatar({ user, size = 'normal' }: { user: Pick<User, 'name' | 'avatar'>; size?: 'small' | 'normal' | 'large' }) {
  return <span className={`avatar avatar-${size}`} style={{ '--avatar-hue': `${(user.name.charCodeAt(0) || 0) % 70 + 240}` } as React.CSSProperties}>{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : user.name.slice(0, 1)}</span>;
}

export function ProgressBar({ value, variant = '' }: { value: number; variant?: string }) {
  return <div className={`progress-track ${variant}`} role="progressbar" aria-label="任务完成进度" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${value}%` }} /></div>;
}

export function Empty({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-flower">✳</span><h3>{title}</h3><p>{description}</p>{action && <button className="button button-soft" onClick={onAction}><Plus size={16} />{action}</button>}</div>;
}

export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; if (!dialog.open) dialog.showModal(); return () => { if (dialog.open) dialog.close(); }; }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={onClose} onClick={event => { if (event.target !== ref.current) return; const box = ref.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); }} aria-label={title}><div className="modal-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}

export function SubmitButton({ busy, children, disabled = false }: { busy: boolean; children: ReactNode; disabled?: boolean }) {
  return <button className="button button-primary" type="submit" disabled={busy || disabled}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{children}</button>;
}

export function SectionLink({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="section-link" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>; }
