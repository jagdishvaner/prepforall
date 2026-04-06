# Interactive Editor & End-to-End Code Execution

**Date:** 2026-04-05
**Status:** Implemented
**Scope:** Editor UI polish (LeetCode-like) + Sub-project 2 (Run/Submit execution flow)

---

## 1. Overview

Transform the raw problem workspace into a LeetCode-style interactive coding environment with working code execution. Two workstreams:

1. **Editor polish** — starter code, enhanced toolbar, problem metadata, interactive test case panel
2. **Execution pipeline** — wire Run/Submit buttons to the existing judge service via a new "run" endpoint

The backend judge service, Redis Streams queue, WebSocket delivery, and result consumer already exist. The primary backend gap is a `POST /submissions/run` endpoint for sample-only execution.

---

## 2. Backend: Run Endpoint

### 2.1 New Route

```
POST /api/v1/submissions/run
```

**Request body:**
```json
{
  "problem_slug": "two-sum",
  "language": "cpp",
  "code": "class Solution { ... }"
}
```

**Response:**
```json
{
  "run_id": "temp-uuid-here"
}
```

### 2.2 Behavior

- Does NOT create a row in the `submissions` table
- Generates a temporary UUID (`run_id`) for WebSocket correlation
- Fetches only sample test cases for the problem (where `is_sample = true`)
- Enqueues to `submissions:queue` Redis Stream with `mode: "run"` and only sample test case S3 keys
- Result flows through existing pipeline: judge → `results:stream` → result consumer → Redis Pub/Sub → WebSocket

### 2.3 Queue Job Changes

Add `Mode` field to `SubmissionJob` in `pkg/queue/job.go`:

```go
type SubmissionJob struct {
    SubmissionID string   `json:"submission_id"`
    ProblemID    string   `json:"problem_id"`
    UserID       string   `json:"user_id"`
    Language     string   `json:"language"`
    Code         string   `json:"code"`
    TimeLimitMs  int      `json:"time_limit_ms"`
    MemoryLimitMB int     `json:"memory_limit_mb"`
    Mode         string   `json:"mode"`          // "run" or "submit"
    TestCaseKeys []string `json:"test_case_keys"` // S3 keys for test cases
}
```

### 2.4 Judge Worker Changes

In `worker.go`, the worker already receives test case keys via the job. The change:
- When `mode == "run"`: use only the provided `TestCaseKeys` (sample cases)
- When `mode == "submit"` (or empty for backwards compat): use all test cases for the problem
- Result event includes per-case detail when `mode == "run"`:

```go
type ResultEvent struct {
    SubmissionID string       `json:"submission_id"`
    Verdict      string       `json:"verdict"`
    RuntimeMs    int          `json:"runtime_ms"`
    MemoryKb     int          `json:"memory_kb"`
    PassedCases  int          `json:"passed_cases"`
    TotalCases   int          `json:"total_cases"`
    ErrorMsg     string       `json:"error_msg,omitempty"`
    Mode         string       `json:"mode"`
    CaseResults  []CaseResult `json:"case_results,omitempty"` // populated for "run" mode
}

type CaseResult struct {
    Index          int    `json:"index"`
    Verdict        string `json:"verdict"`
    Input          string `json:"input"`
    ExpectedOutput string `json:"expected_output"`
    ActualOutput   string `json:"actual_output"`
    RuntimeMs      int    `json:"runtime_ms"`
}
```

### 2.5 Result Consumer Changes

In `result_consumer.go`:
- When `mode == "run"`: skip DB write, only publish to Redis Pub/Sub for WebSocket delivery
- When `mode == "submit"`: existing behavior (write to DB + publish)

### 2.6 Submit Endpoint Changes

Modify existing `POST /api/v1/submissions` to:
- Include `mode: "submit"` in the enqueued job
- Include ALL test case S3 keys (not just sample)
- Existing DB write and result consumer behavior unchanged

---

## 3. Frontend: Editor Polish

### 3.1 Problem Description Panel (Left)

**File:** New `ProblemDescription.tsx`

Replace the current raw `<div dangerouslySetInnerHTML>` with a structured component:

- **Header:** Problem title + difficulty badge (green Easy / yellow Medium / red Hard)
- **Metadata row:** Acceptance rate, tags as pills
- **Description body:** Properly rendered HTML (already stored as HTML in DB)
- **Tab bar:** Description | Submissions
  - Description tab: problem content (default)
  - Submissions tab: list of user's past submissions for this problem (fetched from `GET /problems/{slug}/submissions`)

### 3.2 Editor Toolbar Enhancement

**File:** Modified `EditorToolbar.tsx`

Current: language selector + Run + Submit buttons

Enhanced:
- **Left group:** Language selector dropdown (styled with border, bg)
- **Center/right group:**
  - Reset code button (RotateCcw icon) — reloads starter code with confirmation dialog
  - Theme toggle (Sun/Moon icon)
  - Font size selector (dropdown: 12, 13, 14, 15, 16, 18, 20)
  - Fullscreen toggle (Maximize2/Minimize2 icon)
- **Far right:** Run button + Submit button (existing, but now wired)

### 3.3 Editor Status Bar

**File:** New `EditorStatusBar.tsx`

Thin bar below the editor:
- **Left:** "Saved" indicator (shows briefly after code changes debounce)
- **Right:** "Ln {line}, Col {col}" — updated from Monaco editor cursor position via `onMount` callback

### 3.4 Starter Code Loading

**Logic in `ProblemWorkspace.tsx`:**

```
code = editorStore.getCode(slug, language)
if (!code && problem.starterCode?.[language]) {
  code = problem.starterCode[language]
  editorStore.setCode(slug, language, code)
}
```

When user switches language:
- If saved code exists for the new language, load it
- If not, load starter code for that language
- Reset button: confirm dialog → reload starter code, overwrite saved code

### 3.5 CodeEditor Enhancement

**File:** Modified `CodeEditor.tsx`

- Expose `onMount` callback to parent for cursor position tracking
- Parent uses `editor.onDidChangeCursorPosition()` to update Ln/Col in status bar

---

## 4. Frontend: Test Case Panel

### 4.1 Component Structure

**File:** New `TestCasePanel.tsx` replaces direct `SubmissionPanel` usage

Two tabs:
- **Testcase** — displays sample test cases with editable inputs
- **Test Result** — displays execution results after Run or Submit

### 4.2 Testcase Tab

- Fetched from `GET /api/v1/problems/{slug}/testcases/sample`
- **Case tabs:** Case 1 | Case 2 | Case 3 (from sample test cases)
- Each case shows labeled, editable input fields:
  ```
  nums = [2,7,11,15]
  target = 9
  ```
- Input parsing: test case `input` string is split by newlines, each line is a parameter labeled `Input 1`, `Input 2`, etc.

### 4.3 Test Result Tab

**After Run (mode=run):**
- Per-case results with verdict badge per case
- For each case: Input, Expected Output, Your Output (side by side or stacked)
- Green check / red X per case
- Overall: "X/Y test cases passed"
- If CE (compilation error): show error message in red monospace block

**After Submit (mode=submit):**
- Overall verdict badge (AC, WA, TLE, MLE, RE, CE)
- Runtime and memory stats
- "X/Y test cases passed"
- Error message if applicable
- No per-case detail (all cases not exposed for submit)

### 4.4 Hook: useTestCases

**File:** New `useTestCases.ts`

```typescript
function useTestCases(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.testCases(slug),
    queryFn: () => apiClient.get(`/api/v1/problems/${slug}/testcases/sample`),
  });
}
```

---

## 5. Frontend: Execution Flow

### 5.1 Hook: useSubmission

**File:** New `useSubmission.ts`

Orchestrates the full run/submit lifecycle:

```typescript
function useSubmission(slug: string) {
  // State: activeId, result, isJudging, mode
  
  run(code, language) {
    const { run_id } = await submissionsApi.run({ problem_slug: slug, language, code });
    setActiveId(run_id);
    setIsJudging(true);
    setMode('run');
    // WebSocket opens via useSubmissionResult(activeId)
  }
  
  submit(code, language) {
    const { submission_id } = await submissionsApi.submit({ problem_slug: slug, language, code });
    setActiveId(submission_id);
    setIsJudging(true);
    setMode('submit');
  }
  
  return { run, submit, result, isJudging, mode };
}
```

Uses existing `useSubmissionResult` hook internally for WebSocket.

### 5.2 ProblemWorkspace Wiring

```typescript
const { run, submit, result, isJudging, mode } = useSubmission(slug);

<EditorToolbar
  onRun={() => run(code, language)}
  onSubmit={() => submit(code, language)}
  isJudging={isJudging}
/>

<TestCasePanel
  testCases={sampleTestCases}
  result={result}
  isJudging={isJudging}
  mode={mode}
/>
```

### 5.3 Keyboard Shortcuts

Registered in `ProblemWorkspace.tsx` via `useEffect`:
- `Ctrl/Cmd + Enter` → Run
- `Ctrl/Cmd + Shift + Enter` → Submit
- `Ctrl/Cmd + S` → Prevent default, show "Saved" indicator

### 5.4 Loading & Error States

- **While judging:** Run/Submit buttons disabled with spinner, results panel shows "Judge is evaluating..."
- **Network error:** Toast with retry suggestion
- **WebSocket disconnect:** Fallback to polling `GET /submissions/{id}` every 2s for 30s, then timeout
- **Empty code:** Validate before sending, show toast "Please write some code first"

---

## 6. File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `services/api/internal/submissions/run_handler.go` | Run endpoint handler |
| `apps/platform/src/features/ProblemWorkspace/ProblemDescription.tsx` | Enhanced left panel |
| `apps/platform/src/features/ProblemWorkspace/TestCasePanel.tsx` | Tabbed test case / result panel |
| `apps/platform/src/features/ProblemWorkspace/EditorStatusBar.tsx` | Ln/Col + Saved indicator |
| `apps/platform/src/lib/hooks/useTestCases.ts` | Fetch sample test cases |
| `apps/platform/src/lib/hooks/useSubmission.ts` | Run/Submit orchestration |

### Modified Files

| File | Changes |
|------|---------|
| `services/api/internal/submissions/handler.go` | Register run route |
| `services/api/internal/submissions/service.go` | Add `Run()` method |
| `services/api/pkg/queue/job.go` | Add `Mode`, `TestCaseKeys` to SubmissionJob |
| `services/judge/internal/worker/worker.go` | Respect mode, return per-case results for run |
| `services/judge/internal/runner/runner.go` | Return per-case detail |
| `services/api/internal/submissions/result_consumer.go` | Skip DB write for run mode |
| `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx` | Wire everything together |
| `apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx` | Add reset, theme, font size, fullscreen |
| `apps/platform/src/stores/editorStore.ts` | Starter code loading |
| `packages/platform-ui/src/organisms/CodeEditor.tsx` | Expose cursor position |
| `apps/platform/src/lib/queryKeys.ts` | Add testCases query key |

---

## 7. Out of Scope

- Editorial/Solutions tabs (future feature)
- Custom test case creation (add "+" button in UI, but full custom input execution deferred)
- Submission history page/panel (list endpoint exists, UI deferred)
- Contest-mode execution
- Code autocompletion beyond Monaco defaults
- Discussion section on problem page
