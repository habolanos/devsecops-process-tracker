'use client';

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { HeroAvatar, HeroGrid, getHeroById } from '@/components/marvel-avatars';
import { Dices, Save, Pencil, User, RotateCcw } from 'lucide-react';

interface UserProfilePopoverProps {
  language?: 'es' | 'en';
}

export function UserProfilePopover({ language = 'es' }: UserProfilePopoverProps) {
  const profile = useUserProfileStore((s) => s.profile);
  const initProfile = useUserProfileStore((s) => s.initProfile);
  const updateName = useUserProfileStore((s) => s.updateName);
  const updateAvatar = useUserProfileStore((s) => s.updateAvatar);
  const randomizeHero = useUserProfileStore((s) => s.randomizeHero);
  const resetName = useUserProfileStore((s) => s.resetName);

  const [isOpen, setIsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.isCustom ? profile.name : '');
    }
  }, [profile]);

  if (!profile) return null;

  const hero = getHeroById(profile.avatarId);
  const isCustomLabel = profile.isCustom
    ? (language === 'es' ? 'Personalizado' : 'Custom')
    : (language === 'es' ? 'Aleatorio' : 'Random');

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      updateName(trimmed);
      setIsEditing(false);
    }
  };

  const handleRandomize = () => {
    randomizeHero();
    setIsEditing(false);
  };

  const handleAvatarSelect = (heroId: string) => {
    updateAvatar(heroId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(profile.isCustom ? profile.name : '');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group"
          title={language === 'es' ? 'Perfil de usuario' : 'User profile'}
        >
          <HeroAvatar heroId={profile.avatarId} size="sm" className="group-hover:ring-primary transition-all" />
          <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden sm:inline">
            {profile.name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
        <div className="space-y-4">
          {/* Header with avatar and name */}
          <div className="flex items-center gap-3">
            <HeroAvatar heroId={profile.avatarId} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{profile.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {isCustomLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {hero?.name || profile.avatarId}
              </p>
            </div>
          </div>

          {/* Name editor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}
            </label>
            {isEditing ? (
              <div className="flex gap-1.5">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'es' ? 'Ingresa tu nombre...' : 'Enter your name...'}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  onClick={handleSaveName}
                  size="sm"
                  className="h-8 px-2"
                  disabled={!editName.trim()}
                >
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditName(profile.isCustom ? profile.name : '');
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md cursor-pointer hover:bg-accent transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`text-sm flex-1 ${profile.isCustom ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {profile.isCustom ? profile.name : (language === 'es' ? 'Usar nombre de héroe' : 'Use hero name')}
                </span>
                {profile.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetName();
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title={language === 'es' ? 'Restaurar nombre de héroe' : 'Reset to hero name'}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Randomize button */}
          <Button
            onClick={handleRandomize}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Dices className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Héroe Aleatorio' : 'Random Hero'}
          </Button>

          {/* Avatar grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'es' ? 'Seleccionar avatar' : 'Select avatar'}
            </label>
            <HeroGrid
              selectedId={profile.avatarId}
              onSelect={handleAvatarSelect}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
