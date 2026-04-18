# User Profile & Author Capture Implementation Plan

**Status: ✅ IMPLEMENTED (v2.0.5)**

Implement an optional user profile system with Marvel superhero avatars to capture executor identity for process traceability, storing author information in `ProcessState` and including it in JSON exports and Word documents.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE EXPORTACIÓN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐      ┌──────────────────────┐      ┌──────────────┐  │
│   │  UserProfileStore │      │   ProcessState       │      │ProcessExport │  │
│   │  (Zustand)       │─────►│   (En memoria)       │─────►│   JSON       │  │
│   │                  │      │                      │      │              │  │
│   │  • name          │      │  • author: {          │      │  "author": { │  │
│   │  • avatarId      │      │    name,             │      │    "name":   │  │
│   │  • isCustom      │      │    avatarId,         │      │    "avatar", │  │
│   └──────────────────┘      │    isCustom,         │      │    "isCustom"│  │
│                               │    capturedAt        │      │  }           │  │
│                               │  }                   │      │              │  │
│                               └──────────────────────┘      └──────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE IMPORTACIÓN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐      ┌──────────────────────┐      ┌──────────────────┐ │
│   │ProcessExport   │      │   ProcessState       │      │  UserProfileStore │ │
│   │   JSON         │─────►│   (En memoria)       │      │  (Opcional)      │ │
│   │                │      │                      │      │                  │ │
│   │"author": {     │      │  • author: {          │      │  • Sugerencia:   │ │
│   │  "name":       │      │    name,             │      │    "¿Usar este   │ │
│   │  "avatar",     │      │    avatarId,         │      │     autor?"      │ │
│   │  ...           │      │    ...               │      │                  │ │
│   │}               │      │  }                   │      │  • Si acepta:    │ │
│   └──────────────┘      └──────────────────────┘      │    actualizar    │ │
│                                                        │    store           │ │
│                                                        └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Files

### New Files (4)

| File | Purpose |
|------|---------|
| `nextjs_space/lib/user-profile-store.ts` | Zustand store with superhero avatars and persistence |
| `nextjs_space/components/user-avatar.tsx` | Header avatar component with popover trigger |
| `nextjs_space/components/user-profile-popover.tsx` | Floating form to edit profile and select hero |
| `nextjs_space/components/marvel-avatars.ts` | SVG definitions for 10 Marvel heroes |

### Modified Files (4)

| File | Changes |
|------|---------|
| `nextjs_space/lib/types.ts` | Add `ProcessAuthor` interface, extend `ProcessState` and `ProcessExportJSON` |
| `nextjs_space/lib/store.ts` | Capture author when loading new process |
| `nextjs_space/lib/json-utils.ts` | Include author in export, preserve on import, add import dialog |
| `nextjs_space/lib/word-generator.ts` | Add author section to Word document |

## Technical Specifications

### 1. User Profile Store Schema

```typescript
interface UserProfile {
  name: string;           // Hero name or custom name
  avatarId: string;       // 'iron-man', 'spider-man', etc.
  isCustom: boolean;      // false = random hero, true = user entered
}

interface UserProfileStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  getRandomHero: () => UserProfile;  // Generate random Marvel hero
  generateRandomName: () => UserProfile; // Alias for getRandomHero
}

const MARVEL_HEROES = [
  { id: 'iron-man', name: 'Iron Man' },
  { id: 'spider-man', name: 'Spider-Man' },
  { id: 'captain-america', name: 'Capitán América' },
  { id: 'thor', name: 'Thor' },
  { id: 'hulk', name: 'Hulk' },
  { id: 'black-widow', name: 'Black Widow' },
  { id: 'doctor-strange', name: 'Doctor Strange' },
  { id: 'black-panther', name: 'Black Panther' },
  { id: 'captain-marvel', name: 'Capitana Marvel' },
  { id: 'wolverine', name: 'Wolverine' },
];
```

### 2. Process Author Schema

```typescript
export interface ProcessAuthor {
  name: string;           // Name at moment of process creation
  avatarId: string;       // Hero ID
  isCustom: boolean;      // true = custom name, false = hero default
  capturedAt: string;     // ISO timestamp
}

// Extended types
export interface ProcessState {
  // ... existing fields ...
  author?: ProcessAuthor;  // Captured when process is loaded
}

export interface ProcessExportJSON {
  process: {
    // ... existing fields ...
    author?: ProcessAuthor;  // Included in export
    phases: PhaseExport[];
  };
}
```

### 3. Export Flow

```typescript
// lib/json-utils.ts - exportProcessToJSON
export async function exportProcessToJSON(
  process: ProcessState,
  userProfile?: UserProfile
): Promise<ProcessExportJSON> {
  const exportData: ProcessExportJSON = {
    process: {
      // ... existing fields ...
      author: process.author || (userProfile ? {
        name: userProfile.name,
        avatarId: userProfile.avatarId,
        isCustom: userProfile.isCustom,
        capturedAt: new Date().toISOString()
      } : undefined),
      phases: await Promise.all(/* ... */)
    }
  };
  return exportData;
}
```

### 4. Import Flow with Author Handling

```typescript
// lib/json-utils.ts - importProcessFromJSON
export function importProcessFromJSON(
  jsonData: ProcessExportJSON,
  currentUserProfile?: UserProfile
): ProcessState {
  const { process } = jsonData;
  
  const processState: ProcessState = {
    // ... existing fields ...
    author: process.author || undefined,  // Preserve original author
    phases: process.phases.map(/* ... */)
  };

  return processState;
}

// Import dialog shown when author exists:
// "Este proceso fue ejecutado por: 🦸 Iron Man
//  [Mantener autor] [Usar mi perfil] [Nuevo nombre]"
```

### 5. Capture Author on Process Load

```typescript
// lib/store.ts - loadProcess
loadProcess: (process) => {
  const updated = updateTaskBlockedStatus(updateProgress(process));
  
  // Capture current user profile as author
  const userProfile = useUserProfileStore.getState().profile;
  if (userProfile) {
    updated.author = {
      name: userProfile.name,
      avatarId: userProfile.avatarId,
      isCustom: userProfile.isCustom,
      capturedAt: new Date().toISOString()
    };
  }
  
  set({ process: updated, /* ... */ });
}
```

### 6. Word Document Integration

```typescript
// lib/word-generator.ts
if (process.author) {
  sections.push(
    new Paragraph({
      text: 'Información del Ejecutor',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Nombre: ', bold: true }),
        new TextRun(process.author.name),
        new TextRun({ 
          text: process.author.isCustom ? '' : ' (asignado automáticamente)', 
          italics: true,
          color: '666666'
        })
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Fecha de registro: ', bold: true }),
        new TextRun(new Date(process.author.capturedAt).toLocaleString('es-ES'))
      ]
    })
  );
}
```

## UI Components

### UserAvatar (Header)

```tsx
// Position: Top-right corner of app header
// Trigger: Click opens UserProfilePopover
// Display: Circular SVG avatar with hero icon
// Badge: Small indicator if using random hero (optional)
```

### UserProfilePopover (Floating Form)

```
┌─────────────────────────────┐
│  🦸 [Large Avatar]          │
│                             │
│  Tu nombre:                 │
│  ┌─────────────────────┐   │
│  │ Iron Man            │   │
│  └─────────────────────┘   │
│                             │
│  [🎲 Aleatorio] [Guardar]   │
│                             │
│  ✨ Seleccionar avatar:     │
│  [🕷️] [🛡️] [⚡] [🔨] [👁️]  │
└─────────────────────────────┘
```

## Edge Cases & Behavior

| Scenario | Behavior |
|----------|----------|
| No profile set | Use random hero on first process load |
| Legacy JSON (no author) | Import without author, show "Unknown" badge |
| User changes profile mid-process | Author stays as captured at process start (snapshot) |
| Export without author | Field omitted from JSON |
| Import with author exists | Show dialog: Keep / Use mine / New name |
| Anonymous mode allowed | Profile is optional, can work without it |

## Dependencies

- `zustand` ✓ (already installed)
- `immer` ✓ (already installed)
- `lucide-react` ✓ (already installed - for dice icon)
- `shadcn/ui` ✓ (already installed - Popover, Button, Input)
- SVG avatars: Inline definitions (no external deps)

## Testing Strategy

1. **Unit Tests**: Store actions (setProfile, getRandomHero)
2. **Integration**: Export/import JSON with author roundtrip
3. **E2E**: Create process → Change profile → Export → Import → Verify author preserved

## Estimated Effort

- **Implementation**: 4-5 hours
- **Testing**: 2 hours
- **Total**: 6-7 hours

## Future Enhancements

- [ ] Custom avatar upload
- [ ] More hero sets (DC Comics, Star Wars, etc.)
- [ ] Author statistics dashboard
- [ ] Multi-user collaboration (assign different authors to tasks)
