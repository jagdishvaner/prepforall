package runner

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
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

	sandbox := SandboxConfig{
		TimeLimitMs:   req.TimeLimitMs,
		MemoryLimitMB: req.MemoryLimitMB,
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
		verdict, runtimeMs, output, errMsg := r.runTestCase(ctx, sandbox, lang, req.Code, tc)
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

// runTestCase executes a single test case by passing the code as an env var into the Docker container.
// This avoids bind mount issues on Docker Desktop for Mac.
func (r *Runner) runTestCase(ctx context.Context, sandbox SandboxConfig, lang LanguageConfig, code string, tc TestCaseInput) (verdict string, runtimeMs int, output, errMsg string) {
	// Build the shell command that writes code to a file and executes it
	filename := fmt.Sprintf("/tmp/solution.%s", lang.FileExt)
	if lang.Language == "java" {
		filename = "/tmp/Solution.java"
	}

	var shellCmd string
	if lang.CompileCmd != nil {
		// Compiled language: write, compile, run
		compileCmd := strings.Join(lang.CompileCmd, " ")
		compileCmd = strings.ReplaceAll(compileCmd, "/sandbox/", "/tmp/")
		runCmd := strings.Join(lang.RunCmd, " ")
		runCmd = strings.ReplaceAll(runCmd, "/sandbox/", "/tmp/")
		shellCmd = fmt.Sprintf(`cat > %s <<'__CODE__'
%s
__CODE__
%s && %s`, filename, code, compileCmd, runCmd)
	} else {
		// Interpreted language: write and run
		runCmd := strings.Join(lang.RunCmd, " ")
		runCmd = strings.ReplaceAll(runCmd, "/sandbox/", "/tmp/")
		shellCmd = fmt.Sprintf(`cat > %s <<'__CODE__'
%s
__CODE__
%s`, filename, code, runCmd)
	}

	dockerArgs := sandbox.BuildDockerArgs(lang.Image, []string{"sh", "-c", shellCmd})
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
		exitCode := -1
		if cmd.ProcessState != nil {
			exitCode = cmd.ProcessState.ExitCode()
		}
		v := DetermineVerdict(exitCode, stderr.String(), tle, false)
		return v, elapsed, actualOutput, stderr.String()
	}

	if !CompareOutput(actualOutput, tc.Expected) {
		return VerdictWA, elapsed, actualOutput, ""
	}

	return VerdictAC, elapsed, actualOutput, ""
}
