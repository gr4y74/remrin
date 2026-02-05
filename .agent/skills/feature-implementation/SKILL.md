---
name: Feature Implementation
description: End-to-end workflow for implementing new features including planning, execution, and verification
---

# Feature Implementation Workflow

Use this skill when implementing new features to ensure a systematic, high-quality approach.

## Phase 1: Planning

### 1.1 Understanding Requirements
- [ ] Read and understand user request completely
- [ ] Clarify ambiguities with questions
- [ ] Identify scope (what's included, what's not)
- [ ] List dependencies (components, APIs, database changes)

### 1.2 Create Implementation Plan
Create `/brain/[conversation-id]/implementation_plan.md`:

```markdown
# [Feature Name]

## Goal
Brief description of what we're building and why.

## User Review Required
> [!IMPORTANT]
> Breaking changes, major design decisions, or anything requiring user approval.

## Proposed Changes

### Component A
- File: [path/to/file.tsx](file:///path)
- Changes: Description

### Component B
- File: [path/to/file.tsx](file:///path)
- Changes: Description

## Database Changes (if applicable)
- New tables/columns
- Migrations required

## Verification Plan
- How we'll test the changes
- Manual verification steps
```

### 1.3 Create Task Checklist
Create `/brain/[conversation-id]/task.md`:

```markdown
# Task - [Feature Name]

## Planning
- [ ] Understand requirements
- [ ] Create implementation plan
- [ ] Get user approval

## Implementation
- [ ] Create/modify component A
- [ ] Create/modify component B
- [ ] Add tests (if applicable)

## Verification
- [ ] Manual testing
- [ ] Type check passes
- [ ] Lint passes
- [ ] User acceptance
```

### 1.4 Get Approval
- [ ] Use `notify_user` to request plan review
- [ ] Address feedback
- [ ] Wait for approval before proceeding

## Phase 2: Execution

### 2.1 Set Task Boundary
```typescript
task_boundary({
    TaskName: "Implementing [Feature Name]",
    Mode: "EXECUTION",
    TaskSummary: "...",
    TaskStatus: "Creating component X"
})
```

### 2.2 Implementation Order

1. **Database Changes** (if needed)
   - Create migration file
   - Apply migration
   - Regenerate types
   - Verify schema

2. **Type Definitions**
   - Create/update interfaces
   - Export from index files

3. **Core Components**
   - Build main components
   - Follow design system
   - Add proper TypeScript types

4. **Integration**
   - Wire components together
   - Add to existing pages
   - Update navigation (if needed)

5. **Styling**
   - Apply Rose Pine colors
   - Add glassmorphism effects
   - Ensure responsiveness
   - Add animations

6. **Polish**
   - Add sound effects
   - Add loading states
   - Add error handling
   - Add accessibility features

### 2.3 Update Task Progress
Mark items complete in `task.md` as you go:
```markdown
- [x] Create component A
- [/] Create component B (in progress)
- [ ] Add tests
```

### 2.4 Code Quality Checks

For each component created:
- [ ] Follows design-system skill guidelines
- [ ] Follows component-checklist skill guidelines
- [ ] TypeScript types are complete
- [ ] No console errors
- [ ] Responsive design works
- [ ] Accessibility considerations met

## Phase 3: Verification

### 3.1 Set Verification Mode
```typescript
task_boundary({
    TaskName: "Verifying [Feature Name]",
    Mode: "VERIFICATION",
    TaskSummary: "...",
    TaskStatus: "Running tests and creating walkthrough"
})
```

### 3.2 Testing Checklist

#### TypeScript & Linting
```bash
npm run type-check  # Must pass
npm run lint        # Should pass (or have justification)
```

#### Manual Testing
- [ ] Feature works on desktop (1920x1080)
- [ ] Feature works on tablet (768px)
- [ ] Feature works on mobile (375px)
- [ ] All interactive elements respond
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Navigation works
- [ ] Data persists (if applicable)

#### Visual Verification
- [ ] Matches design system
- [ ] Colors are from Rose Pine palette
- [ ] Animations are smooth
- [ ] No layout shift
- [ ] No visual bugs

#### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if possible)

### 3.3 Create Walkthrough
Create `/brain/[conversation-id]/walkthrough.md`:

```markdown
# Walkthrough - [Feature Name]

Brief summary of what was accomplished.

## Changes Made

### New Components
- [ComponentName.tsx](file:///path) - Description

### Modified Components  
- [ComponentName.tsx](file:///path) - Description

## Implementation Details

### [Section Name]
Explanation of how something works.

## Verification

- ✅ Type check passes
- ✅ Manual testing completed
- ✅ Responsive design verified

## Screenshots (if applicable)

![Feature Screenshot](/path/to/screenshot.png)
```

### 3.4 User Acceptance
- [ ] Request user to test feature
- [ ] Fix any issues found
- [ ] Get final approval

## Phase 4: Documentation & Cleanup

### 4.1 Code Documentation
- [ ] Add JSDoc comments to complex functions
- [ ] Update README if needed
- [ ] Document any new environment variables
- [ ] Update API documentation (if applicable)

### 4.2 Cleanup
- [ ] Remove debug console.logs
- [ ] Remove commented-out code
- [ ] Remove unused imports
- [ ] Remove unused variables
- [ ] Organize imports

### 4.3 Commit Message Format
```
feat: Add [feature name]

- Created [ComponentA] for [purpose]
- Modified [ComponentB] to support [feature]
- Added [DatabaseTable] for [purpose]

Closes #[issue-number]
```

## Common Patterns

### Pattern 1: New UI Component
1. Plan → Create component → Style → Integrate → Test → Document

### Pattern 2: Database + UI Feature
1. Plan → Migration → Types → API → UI → Integration → Test → Document

### Pattern 3: Refactoring
1. Plan → Extract/Move code → Update imports → Test → Document

## Red Flags to Avoid

❌ Starting implementation without user approval
❌ Skipping TypeScript types
❌ Not testing on mobile
❌ Forgetting to regenerate types after schema changes
❌ Not handling loading/error states
❌ Hardcoding values that should be configurable
❌ Breaking existing features
❌ Not following design system

## Quality Gates

Before marking feature as complete:
- [ ] Implementation plan was followed
- [ ] All task checklist items complete
- [ ] Type check passes
- [ ] Lint passes (or justified violations)
- [ ] Manual testing completed
- [ ] Walkthrough created
- [ ] User approved

## Iteration Loop

If issues are found during verification:
1. Switch back to EXECUTION mode
2. Fix issues
3. Update task.md
4. Re-test
5. Switch to VERIFICATION mode
6. Request user approval

## When to Ask for Help

- Requirements are unclear
- Technical limitation discovered
- User feedback requires major changes
- Breaking change needed
- Performance concerns
- Security concerns

## Success Criteria

Feature is complete when:
✅ User can use the feature successfully
✅ No console errors
✅ Responsive on all screen sizes
✅ Follows design system
✅ Code quality is high
✅ Documentation is complete
✅ User is satisfied
