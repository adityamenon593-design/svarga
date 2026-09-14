# Plan: Publish Svarga to production

## Goal
Push the current clean build to the published production URL (svarga.digital) so the site is live for tomorrow's launch.

## Context
- All code changes for the Colab workbench, consent-gated fine-tuning workflow, Udyam certification, and truth-in-marketing docs are committed.
- Build and lint are clean.
- The only remaining open roadmap item is publishing.

## Steps
1. Run final build/typecheck/lint verification.
2. Publish the app to svarga.digital via the publish action.
3. Confirm the live site loads the homepage and /chat route.

## Risks / notes
- Publishing is irreversible for the live URL; verify first.
- The user previously said "publish it as well no need to ask", so this plan assumes prior approval to proceed once surfaced.
