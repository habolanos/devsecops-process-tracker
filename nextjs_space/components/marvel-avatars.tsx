'use client';

import React from 'react';

export interface HeroDef {
  id: string;
  name: string;
  color: string;       // Primary gradient start
  colorEnd: string;    // Primary gradient end
  iconBg: string;      // Icon background class
}

export const HEROES: HeroDef[] = [
  // Marvel
  { id: 'iron-man', name: 'Iron Man', color: '#B91C1C', colorEnd: '#DC2626', iconBg: 'from-red-600 to-red-500' },
  { id: 'spider-man', name: 'Spider-Man', color: '#DC2626', colorEnd: '#1D4ED8', iconBg: 'from-red-500 to-blue-600' },
  { id: 'captain-america', name: 'Capitán América', color: '#1D4ED8', colorEnd: '#DC2626', iconBg: 'from-blue-700 to-red-600' },
  { id: 'thor', name: 'Thor', color: '#6D28D9', colorEnd: '#A78BFA', iconBg: 'from-violet-700 to-violet-400' },
  { id: 'hulk', name: 'Hulk', color: '#15803D', colorEnd: '#4ADE80', iconBg: 'from-green-700 to-green-400' },
  { id: 'black-widow', name: 'Black Widow', color: '#1F2937', colorEnd: '#DC2626', iconBg: 'from-gray-800 to-red-600' },
  { id: 'doctor-strange', name: 'Doctor Strange', color: '#7C3AED', colorEnd: '#EC4899', iconBg: 'from-purple-600 to-pink-500' },
  { id: 'black-panther', name: 'Black Panther', color: '#1F2937', colorEnd: '#6D28D9', iconBg: 'from-gray-900 to-violet-700' },
  { id: 'captain-marvel', name: 'Capitana Marvel', color: '#1D4ED8', colorEnd: '#F59E0B', iconBg: 'from-blue-700 to-amber-500' },
  { id: 'wolverine', name: 'Wolverine', color: '#F59E0B', colorEnd: '#B91C1C', iconBg: 'from-amber-500 to-red-700' },
  // DC Comics
  { id: 'batman', name: 'Batman', color: '#1F2937', colorEnd: '#FCD34D', iconBg: 'from-gray-900 to-amber-400' },
  { id: 'superman', name: 'Superman', color: '#1D4ED8', colorEnd: '#DC2626', iconBg: 'from-blue-600 to-red-500' },
  { id: 'wonder-woman', name: 'Wonder Woman', color: '#DC2626', colorEnd: '#FCD34D', iconBg: 'from-red-600 to-amber-400' },
  { id: 'green-lantern', name: 'Green Lantern', color: '#15803D', colorEnd: '#4ADE80', iconBg: 'from-green-600 to-emerald-400' },
  { id: 'aquaman', name: 'Aquaman', color: '#F59E0B', colorEnd: '#06B6D4', iconBg: 'from-amber-500 to-cyan-500' },
  // Marvel Extended
  { id: 'scarlet-witch', name: 'Wanda Vision', color: '#DC2626', colorEnd: '#7C3AED', iconBg: 'from-red-600 to-purple-600' },
  { id: 'star-lord', name: 'Star-Lord', color: '#1D4ED8', colorEnd: '#F59E0B', iconBg: 'from-blue-600 to-amber-500' },
  { id: 'valkyrie', name: 'Valkiria', color: '#6D28D9', colorEnd: '#06B6D4', iconBg: 'from-violet-700 to-cyan-500' },
  { id: 'loki', name: 'Loki', color: '#15803D', colorEnd: '#FCD34D', iconBg: 'from-green-700 to-amber-400' },
  // Other
  { id: 'gru', name: 'Gru', color: '#1F2937', colorEnd: '#7C3AED', iconBg: 'from-gray-800 to-purple-600' },
];

/** @deprecated Use HEROES instead */
export const MARVEL_HEROES = HEROES;

export function getHeroById(id: string): HeroDef | undefined {
  return HEROES.find(h => h.id === id);
}

export function getRandomHero(): HeroDef {
  return HEROES[Math.floor(Math.random() * HEROES.length)];
}

interface HeroAvatarProps {
  heroId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-7 h-7', svg: 16, fontSize: 'text-[8px]' },
  md: { container: 'w-9 h-9', svg: 20, fontSize: 'text-[10px]' },
  lg: { container: 'w-14 h-14', svg: 32, fontSize: 'text-xs' },
  xl: { container: 'w-20 h-20', svg: 44, fontSize: 'text-sm' },
};

export function HeroAvatar({ heroId, size = 'md', className = '' }: HeroAvatarProps) {
  const hero = getHeroById(heroId);
  const sizeConfig = SIZE_MAP[size];

  if (!hero) {
    return (
      <div className={`${sizeConfig.container} rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center ${className}`}>
        <svg width={sizeConfig.svg} height={sizeConfig.svg} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }

  const renderHeroIcon = () => {
    const s = sizeConfig.svg;
    switch (heroId) {
      case 'iron-man':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M16 2L6 8v8l10 6 10-6V8L16 2z" fill="#FCD34D" stroke="#B91C1C" strokeWidth="1.5"/><path d="M16 8l-5 3v4l5 3 5-3v-4l-5-3z" fill="#B91C1C"/><circle cx="16" cy="13" r="2" fill="#FCD34D"/><path d="M11 11h10M16 8v2" stroke="#FCD34D" strokeWidth="0.8"/></svg>;
      case 'spider-man':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="14" r="8" fill="#DC2626"/><path d="M16 6v16M8 10l16 8M24 10l-16 8" stroke="#1D4ED8" strokeWidth="1.2"/><path d="M16 6c-3 0-5 2-5 4h10c0-2-2-4-5-4z" fill="#DC2626"/><ellipse cx="13" cy="13" rx="2.5" ry="3" fill="white"/><ellipse cx="19" cy="13" rx="2.5" ry="3" fill="white"/><ellipse cx="13" cy="13" rx="1.2" ry="1.5" fill="#1D4ED8"/><ellipse cx="19" cy="13" rx="1.2" ry="1.5" fill="#1D4ED8"/></svg>;
      case 'captain-america':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#1D4ED8"/><circle cx="16" cy="16" r="8" fill="#DC2626"/><circle cx="16" cy="16" r="4" fill="#1D4ED8"/><path d="M16 12l1.2 3.5h3.8l-3 2.3 1.1 3.5L16 19l-3.1 2.3 1.1-3.5-3-2.3h3.8L16 12z" fill="white"/></svg>;
      case 'thor':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><rect x="14" y="2" width="4" height="18" rx="1" fill="#A78BFA"/><rect x="8" y="14" width="16" height="4" rx="1" fill="#A78BFA"/><rect x="10" y="18" width="12" height="3" rx="1" fill="#6D28D9"/><path d="M10 21h12v6c0 1-1 2-2 2h-8c-1 0-2-1-2-2v-6z" fill="#6D28D9"/><circle cx="16" cy="10" r="3" fill="#FCD34D"/></svg>;
      case 'hulk':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="18" rx="10" ry="10" fill="#15803D"/><ellipse cx="16" cy="14" rx="7" ry="6" fill="#4ADE80"/><path d="M9 12c0-2 3-5 7-5s7 3 7 5" fill="#15803D"/><ellipse cx="13" cy="14" rx="1.5" ry="1" fill="white"/><ellipse cx="19" cy="14" rx="1.5" ry="1" fill="white"/><path d="M12 18c1 2 7 2 8 0" stroke="#15803D" strokeWidth="1.5" fill="none"/><path d="M6 10l4 2M26 10l-4 2" stroke="#4ADE80" strokeWidth="2"/></svg>;
      case 'black-widow':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#1F2937"/><path d="M16 6l-6 10 6 10 6-10L16 6z" fill="#DC2626"/><circle cx="16" cy="16" r="3" fill="#1F2937"/><path d="M16 13l1 2-1 2-1-2 1-2z" fill="#DC2626"/></svg>;
      case 'doctor-strange':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#7C3AED"/><circle cx="16" cy="16" r="8" fill="none" stroke="#EC4899" strokeWidth="1.5"/><circle cx="16" cy="16" r="4" fill="none" stroke="#FCD34D" strokeWidth="1"/><path d="M16 4v24M4 16h24" stroke="#EC4899" strokeWidth="0.8"/><circle cx="16" cy="16" r="2" fill="#FCD34D"/></svg>;
      case 'black-panther':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="16" rx="10" ry="11" fill="#1F2937"/><path d="M6 10l5 6-5 6M26 10l-5 6 5 6" stroke="#6D28D9" strokeWidth="1.5"/><path d="M12 14l4-4 4 4" stroke="#6D28D9" strokeWidth="1.2" fill="none"/><ellipse cx="13" cy="16" rx="1.5" ry="1.5" fill="#6D28D9"/><ellipse cx="19" cy="16" rx="1.5" ry="1.5" fill="#6D28D9"/><path d="M14 20h4" stroke="#6D28D9" strokeWidth="1"/></svg>;
      case 'captain-marvel':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#1D4ED8"/><path d="M16 6l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" fill="#F59E0B"/><path d="M10 8l6 8 6-8" fill="#DC2626" opacity="0.7"/></svg>;
      case 'wolverine':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="18" rx="9" ry="9" fill="#F59E0B"/><path d="M7 8l4 6M25 8l-4 6" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round"/><path d="M10 6l3 5M22 6l-3 5" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/><ellipse cx="13" cy="17" rx="1.5" ry="1" fill="#1F2937"/><ellipse cx="19" cy="17" rx="1.5" ry="1" fill="#1F2937"/><path d="M13 21c1.5 1.5 4.5 1.5 6 0" stroke="#92400E" strokeWidth="1.2" fill="none"/></svg>;
      // DC Comics
      case 'batman':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="18" rx="10" ry="10" fill="#1F2937"/><path d="M10 12c0-4 3-6 6-6s6 2 6 6" fill="#1F2937"/><path d="M10 12l-4-4c2 0 4 1 5 3M22 12l4-4c-2 0-4 1-5 3" fill="#1F2937"/><path d="M10 12c3-1 5 0 6 2 1-2 3-3 6-2" fill="#FCD34D"/><ellipse cx="13" cy="16" rx="1.5" ry="1" fill="white"/><ellipse cx="19" cy="16" rx="1.5" ry="1" fill="white"/></svg>;
      case 'superman':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#1D4ED8"/><path d="M16 6l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="#FCD34D"/><path d="M13 14l3 2 3-2" fill="#DC2626" opacity="0.8"/></svg>;
      case 'wonder-woman':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#DC2626"/><path d="M10 10h12l-2 3 2 3H10l2-3-2-3z" fill="#FCD34D"/><path d="M14 13h4v6h-4z" fill="#1D4ED8"/><circle cx="16" cy="10" r="2" fill="#FCD34D"/></svg>;
      case 'green-lantern':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#15803D"/><circle cx="16" cy="16" r="6" fill="#4ADE80"/><circle cx="16" cy="16" r="3" fill="#15803D"/><path d="M16 10v12M10 16h12" stroke="#FCD34D" strokeWidth="1"/><circle cx="16" cy="16" r="1.5" fill="#FCD34D"/></svg>;
      case 'aquaman':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="18" rx="10" ry="10" fill="#06B6D4"/><ellipse cx="16" cy="14" rx="7" ry="6" fill="#F59E0B"/><path d="M9 10l7-4 7 4" stroke="#06B6D4" strokeWidth="1.5" fill="none"/><path d="M12 18c2 2 6 2 8 0" stroke="#06B6D4" strokeWidth="1.2" fill="none"/><circle cx="16" cy="9" r="1.5" fill="#FCD34D"/></svg>;
      // Marvel Extended
      case 'scarlet-witch':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#DC2626"/><circle cx="16" cy="16" r="6" fill="#7C3AED"/><path d="M16 6c-2 4-2 8 0 10M16 6c2 4 2 8 0 10" stroke="#DC2626" strokeWidth="1.5" fill="none"/><circle cx="16" cy="16" r="2" fill="#FCD34D"/><path d="M10 10l6 6 6-6" stroke="#FCD34D" strokeWidth="0.8" fill="none"/></svg>;
      case 'star-lord':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#1D4ED8"/><path d="M10 12h12v8H10z" fill="#F59E0B" rx="1"/><path d="M13 12v8M19 12v8" stroke="#1D4ED8" strokeWidth="1"/><circle cx="16" cy="9" r="3" fill="#F59E0B"/><path d="M14 9h4M16 7v4" stroke="#1D4ED8" strokeWidth="0.8"/></svg>;
      case 'valkyrie':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#6D28D9"/><path d="M10 8l6 4 6-4" fill="#06B6D4"/><path d="M12 14h8v6c0 2-4 4-4 4s-4-2-4-4v-6z" fill="#A78BFA"/><ellipse cx="13" cy="17" rx="1" ry="1" fill="white"/><ellipse cx="19" cy="17" rx="1" ry="1" fill="white"/><path d="M14 20h4" stroke="#6D28D9" strokeWidth="1"/></svg>;
      case 'loki':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="16" rx="8" ry="10" fill="#15803D"/><path d="M8 10l8-6 8 6" fill="#FCD34D"/><path d="M10 10l6-4 6 4" fill="#15803D"/><path d="M12 14l4-2 4 2" stroke="#FCD34D" strokeWidth="1" fill="none"/><ellipse cx="13" cy="16" rx="1.5" ry="1" fill="#FCD34D"/><ellipse cx="19" cy="16" rx="1.5" ry="1" fill="#FCD34D"/><path d="M14 20c1 1 3 1 4 0" stroke="#FCD34D" strokeWidth="0.8" fill="none"/></svg>;
      // Other
      case 'gru':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="18" rx="10" ry="10" fill="#1F2937"/><ellipse cx="16" cy="13" rx="7" ry="6" fill="#374151"/><path d="M9 8l4 4M23 8l-4 4" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/><ellipse cx="13" cy="14" rx="2" ry="2.5" fill="white"/><ellipse cx="19" cy="14" rx="2" ry="2.5" fill="white"/><ellipse cx="13" cy="14" rx="1" ry="1.2" fill="#7C3AED"/><ellipse cx="19" cy="14" rx="1" ry="1.2" fill="#7C3AED"/><path d="M13 19c1 2 5 2 6 0" stroke="#6B7280" strokeWidth="1.2" fill="none"/></svg>;
      default:
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>;
    }
  };

  return (
    <div
      className={`${sizeConfig.container} rounded-full bg-gradient-to-br ${hero.iconBg} flex items-center justify-center shadow-md ring-2 ring-background ${className}`}
      title={hero.name}
    >
      {renderHeroIcon()}
    </div>
  );
}

interface HeroGridProps {
  selectedId: string;
  onSelect: (heroId: string) => void;
}

export function HeroGrid({ selectedId, onSelect }: HeroGridProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {HEROES.map((hero) => (
        <button
          key={hero.id}
          onClick={() => onSelect(hero.id)}
          className={`
            relative rounded-lg p-1.5 transition-all duration-150
            ${selectedId === hero.id
              ? 'ring-2 ring-primary bg-accent scale-110'
              : 'hover:bg-accent hover:scale-105'
            }
          `}
          title={hero.name}
        >
          <HeroAvatar heroId={hero.id} size="md" />
          {selectedId === hero.id && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          )}
        </button>
      ))}
    </div>
  );
}
