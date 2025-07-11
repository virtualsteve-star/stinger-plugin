# Stinger Guard Chrome Extension – Technical Design Document

**Version:** 0.1  **Status:** Draft (shareable with dev team)  **Last updated:** 2025‑07‑05

---

## 1  Purpose & Scope

Stinger Guard is a Chrome (MV3‑compatible) extension that monitors and enforces security guardrails for prompts and responses on web‑based LLM SaaS interfaces (e.g., ChatGPT, Microsoft Copilot/Bing Chat). It captures user input before it is transmitted, scans the rendered model output, calls a Stinger microservice for policy evaluation, and applies allow/warn/block actions while logging events for SOC review.

**Primary objectives:**

1. **Prevent sensitive or disallowed content** from being sent to/received from third‑party LLMs.
2. **Provide real‑time user feedback** (warnings, redactions, blocks) with minimal UX impact.
3. **Generate an audit trail** and forward it securely to the enterprise SIEM.
4. **Support central policy management** and silent, force‑installed deployment via Chrome Enterprise policies.

Out‑of‑scope for v0.1: mobile browsers, non‑Chromium browsers, offline mode.

---

## 2  User Stories (Abbreviated)

|  ID     |  Story                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
|  US‑01  |  *As a security admin*, I want all ChatGPT prompts from corporate laptops to be scanned for PII so that no personal data leaves the company. |
|  US‑02  |  *As an engineer*, I receive an immediate warning if I paste code containing secrets so I can remove them before submitting.                 |
|  US‑03  |  *As a SOC analyst*, I can query logs for blocked prompts and identify repeat offenders.                                                     |
|  US‑04  |  *As a policy owner*, I can update guardrail rules centrally without redeploying the extension.                                              |

---

## 3  High‑Level Architecture

```
┌────────────────────┐            ┌───────────────────────────────┐
│   Content Script   │──────────▶│  Background Service Worker    │
│ (UI interception)  │  message  │  (policy RPC & logging)       │
└─────────┬──────────┘            └──────────────┬────────────────┘
          │DOM mut.                         HTTPS│
          ▼                                        ▼
 Web page (ChatGPT)        Stinger Policy API  ➜  On‑prem/cloud microservice
```

---

## 4  Browser APIs & Permissions

|  API                               |  Usage                                    |  Notes                                |
| ---------------------------------- | ----------------------------------------- | ------------------------------------- |
| `content_scripts`                  | Inject JS on matching hostnames.          | Run at `document_idle`.               |
| `chrome.runtime.sendMessage`       | CS↔BG messaging.                          | Lightweight, promise‑wrapped helper.  |
| `chrome.storage.local`             | Queue audit events.                       | Flushed in batches.                   |
| `alarms`                           | Periodic tasks (rule refresh, log flush). | Min. 15 min in MV3.                   |
| `declarativeNetRequest` *(future)* | Optional keyword block w/out CS.          | Nice‑to‑have for static regex blocks. |

**Host Permissions:**

```json
"host_permissions": [
  "https://chat.openai.com/*",
  "https://copilot.microsoft.com/*"
]
```

---

## 5  Component Overview

### 5.1 Content Script (`content.ts`)

- Detect **prompt submission**:
  - Attach `keydown` listener to `<textarea>` / `<input>`; on Enter or click of send button.
  - Hash & store prompt in variable until verdict.
- Detect **model response**:
  - `MutationObserver` on message container (`.markdown.prose`, `.result-streaming`) until a node’s `data-finished="true"` attr or line ending appears.
- **Redaction / Block UI**:
  - If `action === "block"`, empty textarea & show toast.
  - If blocking a response, replace message div with red banner; keep original text in `data-raw` attr for forensic copy.

### 5.2 Background Service Worker (`bg.ts`)

- Receives `{kind, text}` messages.
- Calls `POST /v1/check` at `STINGER_URL` with `{tenantId,userId,kind,text}`.
- Handles verdicts: `allow | warn | block`, returns to CS.
- Writes `{timestamp,verdict,hash}` to `storage.local.auditQueue`.
- Scheduled `flushAudit()` every 5 min (configurable) to `SIEM_URL`.
- Periodic `syncRules()` to refresh policy JSON (signed, SHA‑256 + HMAC).

### 5.3 Shared Utilities

- `logger.ts` – thin wrapper around console + `storage` queue.
- `rpc.ts` – fetch wrapper with retries, exponential backoff.
- `hash.ts` – SHA‑256 helper (SubtleCrypto).

---

## 6  Data Flow (Prompt)

1. User types prompt & hits send.
2. CS captures text → sends BG `checkPrompt`.
3. BG `POST` to Stinger API.
4. API returns **verdict**.
5. BG relays verdict.
   - **allow** → do nothing; message already sent (needs async speed).
   - **block** → CS cancels form submit (preventDefault) & clears textbox.
   - **warn** → CS allows send but overlays yellow banner.
6. BG logs `{kind:"prompt",…}` to audit queue.

*Data flow for response is identical but uses DOM observer.*

---

## 7  Error Handling & Resilience

- **API timeout > 2 s** → fallback to *warn* (configurable).
- **Network offline** → queue prompts locally up to 3 MB, then switch to read‑only mode.
- **Storage quota exceeded** → drop oldest logs, raise `logger.error`.

---

## 8  Security & Privacy Hardening

- **CSP:** `script-src 'self'; connect-src 'self' https://stinger-api.example.com`.
- **Isolated World:** CS runs in isolated world; no direct eval.
- **No remote code execution:** Rules JSON contains static patterns & thresholds, not executable JS.
- **PII minimisation:** Only hash of prompt/response stored locally; full text sent to API over HTTPS **with device certificate**.
- **Minimum permissions:** No tab access, no cookies, no file URL access.

---

## 9  Performance Targets

- Prompt check round‑trip p95 < 250 ms.
- Additional DOM mutation overhead ≤ 2 ms per block.
- Memory footprint < 15 MB in BG.

---

## 10  Policy Management

- **Rules endpoint:** `GET /v1/rules?extVer=0.1.0` returns signed JSON 5 (\~30 KB).
- **Signature:** `HMAC‑SHA256(base64Rules, sharedSecret)` header. BG verifies before storing to `chrome.storage.local.rules`.
- **Rule schema:**

```jsonc
{
  "pii": { "enabled": true, "threshold": 0.75 },
  "profanity": { "enabled": true },
  "regexBlocks": ["/AKIA[0-9A-Z]{16}/"]
}
```

---

## 11  Build & CI/CD Pipeline

- **Source:** `/extension` directory in mono‑repo.
- **Language:** TypeScript 5, ES2022.
- **Bundler:** Vite (targets `chrome118`, slices CS + BG).
- **Lint/Test:** ESLint, Jest unit tests, Playwright e2e on staging ChatGPT UI.
- **Signing:** `npm run build && chrome --pack-extension` in CI.
- **Pipeline:** GitHub Actions → build, scan (OWASP ZAP passive, Snyk), sign, attach `.crx` to release.

---

## 12  Enterprise Deployment

- Admin uploads signed extension to private update server **or** publishes unlisted in Chrome Web Store.
- OUs/groups forced via `ExtensionInstallForceList`.
- Managed settings via `ExtensionSettings` JSON (e.g., tenantId, apiURL, cert fingerprint).
- Canary ring of 25 users for 1 week; metrics and feedback; then phased rollout.

---

## 13  Extensibility Roadmap

- **Firefox MV3 port** (shared TS code, different manifest keys).
- **Edge Add‑ons listing** (Edge uses same manifest).
- **Streaming chunk inspection** for SSE/WebSocket by patching `EventSource`/`WebSocket` prototypes.
- **On‑device ML mini‑models** (WASM) for privacy‑preserving keyword classification when offline.
- **DeclarativeNetRequest rules** for high‑confidence static blocks to reduce latency.

---

## 14  Open Questions / Assumptions

1. Where will the Stinger Policy API be hosted (on‑prem vs cloud)?
2. Is user identity required in payloads? If yes, can we read email from `chrome.identity` or rely on device serial → map in backend?
3. Do we need to support other LLM SaaS sites in v0.1 (Claude.ai, Perplexity)? Pattern‑matching hostnames will be trivial.
4. Audit log retention period → storage quota trade‑off.
5. Minimum Chrome version in fleet (MV3 requires 88+ but we’ll target 118 for Manifest V3 best support).

---

**Prepared by:** Stinger‑Sec Architecture Team  •  2025‑07‑05

