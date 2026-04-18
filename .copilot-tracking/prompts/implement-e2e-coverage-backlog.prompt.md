---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: Backlog E2E 360 para Hermes Dashboard

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260418-e2e-coverage-backlog-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL systematically implement #file:../plans/20260418-e2e-coverage-backlog-plan.instructions.md task-by-task.
You WILL use #file:../details/20260418-e2e-coverage-backlog-details.md as the source of truth for scope, acceptance criteria, test approach, dependencies, labels, and execution order.
You WILL preserve the current Next.js standalone Playwright flow unless a task explicitly improves it.
You WILL prioritize foundation tasks before domain expansion.

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20260418-e2e-coverage-backlog-changes.md to the user.
2. You WILL provide markdown style links to #file:../plans/20260418-e2e-coverage-backlog-plan.instructions.md, #file:../details/20260418-e2e-coverage-backlog-details.md, and #file:../research/20260418-e2e-coverage-backlog-research.md and recommend cleaning them up if they are no longer needed.
3. **MANDATORY**: You WILL attempt to delete #file:../prompts/implement-e2e-coverage-backlog.prompt.md.

## Success Criteria

- [ ] Changes tracking file created
- [ ] All plan items implemented with working code/tests/issues artifacts
- [ ] All detailed specifications satisfied
- [ ] Project conventions followed
- [ ] Changes file updated continuously