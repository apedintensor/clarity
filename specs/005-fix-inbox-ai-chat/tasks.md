# Tasks: Fix Inbox AI Chat — No AI Reply

**Input**: Design documents from `/specs/005-fix-inbox-ai-chat/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: Root Cause Fix

- [X] T001 Fix environment variable loading so the AI API key is accessible to the Next.js API route in packages/web
- [X] T002 Add error handling to the streaming API route in packages/web/src/app/api/chat/route.ts
- [X] T003 Add error display in the chat UI when the AI service fails in packages/web/src/components/inbox-chat-modal.tsx

## Phase 2: Verification

- [X] T004 Verify full build passes with `pnpm -r run build`
