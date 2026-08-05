# EmbersInc — start here

**Before answering ANY question about this project, or proposing ANY change:
read `PROJECT.md` in this folder.**

It covers what this is, how it works, the design rules that must not be broken,
and what's already known-missing. Check every new request against its
"Rules of the house" section before agreeing to build it.

Other docs here:
- `TASKS.md` — what's next (high-level; see also the `tasks/` directory below for the detailed, section-by-section checklists)
- `README.md` — setup/deploy instructions
- `../build-logs/logs/embers-web.md` — *why* decisions were made, and what was already tried and rejected (not written yet)

When you add, remove, or meaningfully change a feature, update `PROJECT.md` in
the same session. A stale doc is worse than no doc.

---

## Task Tracking (CRITICAL — READ THIS FIRST)

**Tasks are tracked in the `tasks/` directory** — one file per section.
Each file has markdown checklists (`- [x]` done, `- [ ]` undone).
HQ (hq.nolimitjones.com) reads these files automatically.

### Before Starting ANY Work

1. **Read the `tasks/` directory** — list all files, understand what sections exist
2. **Find the task file that matches your work** — open the relevant one
3. Confirm with the user which task to work on

### When You COMPLETE a Task

1. Open the relevant `tasks/*.md` file
2. Change the item from `- [ ]` to `- [x]`
3. **Commit the task file update in the SAME commit as your code changes**
4. Tell the user what was completed and suggest the next task

### When You DISCOVER New Work

If you find a bug, missing feature, or something that needs doing:
1. Find the most relevant `tasks/*.md` file for that area
2. Add a new `- [ ]` item at the end of the Tasks section
3. Include it in your next commit
4. Tell the user what you added and why

### When a Task Needs to CHANGE

If a task is wrong, outdated, too broad, or needs splitting:
1. **Don't delete it** — mark `- [x] (REMOVED — reason)` or `- [x] (SPLIT — see below)`
2. Add the corrected/split tasks as new `- [ ]` items
3. This preserves history so nothing gets lost

### When a Task Doesn't Fit Any Existing File

If your work doesn't match any existing task file:
1. Create a new file: `tasks/XX-descriptive-name.md` (use the next available number)
2. Use this format:
   ```
   # Section Name

   > Source: `created by Claude session`
   > Progress: 0/N tasks done

   ## Tasks

   - [ ] First task
   - [ ] Second task
   ```
3. Commit it with your code changes

### Parallel Session Safety

- Each task file covers a different area of work
- **Only edit the task file relevant to YOUR current work**
- Do NOT edit other task files you aren't working on
- This prevents git merge conflicts between parallel sessions

### ADHD Reminder

Danny has ADHD — **nothing should ever vanish without a trace.**
- Don't silently delete tasks. Mark them and note why.
- New discoveries MUST be written down immediately or they'll be forgotten.
- If a feature gets disabled, add a `- [ ]` item to re-enable it later.

---


## Project Overview

<!-- Add project description here -->

## Development Commands

```bash
# Add your commands here
npm install
npm run dev
```
