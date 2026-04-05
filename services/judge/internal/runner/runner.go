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

	workDir, err := os.MkdirTemp("", "judge-*")
	if err != nil {
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

	if lang.CompileCmd != nil {
		if ceResult := r.compile(ctx, lang, workDir, req.SubmissionID); ceResult != nil {
			return *ceResult
		}
	}

	sandbox := SandboxConfig{
		TimeLimitMs:   req.TimeLimitMs,
		MemoryLimitMB: req.MemoryLimitMB,
		WorkDir:       codeFile,
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
	dockerArgs := sandbox.BuildDockerArgs(lang.Image, lang.RunCmd)
	cmd := exec.CommandContext(ctx, "docker", dockerArgs...)
	cmd.Stdin = strings.NewReader(tc.Input)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	start := time.Now()
	err := cmd.Run()
	elapsed := int(time.Since(start).Milliseconds())

	actualOutput := stdout.String()
	tle := elapsed >= sandbox.TimeLimitMs

	if err != nil {
		v := DetermineVerdict(cmd.ProcessState.ExitCode(), stderr.String(), tle, false)
		return v, elapsed, actualOutput, stderr.String()
	}

	if !CompareOutput(actualOutput, tc.Expected) {
		return VerdictWA, elapsed, actualOutput, ""
	}

	return VerdictAC, elapsed, actualOutput, ""
}
