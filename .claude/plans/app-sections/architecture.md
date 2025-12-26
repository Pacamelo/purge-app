# UI Architecture: Lobby & Vault Sections

**Last Updated:** 2025-12-26
**Status:** Approved - Ready for Implementation

---

## Overview

The PURGE app is restructured into two distinct sections:

| Section | Purpose | States |
|---------|---------|--------|
| **Lobby** | Entry gate, offline verification, file intake | `idle`, `loaded`, gate states |
| **Vault** | Processing workspace with TrustPanel | `scanning`, `preview`, `shredding`, `complete` |

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Section names | **Lobby** & **Vault** |
| TrustPanel visibility | **Vault only** - Lobby stays clean/minimal |
| `loaded` state ownership | **Lobby** - SCAN button triggers Vault entry |
| Landing page | **Separate** - stays in `/pages/`, not part of sections |
| Implementation approach | **Full rewrite** with `src/sections/` directory |

---

## Section Definitions

### Lobby Section

**Purpose:** Gate user entry, verify security posture, receive files

**States:**
- `idle` - Waiting for files
- `loaded` - Files ready, SCAN button visible
- `online_blocked` - Must go offline
- `offline_ready` - Can proceed
- `online_acknowledged` - User accepted online risk
- `sw_blocked` - Service workers detected
- `quota_exhausted` - Must go online
- `reconnected_abort` - Connection detected mid-process

**Components:**
- OfflineBlockedState, OfflineGate, OnlineTrustWarning
- ReconnectedAbort, ForceCloseCountdown
- FeedSlot, DocumentCard
- SCAN button

**Layout:** Centered single-column, clean gradient background

### Vault Section

**Purpose:** Active file processing from scan through download

**States:**
- `column_select` - XLSX column picker
- `scanning` - Detection in progress
- `preview` - Review detections
- `shredding` - Redaction in progress
- `complete` - Download ready
- `jammed` - Error recovery

**Components:**
- TrustPanel (left sidebar)
- ColumnSelector, DetectionPreview, ShredAnimation, OutputBin
- Processing indicators, error states

**Layout:** Two-column (TrustPanel 270px + Main content)

---

## Transition Logic

```
Lobby → Vault: User clicks SCAN (state changes from `loaded` to `scanning`)
Vault → Lobby: User clicks NEW SHRED, or reconnected_abort occurs
```

---

## Directory Structure

```
src/sections/
├── index.ts              # Re-exports
├── types.ts              # Section interfaces
├── SectionRouter.tsx     # Determines active section
├── Lobby/
│   ├── index.tsx         # Lobby container
│   ├── LobbyLayout.tsx   # Centered layout
│   └── components/       # Gate, FeedSlot, etc.
└── Vault/
    ├── index.tsx         # Vault container
    ├── VaultLayout.tsx   # Two-column layout
    └── components/       # TrustPanel, Preview, etc.
```

---

## Related Documentation

- [Detailed Plan](../lobby-vault-architecture/lobby-vault-plan.md)
- [Context & Key Files](../lobby-vault-architecture/lobby-vault-context.md)
- [Task Checklist](../lobby-vault-architecture/lobby-vault-tasks.md)