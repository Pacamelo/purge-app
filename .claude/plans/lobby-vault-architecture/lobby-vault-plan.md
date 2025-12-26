# Lobby & Vault Architecture Plan

**Last Updated:** 2025-12-26
**Status:** Ready for Implementation
**Effort Estimate:** Medium (14 component groups to migrate, 6 new files to create)

---

## Executive Summary

Restructure the PURGE application into two distinct sections to improve code organization, user experience, and maintainability:

- **Lobby** - The entry experience: offline verification gates, trust warnings, and file intake
- **Vault** - The processing workspace: TrustPanel, scanning, preview, redaction, and output

This separation creates a clear mental model for users ("enter" a secure space, then "work" on files) and cleaner code architecture with separation of concerns.

---

## Current State Analysis

### Architecture
The application currently uses a monolithic `PurgeModule.tsx` (729 lines) that handles all states and renders all components based on a single state machine. This creates:

- **Coupling**: Gate logic (offline checks) mixed with processing logic
- **Complexity**: Large switch statements determining what to render
- **Testing difficulty**: Hard to test sections in isolation

### Component Structure
```
src/
├── PurgeModule.tsx       # Monolithic - handles ALL states
├── components/
│   ├── OfflineGate.tsx   # Gate components
│   ├── FeedSlot/         # File intake
│   ├── Preview/          # Processing
│   ├── TrustPanel/       # Always visible (currently)
│   └── ...40+ components
└── core/
    ├── hooks/            # Business logic
    └── store/            # Zustand state
```

### State Machine
Current states managed by `usePurgeStore`:
- `idle`, `loaded` - Pre-processing
- `column_select`, `scanning`, `preview`, `shredding`, `complete`, `jammed` - Processing
- Plus offline enforcement states from `useOfflineEnforcement`

---

## Proposed Future State

### Architecture
```
src/
├── sections/
│   ├── SectionRouter.tsx     # Orchestrates sections
│   ├── types.ts              # Shared interfaces
│   ├── Lobby/
│   │   ├── index.tsx         # Lobby container
│   │   ├── LobbyLayout.tsx   # Centered single-column
│   │   └── components/       # Gate, FeedSlot, etc.
│   └── Vault/
│       ├── index.tsx         # Vault container
│       ├── VaultLayout.tsx   # Two-column layout
│       └── components/       # TrustPanel, Preview, etc.
├── components/               # Shared primitives only
├── core/                     # Unchanged - hooks, store, services
└── pages/                    # Unchanged - Landing page
```

### Section Ownership

| Section | States | Components | Layout |
|---------|--------|------------|--------|
| **Lobby** | `idle`, `loaded`, `online_blocked`, `offline_ready`, `online_acknowledged`, `sw_blocked`, `quota_exhausted`, `reconnected_abort` | OfflineGate, FeedSlot, SCAN button | Centered, single-column, clean gradient |
| **Vault** | `column_select`, `scanning`, `preview`, `shredding`, `complete`, `jammed` | TrustPanel, ColumnSelector, Preview, Processing, Output | Two-column (270px sidebar + main) |

### Transition Logic
```
Lobby → Vault: User clicks SCAN button (state: loaded → scanning)
Vault → Lobby: User clicks NEW SHRED, or reconnected_abort occurs
```

---

## Implementation Phases

### Phase 1: Foundation [Effort: S]
**Goal:** Create directory structure and section router

**Deliverables:**
1. `src/sections/types.ts` - Section prop interfaces
2. `src/sections/SectionRouter.tsx` - Determines active section based on state
3. `src/sections/Lobby/index.tsx` - Empty shell container
4. `src/sections/Vault/index.tsx` - Empty shell container

**Acceptance Criteria:**
- [ ] Directory structure matches proposed architecture
- [ ] SectionRouter compiles and can switch between empty Lobby/Vault shells
- [ ] TypeScript interfaces defined for section props

### Phase 2: Lobby Section [Effort: M]
**Goal:** Build the complete entry/gate experience

**File Migrations:**
| From | To |
|------|-----|
| `src/components/OfflineBlockedState.tsx` | `src/sections/Lobby/components/` |
| `src/components/OfflineGate.tsx` | `src/sections/Lobby/components/` |
| `src/components/OnlineTrustWarning.tsx` | `src/sections/Lobby/components/` |
| `src/components/ReconnectedAbort.tsx` | `src/sections/Lobby/components/` |
| `src/components/ForceCloseCountdown.tsx` | `src/sections/Lobby/components/` |
| `src/components/FeedSlot/` | `src/sections/Lobby/components/FeedSlot/` |

**Deliverables:**
1. `LobbyLayout.tsx` - Centered single-column container
2. Migrated gate components with updated imports
3. Migrated FeedSlot components
4. Lobby logic extracted from PurgeModule
5. SCAN button that triggers Vault transition

**Acceptance Criteria:**
- [ ] Lobby renders correctly for all gate states
- [ ] File drop works and transitions to `loaded` state
- [ ] SCAN button visible when files loaded
- [ ] All offline enforcement states handled

### Phase 3: Vault Section [Effort: M]
**Goal:** Build the complete processing workspace

**File Migrations:**
| From | To |
|------|-----|
| `src/components/Preview/` | `src/sections/Vault/components/Preview/` |
| `src/components/Processing/` | `src/sections/Vault/components/Processing/` |
| `src/components/Output/` | `src/sections/Vault/components/Output/` |
| `src/components/Configuration/` | `src/sections/Vault/components/Configuration/` |
| `src/components/ColumnSelector/` | `src/sections/Vault/components/ColumnSelector/` |
| `src/components/TrustPanel/` | `src/sections/Vault/components/TrustPanel/` |
| `src/components/ControlPanel/` | `src/sections/Vault/components/ControlPanel/` |
| `src/components/AdversarialFeedback/` | `src/sections/Vault/components/AdversarialFeedback/` |

**Deliverables:**
1. `VaultLayout.tsx` - Two-column layout (TrustPanel + Main)
2. Migrated TrustPanel with all sub-components
3. Migrated Preview, Processing, Output, Configuration
4. Vault logic extracted from PurgeModule
5. NEW SHRED button that returns to Lobby

**Acceptance Criteria:**
- [ ] Vault renders two-column layout correctly
- [ ] TrustPanel only visible in Vault
- [ ] All processing states render correctly
- [ ] NEW SHRED button resets and returns to Lobby

### Phase 4: Integration [Effort: M]
**Goal:** Connect sections and refactor PurgeModule

**Deliverables:**
1. Refactored `PurgeModule.tsx` using SectionRouter
2. Updated import paths throughout codebase
3. Verified state transitions work

**Acceptance Criteria:**
- [ ] Lobby → Vault transition works (SCAN click)
- [ ] Vault → Lobby transition works (NEW SHRED, reconnected_abort)
- [ ] Zustand store works across both sections
- [ ] Offline enforcement integrates correctly
- [ ] Build passes with no errors

### Phase 5: Cleanup [Effort: S]
**Goal:** Remove old files and verify

**Deliverables:**
1. Removed empty/unused files from old locations
2. Updated barrel exports if any
3. Verified all user flows

**Acceptance Criteria:**
- [ ] No orphaned files in `src/components/`
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` succeeds
- [ ] All user flows work end-to-end

---

## Risk Assessment and Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Import path breaks | High | Medium | Run build after each phase, fix incrementally |
| State sync issues between sections | Medium | High | Keep Zustand store unchanged, test transitions thoroughly |
| Missing component after migration | Low | Low | Glob for old import paths after migration |
| Offline enforcement breaks | Medium | High | Test offline flow in Phase 4 before cleanup |
| TrustPanel props mismatch | Medium | Medium | Verify all props passed correctly in VaultLayout |

---

## Success Metrics

1. **Code Organization**: Clear separation - Lobby components in `sections/Lobby/`, Vault in `sections/Vault/`
2. **Build Success**: `npm run build` and `npm run typecheck` pass with no errors
3. **User Flows**: All existing functionality preserved:
   - Landing → App → Offline gate → File drop → SCAN → Preview → Shred → Download
   - Online bypass flow works
   - Reconnection abort works
4. **UX Improvement**: TrustPanel only visible during processing (cleaner Lobby)
5. **Maintainability**: Each section can be modified independently

---

## Required Resources and Dependencies

### Files to Create (6)
- `src/sections/types.ts`
- `src/sections/SectionRouter.tsx`
- `src/sections/Lobby/index.tsx`
- `src/sections/Lobby/LobbyLayout.tsx`
- `src/sections/Vault/index.tsx`
- `src/sections/Vault/VaultLayout.tsx`

### Files to Move (14 component groups)
See Phase 2 and Phase 3 tables above

### Files to Modify (2)
- `src/PurgeModule.tsx` - Replace with SectionRouter
- `src/App.tsx` - Minor updates if needed

### Files to Keep Unchanged
- `src/core/` - All hooks, store, services
- `src/pages/Landing.tsx` - Separate marketing page
- `src/components/ShredderHousing.tsx` - Shared visual primitive
- `src/components/PurgeErrorBoundary.tsx` - App-level error boundary

### No New Dependencies Required
This is a pure refactoring effort using existing tech stack:
- React 18.2
- TypeScript 5.2
- Zustand 4.4.7
- Tailwind CSS 3.3.5