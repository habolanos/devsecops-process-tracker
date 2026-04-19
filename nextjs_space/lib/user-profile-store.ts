'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCompressedStorage } from './persist-storage';
import { getRandomHero, HEROES, HeroDef } from '@/components/avatars';

// ============================================
// User Profile Types
// ============================================

export interface UserProfile {
  name: string;           // Hero name or custom name entered by user
  avatarId: string;       // Marvel hero ID (e.g. 'iron-man')
  isCustom: boolean;      // false = random hero, true = user entered custom name
}

// ============================================
// User Profile Store Interface
// ============================================

interface UserProfileStore {
  profile: UserProfile | null;

  // Actions
  initProfile: () => void;                     // Initialize with random hero if empty
  setProfile: (profile: UserProfile) => void;  // Set custom profile
  updateName: (name: string) => void;          // Update name only
  updateAvatar: (avatarId: string) => void;    // Update avatar only
  randomizeHero: () => void;                   // Get a new random hero
  resetName: () => void;                       // Reset name to hero default
  clearProfile: () => void;                    // Reset to null
  clearStorage: () => void;                    // Clear localStorage

  // Getters
  getDisplayName: () => string;                // Get name or 'Usuario Anónimo'
  getHero: () => HeroDef | undefined;       // Get current hero data
}

// ============================================
// User Profile Store Implementation
// ============================================

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,

      initProfile: () => {
        const { profile } = get();
        if (!profile) {
          const hero = getRandomHero();
          set({
            profile: {
              name: hero.name,
              avatarId: hero.id,
              isCustom: false,
            },
          });
        }
      },

      setProfile: (profile) => {
        set({ profile });
      },

      updateName: (name) => {
        const { profile } = get();
        if (profile) {
          const trimmed = name.trim();
          set({
            profile: {
              ...profile,
              name: trimmed || profile.name,
              isCustom: trimmed.length > 0,
            },
          });
        }
      },

      updateAvatar: (avatarId) => {
        const { profile } = get();
        const hero = HEROES.find(h => h.id === avatarId);
        if (profile && hero) {
          set({
            profile: {
              ...profile,
              avatarId,
              // If name was still the hero default, update to new hero name
              name: profile.isCustom ? profile.name : hero.name,
            },
          });
        }
      },

      randomizeHero: () => {
        const { profile } = get();
        const currentId = profile?.avatarId;
        let hero = getRandomHero();
        // Avoid same hero twice in a row
        let attempts = 0;
        while (hero.id === currentId && attempts < 10) {
          hero = getRandomHero();
          attempts++;
        }
        set({
          profile: {
            name: profile?.isCustom ? (profile.name || hero.name) : hero.name,
            avatarId: hero.id,
            isCustom: profile?.isCustom ?? false,
          },
        });
      },

      resetName: () => {
        const { profile } = get();
        if (profile) {
          const hero = HEROES.find(h => h.id === profile.avatarId);
          if (hero) {
            set({
              profile: {
                ...profile,
                name: hero.name,
                isCustom: false,
              },
            });
          }
        }
      },

      clearProfile: () => {
        set({ profile: null });
      },

      clearStorage: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-profile-storage');
        }
      },

      getDisplayName: () => {
        const { profile } = get();
        return profile?.name || 'Usuario Anónimo';
      },

      getHero: () => {
        const { profile } = get();
        if (!profile) return undefined;
        return HEROES.find(h => h.id === profile.avatarId);
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createCompressedStorage<UserProfileStore>(),
    }
  )
);
