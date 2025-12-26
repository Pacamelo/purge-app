# Lobby & Vault Architecture - Context Document

**Last Updated:** 2025-12-26

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Section names | **Lobby** & **Vault** | Clear metaphor - enter secure space, then work |
| TrustPanel visibility | **Vault only** | Keeps Lobby clean/minimal, progressive disclosure |
| `loaded` state ownership | **Lobby** | SCAN button in Lobby triggers Vault entry |
| Landing page | **Separate concern** | Stays in `/pages/`, not part of sections |
| Implementation approach | **Full rewrite** | Cleanest architecture long-term |

---

## Critical Files Reference

### Files to Create

| File | Purpose | Dependencies |
|------|---------|--------------|
| `src/sections/types.ts` | TypeScript interfaces for section props | None |
| `src/sections/SectionRouter.tsx` | Routes to Lobby or Vault based on state | `usePurgeStore`, `useOfflineEnforcement` |
| `src/sections/Lobby/index.tsx` | Lobby section container | `LobbyLayout`, gate components |
| `src/sections/Lobby/LobbyLayout.tsx` | Centered single-column layout | Tailwind |
| `src/sections/Vault/index.tsx` | Vault section container | `VaultLayout`, processing components |
| `src/sections/Vault/VaultLayout.tsx` | Two-column layout (sidebar + main) | Tailwind |

### Files to Migrate - Lobby

| Current Path | New Path |
|--------------|----------|
| `src/components/OfflineBlockedState.tsx` | `src/sections/Lobby/components/OfflineBlockedState.tsx` |
| `src/components/OfflineGate.tsx` | `src/sections/Lobby/components/OfflineGate.tsx` |
| `src/components/OnlineTrustWarning.tsx` | `src/sections/Lobby/components/OnlineTrustWarning.tsx` |
| `src/components/ReconnectedAbort.tsx` | `src/sections/Lobby/components/ReconnectedAbort.tsx` |
| `src/components/ForceCloseCountdown.tsx` | `src/sections/Lobby/components/ForceCloseCountdown.tsx` |
| `src/components/FeedSlot/FeedSlot.tsx` | `src/sections/Lobby/components/FeedSlot/FeedSlot.tsx` |
| `src/components/FeedSlot/DocumentCard.tsx` | `src/sections/Lobby/components/FeedSlot/DocumentCard.tsx` |

### Files to Migrate - Vault

| Current Path | New Path |
|--------------|----------|
| `src/components/Preview/DetectionPreview.tsx` | `src/sections/Vault/components/Preview/DetectionPreview.tsx` |
| `src/components/Preview/DetectionList.tsx` | `src/sections/Vault/components/Preview/DetectionList.tsx` |
| `src/components/Processing/ShredAnimation.tsx` | `src/sections/Vault/components/Processing/ShredAnimation.tsx` |
| `src/components/Processing/ProgressMeter.tsx` | `src/sections/Vault/components/Processing/ProgressMeter.tsx` |
| `src/components/Processing/PaperStrips.tsx` | `src/sections/Vault/components/Processing/PaperStrips.tsx` |
| `src/components/Output/OutputBin.tsx` | `src/sections/Vault/components/Output/OutputBin.tsx` |
| `src/components/Configuration/ScrubConfig.tsx` | `src/sections/Vault/components/Configuration/ScrubConfig.tsx` |
| `src/components/Configuration/CategorySwitch.tsx` | `src/sections/Vault/components/Configuration/CategorySwitch.tsx` |
| `src/components/Configuration/StyleSelector.tsx` | `src/sections/Vault/components/Configuration/StyleSelector.tsx` |
| `src/components/Configuration/ValidationRulesHelp.tsx` | `src/sections/Vault/components/Configuration/ValidationRulesHelp.tsx` |
| `src/components/ColumnSelector/ColumnSelector.tsx` | `src/sections/Vault/components/ColumnSelector/ColumnSelector.tsx` |
| `src/components/TrustPanel/` (entire directory) | `src/sections/Vault/components/TrustPanel/` |
| `src/components/ControlPanel/` (entire directory) | `src/sections/Vault/components/ControlPanel/` |
| `src/components/AdversarialFeedback/` (entire directory) | `src/sections/Vault/components/AdversarialFeedback/` |

### Files to Keep in Place (Shared)

| File | Reason |
|------|--------|
| `src/core/` | All hooks, store, services - used by both sections |
| `src/pages/Landing.tsx` | Separate marketing page, not part of app sections |
| `src/components/ShredderHousing.tsx` | Shared visual primitive used in Vault |
| `src/components/PurgeErrorBoundary.tsx` | App-level error boundary wraps everything |

### Files to Heavily Modify

| File | Changes |
|------|---------|
| `src/PurgeModule.tsx` | Replace 700+ lines with simple SectionRouter wrapper |

---

## State Machine Mapping

### Store States (`usePurgeStore`)

```typescript
type PurgeState =
  | 'idle'           // Lobby - waiting for files
  | 'loaded'         // Lobby - files ready, SCAN button visible
  | 'column_select'  // Vault - XLSX column picker
  | 'scanning'       // Vault - detection in progress
  | 'preview'        // Vault - review detections
  | 'shredding'      // Vault - redaction in progress
  | 'complete'       // Vault - download ready
  | 'jammed';        // Vault - error recovery
```

### Offline Enforcement States (`useOfflineEnforcement`)

```typescript
type OfflineEnforcementStatus =
  | 'online_blocked'       // Lobby gate - must go offline
  | 'online_acknowledged'  // Lobby - user accepted online risk
  | 'offline_ready'        // Lobby - can proceed
  | 'sw_blocked'           // Lobby gate - service workers detected
  | 'quota_exhausted'      // Lobby gate - must go online
  | 'processing'           // Vault - actively processing
  | 'awaiting_download'    // Vault - ready for download
  | 'reconnected_abort'    // Lobby gate - connection detected mid-process
  | 'complete'             // Vault - downloaded
  | 'reconnected_warning'; // Vault overlay - reconnected before download
```

### Section Router Logic

```typescript
// Pseudocode for SectionRouter.tsx
function determineSection(purgeState: PurgeState, offlineStatus: OfflineEnforcementStatus): 'lobby' | 'vault' {
  // Gate states always show Lobby with blocking overlay
  const isGateBlocked = [
    'online_blocked',
    'sw_blocked',
    'quota_exhausted',
    'reconnected_abort'
  ].includes(offlineStatus);

  if (isGateBlocked) return 'lobby';

  // Vault states
  const isVaultState = [
    'column_select',
    'scanning',
    'preview',
    'shredding',
    'complete',
    'jammed'
  ].includes(purgeState);

  return isVaultState ? 'vault' : 'lobby';
}
```

---

## Component Dependencies

### Lobby Section Dependencies

```
Lobby/index.tsx
├── LobbyLayout.tsx
├── components/OfflineGate.tsx
│   ├── OfflineBlockedState.tsx
│   ├── OnlineTrustWarning.tsx (modal)
│   ├── ReconnectedAbort.tsx
│   └── ForceCloseCountdown.tsx
├── components/FeedSlot/
│   ├── FeedSlot.tsx
│   └── DocumentCard.tsx
└── SCAN button (inline)

External dependencies:
- usePurgeStore (state, actions)
- useOfflineEnforcement (gate states)
- useDocumentProcessor (file handling setup)
```

### Vault Section Dependencies

```
Vault/index.tsx
├── VaultLayout.tsx
│   ├── TrustPanel/ (sidebar)
│   │   ├── SecurityDisclaimer.tsx
│   │   ├── NetworkMonitor.tsx
│   │   ├── StorageProof.tsx
│   │   ├── AirplaneModeChallenge.tsx
│   │   ├── MemoryBurnout.tsx
│   │   ├── EntropyHeatMap.tsx
│   │   ├── QRCertificate.tsx
│   │   └── ...more
│   └── MainContent (renders based on state)
│       ├── ColumnSelector/ (column_select)
│       ├── Processing/ShredAnimation (scanning, shredding)
│       ├── Preview/DetectionPreview (preview)
│       └── Output/OutputBin (complete)
├── ControlPanel/
├── Configuration/
└── AdversarialFeedback/

External dependencies:
- usePurgeStore (all state and actions)
- useOfflineEnforcement (canProcess, online warnings)
- useDocumentProcessor (scan, process, wipe)
- useNetworkProof, useStorageProof, useAirplaneMode (TrustPanel)
- useFileHash, useSpreadsheetMetadata (file handling)
```

---

## Import Path Updates

After migration, imports will change:

```typescript
// Before
import { FeedSlot } from '@/components/FeedSlot/FeedSlot';
import { TrustPanel } from '@/components/TrustPanel/TrustPanel';

// After (within sections)
import { FeedSlot } from './components/FeedSlot/FeedSlot';
import { TrustPanel } from './components/TrustPanel/TrustPanel';

// After (cross-section, if needed)
import { FeedSlot } from '@/sections/Lobby/components/FeedSlot/FeedSlot';
```

---

## Hooks Usage by Section

### Lobby Uses
- `usePurgeStore` - state, feedDocuments, removeDocument, setState
- `useOfflineEnforcement` - status, canProcess, acknowledgeOnlineRisk
- `useSpreadsheetMetadata` - extractMetadata (for XLSX column selection trigger)
- `useFileHash` - hashOriginalFile

### Vault Uses
- `usePurgeStore` - all state and actions
- `useOfflineEnforcement` - canProcess, startProcessing, completeProcessing, markDownloaded
- `useDocumentProcessor` - scanFiles, processFiles, wipeMemory, progress, memoryStats
- `useNetworkProof` - requests, isRecording, startRecording, stopRecording
- `useStorageProof` - snapshots, watermark verification
- `useAirplaneMode` - state, challenge controls
- `useFileHash` - hashProcessedBlob
- `useFileEntropy` - entropy calculations (TrustPanel)

---

## Visual Design Notes

### Lobby Visual Character
- **Background**: Clean gradient (trust-building colors)
- **Layout**: Centered, single-column, max-width container
- **Focus**: Large drop zone, clear instructions
- **Elements**: Privacy badges, offline status indicator

### Vault Visual Character
- **Background**: Darker, "serious" processing feel
- **Layout**: Two-column fixed (TrustPanel 270px + flexible main)
- **Focus**: Processing state, technical transparency
- **Elements**: Progress indicators, data visualizations, dense information

### Transition Animation (Future Enhancement)
- Lobby → Vault: Consider slide or fade transition
- Currently: Instant switch is acceptable for MVP

---

## Testing Checklist

### Lobby Tests
- [ ] Renders offline blocked state when online
- [ ] Shows "Proceed Online" bypass option
- [ ] Trust warning modal works
- [ ] Transitions to offline_ready when network disconnected
- [ ] Service worker detection blocks processing
- [ ] Quota exhausted state shows correctly
- [ ] File drop adds files to queue
- [ ] Invalid file types rejected
- [ ] XLSX triggers column selection flow
- [ ] SCAN button visible with loaded files
- [ ] SCAN click transitions to Vault

### Vault Tests
- [ ] Two-column layout renders correctly
- [ ] TrustPanel visible and functional
- [ ] Column selector works for XLSX
- [ ] Scanning state shows progress
- [ ] Preview shows detections correctly
- [ ] Detection selection/deselection works
- [ ] Sensitivity filter works client-side
- [ ] Shredding state shows animation
- [ ] Complete state shows output bin
- [ ] Download triggers correctly
- [ ] NEW SHRED button resets to Lobby
- [ ] Reconnection during processing aborts correctly
- [ ] Online mode warning banner shows when applicable