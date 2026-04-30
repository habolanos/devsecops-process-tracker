'use client';

import React from 'react';

export interface HeroDef {
  id: string;
  name: string;
  color: string;
  colorEnd: string;
  iconBg: string;
}

// 12 Marvel heroes only
export const HEROES: HeroDef[] = [
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
  { id: 'scarlet-witch', name: 'Scarlet Witch', color: '#DC2626', colorEnd: '#7C3AED', iconBg: 'from-red-600 to-purple-600' },
  { id: 'loki', name: 'Loki', color: '#15803D', colorEnd: '#FCD34D', iconBg: 'from-green-700 to-amber-400' },
];

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
  sm: { container: 'w-7 h-7', svg: 16 },
  md: { container: 'w-9 h-9', svg: 20 },
  lg: { container: 'w-14 h-14', svg: 32 },
  xl: { container: 'w-20 h-20', svg: 44 },
};

export function HeroAvatar({ heroId, size = 'md', className = '' }: HeroAvatarProps) {
  const hero = getHeroById(heroId);
  const sizeConfig = SIZE_MAP[size];

  if (!hero) {
    return (
      <div className={`${sizeConfig.container} rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center ${className}`}>
        <svg width={sizeConfig.svg} height={sizeConfig.svg} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        </svg>
      </div>
    );
  }

  const renderHeroIcon = () => {
    const s = sizeConfig.svg;
    switch (heroId) {
      case 'iron-man':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="im-face" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FCD34D"/><stop offset="100%" stopColor="#D97706"/></linearGradient></defs><ellipse cx="16" cy="20" rx="10" ry="11" fill="#B91C1C"/><ellipse cx="16" cy="16" rx="7" ry="8" fill="url(#im-face)"/><path d="M12 13h8v4H12z" fill="#7C2D12" rx="1"/><circle cx="14" cy="15" r="1.5" fill="#FEF3C7"/><circle cx="18" cy="15" r="1.5" fill="#FEF3C7"/><path d="M13 22c1.5 1.5 4.5 1.5 6 0" stroke="#B91C1C" strokeWidth="1.5" fill="none" strokeLinecap="round"/><rect x="13" y="11" width="6" height="2" fill="#B91C1C" rx="1"/></svg>;
      case 'spider-man':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><radialGradient id="sm-face" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#DC2626"/><stop offset="100%" stopColor="#991B1B"/></radialGradient></defs><ellipse cx="16" cy="18" rx="10" ry="9" fill="url(#sm-face)"/><path d="M6 12c2-2 5-3 10-3s8 1 10 3" stroke="#1D4ED8" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M9 16l4 4M23 16l-4 4M16 12v8" stroke="#1D4ED8" strokeWidth="1.2" opacity="0.7"/><ellipse cx="13" cy="16" rx="2.5" ry="3" fill="white"/><ellipse cx="19" cy="16" rx="2.5" ry="3" fill="white"/><ellipse cx="13" cy="16" rx="1.5" ry="1.8" fill="#1D4ED8"/><ellipse cx="19" cy="16" rx="1.5" ry="1.8" fill="#1D4ED8"/><path d="M13 24c1.5 1 4.5 1 6 0" stroke="#7F1D1D" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>;
      case 'captain-america':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><radialGradient id="ca-shield" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#1D4ED8"/><stop offset="40%" stopColor="#1E40AF"/><stop offset="40.5%" stopColor="#DC2626"/><stop offset="65%" stopColor="#B91C1C"/><stop offset="65.5%" stopColor="#1D4ED8"/><stop offset="100%" stopColor="#1E40AF"/></radialGradient></defs><circle cx="16" cy="16" r="12" fill="url(#ca-shield)" stroke="#1E3A8A" strokeWidth="1"/><circle cx="16" cy="16" r="5" fill="#DC2626"/><polygon points="16,9 17.8,13.8 22.5,13.8 18.8,16.5 20,21 16,18 12,21 13.2,16.5 9.5,13.8 14.2,13.8" fill="white" opacity="0.95"/></svg>;
      case 'thor':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="th-hair" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FCD34D"/><stop offset="100%" stopColor="#D97706"/></linearGradient></defs><ellipse cx="16" cy="20" rx="9" ry="10" fill="#A78BFA"/><ellipse cx="16" cy="16" rx="6" ry="7" fill="#FDE68A"/><ellipse cx="16" cy="8" rx="7" ry="5" fill="url(#th-hair)"/><path d="M9 6c1.5-2.5 4-4 7-4s5.5 1.5 7 4" stroke="#D97706" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="13" cy="15" r="1.8" fill="#1E40AF"/><circle cx="19" cy="15" r="1.8" fill="#1E40AF"/><path d="M13 22c1 1 4 1 6 0" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M11 19v4M21 19v4" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>;
      case 'hulk':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="hk-skin" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#4ADE80"/><stop offset="100%" stopColor="#15803D"/></linearGradient></defs><ellipse cx="16" cy="20" rx="10" ry="9" fill="#15803D"/><ellipse cx="16" cy="16" rx="7" ry="7" fill="url(#hk-skin)"/><path d="M8 12c0-2 3.5-4 8-4s8 2 8 4" fill="#15803D"/><ellipse cx="13" cy="15" rx="1.8" ry="1.5" fill="white"/><ellipse cx="19" cy="15" rx="1.8" ry="1.5" fill="white"/><ellipse cx="13" cy="15" rx="0.8" ry="0.7" fill="#166534"/><ellipse cx="19" cy="15" rx="0.8" ry="0.7" fill="#166534"/><path d="M11 22c2 1.5 6 1.5 10 0" stroke="#14532D" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M6 10l3.5 2M26 10l-3.5 2" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/></svg>;
      case 'black-widow':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="bw-hair" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#DC2626"/><stop offset="100%" stopColor="#991B1B"/></linearGradient></defs><ellipse cx="16" cy="20" rx="9" ry="10" fill="#1F2937"/><ellipse cx="16" cy="15" rx="6" ry="7" fill="#FDA4AF"/><ellipse cx="16" cy="8" rx="7.5" ry="5" fill="url(#bw-hair)"/><path d="M8 6c1.5-2 4-3.5 8-3.5s6.5 1.5 8 3.5" stroke="#7F1D1D" strokeWidth="1.5" fill="none" strokeLinecap="round"/><ellipse cx="13" cy="15" rx="1.8" ry="2.5" fill="#111827"/><ellipse cx="19" cy="15" rx="1.8" ry="2.5" fill="#111827"/><path d="M14 23c1.5 1 4.5 1 6 0" stroke="#7F1D1D" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M12 5l4 2 4-2" stroke="#DC2626" strokeWidth="1.5" fill="none"/></svg>;
      case 'doctor-strange':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ds-robe" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#5B21B6"/></linearGradient></defs><ellipse cx="16" cy="20" rx="10" ry="11" fill="url(#ds-robe)"/><ellipse cx="16" cy="16" rx="7" ry="8" fill="#FDE68A"/><ellipse cx="16" cy="6.5" rx="7" ry="5" fill="#374151"/><path d="M10 9c1.5-2.5 3.5-4 6-4s4.5 1.5 6 4" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round"/><ellipse cx="13.5" cy="16" rx="1.8" ry="2.5" fill="#581C87"/><ellipse cx="18.5" cy="16" rx="1.8" ry="2.5" fill="#581C87"/><circle cx="16" cy="22" r="2.5" fill="none" stroke="#EC4899" strokeWidth="1.5"/><path d="M16 19.5v5M13.5 22h5" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round"/></svg>;
      case 'black-panther':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="bp-suit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1F2937"/><stop offset="100%" stopColor="#111827"/></linearGradient></defs><ellipse cx="16" cy="20" rx="10" ry="11" fill="url(#bp-suit)"/><ellipse cx="16" cy="16" rx="7" ry="8" fill="#374151"/><ellipse cx="16" cy="6.5" rx="7" ry="5" fill="#1F2937"/><path d="M10 8.5c1.5-2 3.5-3.5 6-3.5s4.5 1.5 6 3.5" stroke="#6D28D9" strokeWidth="1.5" fill="none" strokeLinecap="round"/><ellipse cx="13.5" cy="16" rx="1.8" ry="1.5" fill="#6D28D9"/><ellipse cx="18.5" cy="16" rx="1.8" ry="1.5" fill="#6D28D9"/><path d="M8 13.5l4.5 4 4.5-4M9 22l7 3 7-3" stroke="#6D28D9" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/></svg>;
      case 'captain-marvel':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="cm-star" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D"/><stop offset="100%" stopColor="#F59E0B"/></linearGradient></defs><ellipse cx="16" cy="20" rx="10" ry="11" fill="#1D4ED8"/><ellipse cx="16" cy="15" rx="7" ry="8" fill="#FEF3C7"/><ellipse cx="16" cy="6.5" rx="7.5" ry="5" fill="#DC2626"/><path d="M9 5c2-2.5 5-4 7-4s5 1.5 7 4" stroke="#991B1B" strokeWidth="1.5" fill="none" strokeLinecap="round"/><ellipse cx="13.5" cy="14" rx="1.8" ry="2.5" fill="#1E40AF"/><ellipse cx="18.5" cy="14" rx="1.8" ry="2.5" fill="#1E40AF"/><path d="M14 22c1.5 1 4.5 1 6 0" stroke="#B91C1C" strokeWidth="1.5" fill="none" strokeLinecap="round"/><polygon points="16,9 17.8,14.5 23,14.5 18.8,17.5 20,22.5 16,19.5 12,22.5 13.2,17.5 9,14.5 14.2,14.5" fill="url(#cm-star)"/></svg>;
      case 'wolverine':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="wv-mask" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F59E0B"/><stop offset="100%" stopColor="#D97706"/></linearGradient></defs><ellipse cx="16" cy="20" rx="9" ry="10" fill="url(#wv-mask)"/><ellipse cx="16" cy="15" rx="6" ry="7" fill="#1F2937"/><ellipse cx="16" cy="6.5" rx="7" ry="5" fill="#F59E0B"/><path d="M9 5c1.5-2 3.5-3.5 7-3.5s5.5 1.5 7 3.5" stroke="#D97706" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M5.5 9l4 3.5M26.5 9l-4 3.5" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round"/><path d="M6.5 8l2.5 2.5M25.5 8l-2.5 2.5" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/><ellipse cx="13.5" cy="15" rx="1.8" ry="1.5" fill="#F59E0B"/><ellipse cx="18.5" cy="15" rx="1.8" ry="1.5" fill="#F59E0B"/><path d="M12.5 22c2 1.5 6 1.5 9 0" stroke="#111827" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>;
      case 'scarlet-witch':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="sw-dress" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#DC2626"/><stop offset="100%" stopColor="#991B1B"/></linearGradient><radialGradient id="sw-crown" cx="50%" cy="0%" r="80%"><stop offset="0%" stopColor="#FCD34D"/><stop offset="100%" stopColor="#D97706"/></radialGradient></defs><ellipse cx="16" cy="20" rx="10" ry="11" fill="url(#sw-dress)"/><ellipse cx="16" cy="15" rx="7" ry="8" fill="#FDE68A"/><ellipse cx="16" cy="6.5" rx="7.5" ry="5.5" fill="#573E28"/><path d="M8.5 4c2-2.5 5-4 7.5-4s5.5 1.5 7.5 4" stroke="url(#sw-crown)" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="13.5" cy="15" rx="1.8" ry="2.5" fill="#7C3AED"/><ellipse cx="18.5" cy="15" rx="1.8" ry="2.5" fill="#7C3AED"/><path d="M12 23c1.5 1.5 5.5 1.5 8 0" stroke="#B91C1C" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M12 11l4 5 4-5" stroke="#FCD34D" strokeWidth="1.5" fill="none"/><circle cx="16" cy="21" r="2.5" fill="#7C3AED"/><circle cx="16" cy="21" r="1.3" fill="#FCD34D"/></svg>;
      case 'loki':
        return <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><defs><linearGradient id="lk-suit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#15803D"/><stop offset="100%" stopColor="#166534"/></linearGradient><linearGradient id="lk-helmet" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D"/><stop offset="100%" stopColor="#D97706"/></linearGradient></defs><ellipse cx="16" cy="20" rx="9" ry="11" fill="url(#lk-suit)"/><ellipse cx="16" cy="15" rx="7" ry="8" fill="#FDE68A"/><ellipse cx="16" cy="6.5" rx="7.5" ry="5.5" fill="url(#lk-helmet)"/><path d="M8.5 4c2-2.5 5-4 7.5-4s5.5 1.5 7.5 4" stroke="#B45309" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M9 2.5l7 4 7-4" stroke="#1F2937" strokeWidth="1.5" fill="none"/><ellipse cx="13.5" cy="15" rx="1.8" ry="2.5" fill="#1F2937"/><ellipse cx="18.5" cy="15" rx="1.8" ry="2.5" fill="#1F2937"/><path d="M12 23c1.5 1.5 5.5 1.5 8 0" stroke="#14532D" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M11.5 12l4.5 2 4.5-2" stroke="#FCD34D" strokeWidth="1.5" fill="none"/></svg>;
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
    <div className="grid grid-cols-4 gap-1.5">
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
