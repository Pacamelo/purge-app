# Lobby & Vault Architecture - Task Checklist

**Last Updated:** 2025-12-26
**Status:** Not Started

---

## Phase 1: Foundation [Effort: S]

### 1.1 Create Directory Structure
- [ ] Create `src/sections/` directory
- [ ] Create `src/sections/Lobby/` directory
- [ ] Create `src/sections/Lobby/components/` directory
- [ ] Create `src/sections/Vault/` directory
- [ ] Create `src/sections/Vault/components/` directory

### 1.2 Create Section Types
- [ ] Create `src/sections/types.ts`
- [ ] Define `SectionProps` interface
- [ ] Define `LobbyProps` interface
- [ ] Define `VaultProps` interface
- [ ] Export all types

### 1.3 Create Section Router
- [ ] Create `src/sections/SectionRouter.tsx`
- [ ] Import `usePurgeStore` for state
- [ ] Import `useOfflineEnforcement` for status
- [ ] Implement section determination logic
- [ ] Render Lobby or Vault based on state
- [ ] Wrap with error boundary

### 1.4 Create Section Shells
- [ ] Create `src/sections/Lobby/index.tsx` (empty shell)
- [ ] Create `src/sections/Vault/index.tsx` (empty shell)
- [ ] Verify SectionRouter switches between them
- [ ] Run `npm run typecheck` - should pass

**Phase 1 Complete Criteria:**
- [ ] All directories exist
- [ ] TypeScript compiles without errors
- [ ] SectionRouter renders correct shell based on state

---

## Phase 2: Lobby Section [Effort: M]

### 2.1 Create Lobby Layout
- [ ] Create `src/sections/Lobby/LobbyLayout.tsx`
- [ ] Implement centered single-column container
- [ ] Add gradient background styling
- [ ] Add header with PURGE branding
- [ ] Implement children slot for content

### 2.2 Migrate Gate Components
- [ ] Move `OfflineBlockedState.tsx` to `Lobby/components/`
- [ ] Update imports in moved file
- [ ] Move `OfflineGate.tsx` to `Lobby/components/`
- [ ] Update imports in moved file
- [ ] Move `OnlineTrustWarning.tsx` to `Lobby/components/`
- [ ] Update imports in moved file
- [ ] Move `ReconnectedAbort.tsx` to `Lobby/components/`
- [ ] Update imports in moved file
- [ ] Move `ForceCloseCountdown.tsx` to `Lobby/components/`
- [ ] Update imports in moved file

### 2.3 Migrate FeedSlot Components
- [ ] Create `Lobby/components/FeedSlot/` directory
- [ ] Move `FeedSlot.tsx` to `Lobby/components/FeedSlot/`
- [ ] Update imports in moved file
- [ ] Move `DocumentCard.tsx` to `Lobby/components/FeedSlot/`
- [ ] Update imports in moved file

### 2.4 Implement Lobby Logic
- [ ] Extract idle/loaded state handling from PurgeModule
- [ ] Implement `handleFilesDropped` in Lobby
- [ ] Implement file hash tracking
- [ ] Implement XLSX metadata extraction trigger
- [ ] Add SCAN button component
- [ ] Wire SCAN button to trigger Vault transition
- [ ] Handle offline enforcement gate states

### 2.5 Wire Up Lobby Container
- [ ] Update `Lobby/index.tsx` to use LobbyLayout
- [ ] Import and render gate components conditionally
- [ ] Import and render FeedSlot
- [ ] Import and render SCAN button when loaded
- [ ] Connect to usePurgeStore
- [ ] Connect to useOfflineEnforcement
- [ ] Run `npm run typecheck` - should pass

**Phase 2 Complete Criteria:**
- [ ] Lobby renders for idle, loaded, and gate states
- [ ] File drop works correctly
- [ ] SCAN button appears when files loaded
- [ ] Gate overlays work (offline blocked, sw blocked, etc.)
- [ ] TypeScript compiles without errors

---

## Phase 3: Vault Section [Effort: M]

### 3.1 Create Vault Layout
- [ ] Create `src/sections/Vault/VaultLayout.tsx`
- [ ] Implement two-column layout (sidebar + main)
- [ ] TrustPanel slot (270px fixed width)
- [ ] Main content slot (flexible)
- [ ] Add online mode warning banner support
- [ ] Add header with NEW SHRED button

### 3.2 Migrate TrustPanel Components
- [ ] Create `Vault/components/TrustPanel/` directory
- [ ] Move entire TrustPanel directory contents
- [ ] Update all imports in moved files:
  - [ ] TrustPanel.tsx
  - [ ] SecurityDisclaimer.tsx
  - [ ] NetworkMonitor.tsx
  - [ ] NetworkProof.tsx
  - [ ] StorageProof.tsx
  - [ ] BeforeAfterDiff.tsx
  - [ ] AirplaneModeChallenge.tsx
  - [ ] MemoryBurnout.tsx
  - [ ] EntropyHeatMap.tsx
  - [ ] EntropyLegend.tsx
  - [ ] CanvasErrorBoundary.tsx
  - [ ] ColumnAccessMinimap.tsx
  - [ ] QRCertificate.tsx
  - [ ] SessionSummaryExport.tsx
  - [ ] ByteCounter.tsx
  - [ ] DevToolsGuide.tsx
  - [ ] SourceCodeLink.tsx

### 3.3 Migrate Preview Components
- [ ] Create `Vault/components/Preview/` directory
- [ ] Move `DetectionPreview.tsx`
- [ ] Update imports
- [ ] Move `DetectionList.tsx`
- [ ] Update imports

### 3.4 Migrate Processing Components
- [ ] Create `Vault/components/Processing/` directory
- [ ] Move `ShredAnimation.tsx`
- [ ] Update imports
- [ ] Move `ProgressMeter.tsx`
- [ ] Update imports
- [ ] Move `PaperStrips.tsx`
- [ ] Update imports

### 3.5 Migrate Output Components
- [ ] Create `Vault/components/Output/` directory
- [ ] Move `OutputBin.tsx`
- [ ] Update imports

### 3.6 Migrate Configuration Components
- [ ] Create `Vault/components/Configuration/` directory
- [ ] Move `ScrubConfig.tsx`
- [ ] Move `CategorySwitch.tsx`
- [ ] Move `StyleSelector.tsx`
- [ ] Move `ValidationRulesHelp.tsx`
- [ ] Update all imports

### 3.7 Migrate ColumnSelector Components
- [ ] Create `Vault/components/ColumnSelector/` directory
- [ ] Move `ColumnSelector.tsx`
- [ ] Update imports

### 3.8 Migrate ControlPanel Components
- [ ] Create `Vault/components/ControlPanel/` directory
- [ ] Move `ControlPanel.tsx`
- [ ] Move `LEDIndicator.tsx`
- [ ] Move `DigitalCounter.tsx`
- [ ] Update all imports

### 3.9 Migrate AdversarialFeedback Components
- [ ] Create `Vault/components/AdversarialFeedback/` directory
- [ ] Move `AdversarialFeedback.tsx`
- [ ] Update imports

### 3.10 Implement Vault Logic
- [ ] Extract processing state handling from PurgeModule
- [ ] Implement `handleStartScan` (or receive from Lobby)
- [ ] Implement `handleRescan`
- [ ] Implement `handleProceedToShred`
- [ ] Implement `handleDownload` / `handleDownloadAll`
- [ ] Implement `handleReset` (NEW SHRED)
- [ ] Implement `handleClearJam`
- [ ] Wire up all processing hooks

### 3.11 Wire Up Vault Container
- [ ] Update `Vault/index.tsx` to use VaultLayout
- [ ] Render TrustPanel in sidebar slot
- [ ] Implement state-based main content rendering
- [ ] Connect to usePurgeStore
- [ ] Connect to useOfflineEnforcement
- [ ] Connect to useDocumentProcessor
- [ ] Connect to trust panel hooks
- [ ] Run `npm run typecheck` - should pass

**Phase 3 Complete Criteria:**
- [ ] Vault renders two-column layout
- [ ] TrustPanel visible and functional
- [ ] All processing states render correctly
- [ ] Scanning → Preview → Shredding → Complete flow works
- [ ] TypeScript compiles without errors

---

## Phase 4: Integration [Effort: M]

### 4.1 Refactor PurgeModule
- [ ] Replace PurgeModule contents with SectionRouter
- [ ] Keep PurgeErrorBoundary wrapper
- [ ] Remove all component imports (now in sections)
- [ ] Remove all state handling logic (now in sections)
- [ ] Verify file is significantly smaller

### 4.2 Update Import Paths
- [ ] Search for old import paths: `@/components/OfflineBlockedState`
- [ ] Search for old import paths: `@/components/OfflineGate`
- [ ] Search for old import paths: `@/components/FeedSlot`
- [ ] Search for old import paths: `@/components/Preview`
- [ ] Search for old import paths: `@/components/TrustPanel`
- [ ] Search for old import paths: `@/components/Processing`
- [ ] Search for old import paths: `@/components/Output`
- [ ] Search for old import paths: `@/components/Configuration`
- [ ] Search for old import paths: `@/components/ColumnSelector`
- [ ] Search for old import paths: `@/components/ControlPanel`
- [ ] Search for old import paths: `@/components/AdversarialFeedback`
- [ ] Update any remaining references

### 4.3 Test Transitions
- [ ] Test: App loads in Lobby (idle state)
- [ ] Test: Going offline transitions to offline_ready
- [ ] Test: Dropping files transitions to loaded
- [ ] Test: SCAN click transitions to Vault (scanning)
- [ ] Test: Scanning completes → preview state
- [ ] Test: Proceed click → shredding state
- [ ] Test: Shredding completes → complete state
- [ ] Test: Download works correctly
- [ ] Test: NEW SHRED returns to Lobby
- [ ] Test: Online bypass flow works
- [ ] Test: Reconnection abort works

### 4.4 Verify Build
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Fix any errors

**Phase 4 Complete Criteria:**
- [ ] PurgeModule uses SectionRouter
- [ ] All imports updated
- [ ] All transitions work correctly
- [ ] Build passes

---

## Phase 5: Cleanup [Effort: S]

### 5.1 Remove Old Files
- [ ] Delete `src/components/OfflineBlockedState.tsx` (if empty/moved)
- [ ] Delete `src/components/OfflineGate.tsx` (if empty/moved)
- [ ] Delete `src/components/OnlineTrustWarning.tsx` (if empty/moved)
- [ ] Delete `src/components/ReconnectedAbort.tsx` (if empty/moved)
- [ ] Delete `src/components/ForceCloseCountdown.tsx` (if empty/moved)
- [ ] Delete `src/components/FeedSlot/` directory (if empty/moved)
- [ ] Delete `src/components/Preview/` directory (if empty/moved)
- [ ] Delete `src/components/Processing/` directory (if empty/moved)
- [ ] Delete `src/components/Output/` directory (if empty/moved)
- [ ] Delete `src/components/Configuration/` directory (if empty/moved)
- [ ] Delete `src/components/ColumnSelector/` directory (if empty/moved)
- [ ] Delete `src/components/TrustPanel/` directory (if empty/moved)
- [ ] Delete `src/components/ControlPanel/` directory (if empty/moved)
- [ ] Delete `src/components/AdversarialFeedback/` directory (if empty/moved)

### 5.2 Verify No Orphaned References
- [ ] Grep for any remaining old paths
- [ ] Fix any found references
- [ ] Run `npm run build` again

### 5.3 Final Testing
- [ ] Test complete user flow: Landing → App → Offline → Drop → Scan → Preview → Shred → Download
- [ ] Test online bypass flow
- [ ] Test reconnection scenarios
- [ ] Test error/jam recovery
- [ ] Test NEW SHRED reset

**Phase 5 Complete Criteria:**
- [ ] No orphaned files in old locations
- [ ] No broken imports
- [ ] All user flows work
- [ ] Build passes
- [ ] Ready for deployment

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Foundation | 4 sections, ~15 tasks | Not Started |
| Phase 2: Lobby | 5 sections, ~25 tasks | Not Started |
| Phase 3: Vault | 11 sections, ~50 tasks | Not Started |
| Phase 4: Integration | 4 sections, ~20 tasks | Not Started |
| Phase 5: Cleanup | 3 sections, ~20 tasks | Not Started |
| **Total** | **~130 tasks** | **Not Started** |

---

## Quick Reference

### Commands to Verify
```bash
# Type checking
npm run typecheck

# Full build
npm run build

# Dev server
npm run dev
```

### Key Files After Completion
```
src/
├── sections/
│   ├── index.ts
│   ├── types.ts
│   ├── SectionRouter.tsx
│   ├── Lobby/
│   │   ├── index.tsx
│   │   ├── LobbyLayout.tsx
│   │   └── components/
│   │       ├── OfflineBlockedState.tsx
│   │       ├── OfflineGate.tsx
│   │       ├── OnlineTrustWarning.tsx
│   │       ├── ReconnectedAbort.tsx
│   │       ├── ForceCloseCountdown.tsx
│   │       └── FeedSlot/
│   └── Vault/
│       ├── index.tsx
│       ├── VaultLayout.tsx
│       └── components/
│           ├── TrustPanel/
│           ├── Preview/
│           ├── Processing/
│           ├── Output/
│           ├── Configuration/
│           ├── ColumnSelector/
│           ├── ControlPanel/
│           └── AdversarialFeedback/
├── components/           # Shared only
│   ├── ShredderHousing.tsx
│   └── PurgeErrorBoundary.tsx
├── core/                 # Unchanged
└── pages/                # Unchanged
```