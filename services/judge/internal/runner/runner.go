package runner

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"go.uber.org/zap"
)

type ExecuteRequest struct {
	SubmissionID  string
	ProblemID     string
	Language      string
	Code          string
	TestCases     []TestCaseInput
	TimeLimitMs   int
	MemoryLimitMB int
	Mode          string // "run" or "submit"
}

type TestCaseInput struct {
	Input    string
	Expected string
}

type CaseResult struct {
	Index          int    `json:"index"`
	Verdict        string `json:"verdict"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	RuntimeMs      int    `json:"runtime_ms"`
}

type ExecuteResult struct {
	SubmissionID string       `json:"submission_id"`
	Verdict      string       `json:"verdict"`
	RuntimeMs    int          `json:"runtime_ms"`
	MemoryKB     int          `json:"memory_kb"`
	Output       string       `json:"output"`
	ErrorMsg     string       `json:"error_msg"`
	PassedCases  int          `json:"passed_cases"`
	TotalCases   int          `json:"total_cases"`
	Mode         string       `json:"mode,omitempty"`
	CaseResults  []CaseResult `json:"case_results,omitempty"`
}

type Runner struct {
	log *zap.Logger
}

func New(log *zap.Logger) *Runner {
	return &Runner{log: log}
}

func (r *Runner) Execute(ctx context.Context, req ExecuteRequest) ExecuteResult {
	lang, ok := Languages[req.Language]
	if !ok {
		return ExecuteResult{
			SubmissionID: req.SubmissionID,
			Verdict:      VerdictCE,
			ErrorMsg:     fmt.Sprintf("unsupported language: %s", req.Language),
		}
	}

	baseDir := os.Getenv("JUDGE_WORK_DIR")
	if baseDir == "" {
		baseDir = os.TempDir()
	}
	// Use submission ID as dir name under a pre-existing base dir for consistent Docker bind mounts
	workDir := filepath.Join(baseDir, req.SubmissionID)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return ExecuteResult{SubmissionID: req.SubmissionID, Verdict: VerdictRE, ErrorMsg: "failed to create work dir"}
	}
	defer os.RemoveAll(workDir)

	filename := fmt.Sprintf("solution.%s", lang.FileExt)
	if req.Language == "java" {
		filename = "Solution.java"
	}
	codeFile := filepath.Join(workDir, filename)
	if err := os.WriteFile(codeFile, []byte(req.Code), 0644); err != nil {
		return ExecuteResult{SubmissionID: req.SubmissionID, Verdict: VerdictRE}
	}
	// Ensure file is flushed to the shared volume before Docker mounts it
	if f, err := os.Open(workDir); err == nil {
		f.Sync()
		f.Close()
	}

	if lang.CompileCmd != nil {
		if ceResult := r.compile(ctx, lang, workDir, req.SubmissionID); ceResult != nil {
			return *ceResult
		}
	}

	sandbox := SandboxConfig{
		TimeLimitMs:   req.TimeLimitMs,
		MemoryLimitMB: req.MemoryLimitMB,
		WorkDir:       workDir,
	}

	result := ExecuteResult{
		SubmissionID: req.SubmissionID,
		TotalCases:   len(req.TestCases),
		Mode:         req.Mode,
	}

	isRunMode := req.Mode == "run"
	if isRunMode {
		result.CaseResults = make([]CaseResult, 0, len(req.TestCases))
	}

	for i, tc := range req.TestCases {
		verdict, runtimeMs, output, errMsg := r.runTestCase(ctx, sandbox, lang, tc)
		if runtimeMs > result.RuntimeMs {
			result.RuntimeMs = runtimeMs
		}

		if isRunMode {
			result.CaseResults = append(result.CaseResults, CaseResult{
				Index:          i,
				Verdict:        verdict,
				Input:          tc.Input,
				ExpectedOutput: tc.Expected,
				ActualOutput:   output,
				RuntimeMs:      runtimeMs,
			})
		}

		if verdict == VerdictAC {
			result.PassedCases++
		} else {
			// In submit mode, stop on first failure
			if !isRunMode {
				result.Verdict = verdict
				result.Output = output
				result.ErrorMsg = errMsg
				return result
			}
		}
	}

	if result.PassedCases == result.TotalCases {
		result.Verdict = VerdictAC
	} else {
		// In run mode, set verdict to first non-AC case
		for _, cr := range result.CaseResults {
			if cr.Verdict != VerdictAC {
				result.Verdict = cr.Verdict
				break
			}
		}
		if result.Verdict == "" {
			result.Verdict = VerdictWA
		}
	}

	return result
}

func (r *Runner) compile(ctx context.Context, lang LanguageConfig, workDir, submissionID string) *ExecuteResult {
	args := lang.CompileCmd
	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	cmd.Dir = workDir
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return &ExecuteResult{
			SubmissionID: submissionID,
			Verdict:      VerdictCE,
			ErrorMsg:     stderr.String(),
		}
	}
	return nil
}

func (r *Runner) runTestCase(ctx context.Context, sandbox SandboxConfig, lang LanguageConfig, tc TestCaseInput) (verdict string, runtimeMs int, output, errMsg string) {
	// Create container, copy code into it, then start — avoids bind mount issues on Docker Desktop
	containerName := fmt.Sprintf("judge-%s-%d", filepath.Base(sandbox.WorkDir), time.Now().UnixNano()%100000)

	// Step 1: docker create (without --rm so we can cp into it)
	createArgs := sandbox.BuildCreateArgs(containerName, lang.Image, lang.RunCmd)
	createCmd := exec.CommandContext(ctx, "docker", createArgs...)
	if out, err := createCmd.CombinedOutput(); err != nil {
		return VerdictRE, 0, "", fmt.Sprintf("docker create failed: %s %s", err, string(out))
	}
	// Ensure cleanup
	defer func() {
		exec.Command("docker", "rm", "-f", containerName).Run()
	}()

	// Step 2: docker cp workdir contents into /sandbox/
	cpCmd := exec.CommandContext(ctx, "docker", "cp", sandbox.WorkDir+"/.", containerName+":/sandbox/")
	if out, err := cpCmd.CombinedOutput(); err != nil {
		return VerdictRE, 0, "", fmt.Sprintf("docker cp failed: %s %s", err, string(out))
	}

	// Step 3: docker start -i (attach stdin/stdout)
	startCmd := exec.CommandContext(ctx, "docker", "start", "-i", containerName)
	startCmd.Stdin = strings.NewReader(tc.Input)

	var stdout, stderr bytes.Buffer
	startCmd.Stdout = &stdout
	startCmd.Stderr = &stderr

	start := time.Now()
	err := startCmd.Run()
	elapsed := int(time.Since(start).Milliseconds())

	actualOutput := stdout.String()
	tle := elapsed >= sandbox.TimeLimitMs

	if err != nil {
		exitCode := -1
		if startCmd.ProcessState != nil {
			exitCode = startCmd.ProcessState.ExitCode()
		}
		v := DetermineVerdict(exitCode, stderr.String(), tle, false)
		return v, elapsed, actualOutput, stderr.String()
	}

	if !CompareOutput(actualOutput, tc.Expected) {
		return VerdictWA, elapsed, actualOutput, ""
	}

	return VerdictAC, elapsed, actualOutput, ""
}
