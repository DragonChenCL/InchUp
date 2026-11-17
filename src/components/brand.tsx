import type { CSSProperties, ReactNode, SVGProps } from 'react';
import '../brand.css';

type BrandStyle = CSSProperties & { '--brand-size'?: string };

/** 寸进的品牌标记：两只小耳朵和一条向上的小步路径。 */
export function BrandMark({ className = '', size = 40 }: { className?: string; size?: number }) {
  const style: BrandStyle = { '--brand-size': `${size}px` };
  return <span className={`brand-mark ${className}`.trim()} style={style} aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none" focusable="false">
      <path d="M8.5 16.5C7.1 11.6 8.6 6.8 12.1 5.7c3.3-1 5.2 2.3 5.4 7.2" fill="currentColor" opacity=".88" />
      <path d="M31.5 16.5c1.4-4.9-.1-9.7-3.6-10.8-3.3-1-5.2 2.3-5.4 7.2" fill="currentColor" opacity=".88" />
      <path d="M7 20.1C7 13.7 12.5 10 20 10s13 3.7 13 10.1c0 8.3-5.2 13.6-13 13.6S7 28.4 7 20.1Z" fill="currentColor" />
      <path d="M12.5 26.4h5v-4.1h5v-4.1h5" stroke="var(--brand-accent, #8574bd)" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="18.2" r="1.45" fill="var(--brand-accent, #8574bd)" />
      <path d="M17.2 29.1c1.7 1.2 3.9 1.2 5.6 0" stroke="var(--brand-accent, #8574bd)" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  </span>;
}

export type JourneyIconName = 'today' | 'goals' | 'community' | 'giveaways' | 'growth';

type JourneyIconProps = { name: JourneyIconName; size?: number; className?: string } & Omit<SVGProps<SVGSVGElement>, 'name'>;

/** 导航专用的手绘几何线稿图标，统一使用 currentColor。 */
export function BrandIcon({ name, size = 20, className = '', ...props }: JourneyIconProps) {
  const common = { stroke: 'currentColor', strokeWidth: 1.65, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<JourneyIconName, ReactNode> = {
    today: <><path d="M4 19h16" {...common} /><path d="M6.5 16v-4h4v4h4v-4h4v-4" {...common} /><circle cx="18.5" cy="6" r="1.25" fill="currentColor" stroke="none" /></>,
    goals: <><circle cx="12" cy="12" r="8.3" {...common} /><circle cx="12" cy="12" r="4.2" {...common} /><path d="m12 12 5.2-5.2" {...common} /><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" /></>,
    community: <><circle cx="12" cy="8" r="2.8" {...common} /><path d="M6.7 19c.3-3.4 2-5.1 5.3-5.1s5 1.7 5.3 5.1" {...common} /><path d="M18.1 6.4c2.6.2 3.8 1.8 3.8 4.1M19.1 14.7c1.9.5 2.9 1.9 3.1 4.3" {...common} /></>,
    giveaways: <><path d="M4 10.2h16v9.4H4z" {...common} /><path d="M3.2 10.2h17.6v-3H3.2z" {...common} /><path d="M12 7.2v12.4M12 7.2c-2.8 0-4.4-1-4.4-2.5 0-1.1.8-1.9 1.9-1.9 1.8 0 2.5 2.5 2.5 4.4Zm0 0c2.8 0 4.4-1 4.4-2.5 0-1.1-.8-1.9-1.9-1.9-1.8 0-2.5 2.5-2.5 4.4Z" {...common} /></>,
    growth: <><path d="M5 18.5h14" {...common} /><path d="m6 15 3.4-3.4 2.7 2.3 5.8-6" {...common} /><path d="M17.2 7.9h2v2" {...common} /><path d="M12 19V9.5M9.3 19v-2.7M14.7 19v-5.2" {...common} /></>,
  };
  return <svg className={`journey-icon ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}

/** 旧命名兼容导出，页面接入可统一使用 BrandIcon。 */
export const JourneyIcon = BrandIcon;

/** 用一串小刻度把“今天”与“下一步”连接起来的页内装饰。 */
export function StepTrail({ className = '' }: { className?: string }) {
  return <svg className={`step-trail ${className}`.trim()} viewBox="0 0 260 32" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 24c31 0 29-15 57-15s29 15 58 15 28-15 57-15 32 15 82 15" stroke="currentColor" strokeWidth="1.15" strokeDasharray="2.5 5" opacity=".5" />
    <path d="M15 21h8v-5h8v-5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="94" cy="9" r="2.1" fill="currentColor" opacity=".7" />
    <circle cx="177" cy="9" r="2.1" fill="currentColor" opacity=".7" />
    <circle cx="244" cy="24" r="3" fill="currentColor" />
  </svg>;
}

/** 约定建立后使用的手账印章，适合放在契约卡或结果状态旁。 */
export function PromiseSeal({ className = '' }: { className?: string }) {
  return <svg className={`promise-seal ${className}`.trim()} viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
    <circle cx="40" cy="40" r="32.5" stroke="currentColor" strokeWidth="1.35" strokeDasharray="2 3" />
    <circle cx="40" cy="40" r="25" stroke="currentColor" strokeWidth=".8" opacity=".58" />
    <path d="M28 47h9v-7h9v-7h9" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="56" cy="31" r="2.1" fill="currentColor" />
    <path d="m34 54 6-3 6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
  </svg>;
}
