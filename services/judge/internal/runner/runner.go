package runner

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
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

	caseResults, compileErr := r.runAllTestCases(ctx, sandbox, lang, req.Code, req.TestCases)

	if compileErr != "" {
		result.Verdict = VerdictCE
		result.ErrorMsg = compileErr
		return result
	}

	for i, cr := range caseResults {
		if cr.RuntimeMs > result.RuntimeMs {
			result.RuntimeMs = cr.RuntimeMs
		}

		if isRunMode {
			result.CaseResults = append(result.CaseResults, CaseResult{
				Index:          i,
				Verdict:        cr.Verdict,
				Input:          req.TestCases[i].Input,
				ExpectedOutput: req.TestCases[i].Expected,
				ActualOutput:   cr.Output,
				RuntimeMs:      cr.RuntimeMs,
			})
		}

		if cr.Verdict == VerdictAC {
			result.PassedCases++
		} else if !isRunMode {
			result.Verdict = cr.Verdict
			result.Output = cr.Output
			result.ErrorMsg = cr.Stderr
			return result
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

type caseOutput struct {
	Verdict   string
	Output    string
	Stderr    string
	RuntimeMs int
	ExitCode  int
}

// runAllTestCases runs all test cases in a single Docker container.
// This avoids repeated Docker startup + compilation overhead.
func (r *Runner) runAllTestCases(ctx context.Context, sandbox SandboxConfig, lang LanguageConfig, code string, testCases []TestCaseInput) ([]caseOutput, string) {
	shellScript := buildBatchScript(lang, code, testCases, sandbox.TimeLimitMs)

	// Overall container timeout: per-case timeout * num cases + 30s for compile + startup
	perCaseTimeout := sandbox.TimeLimitMs/1000 + 1
	overallTimeout := perCaseTimeout*len(testCases) + 30
	dockerArgs := sandbox.BuildDockerArgs(lang.Image, []string{"sh", "-c", shellScript})
	// Replace the per-case timeout in docker args with overall timeout
	for i, arg := range dockerArgs {
		if arg == "timeout" && i+1 < len(dockerArgs) {
			dockerArgs[i+1] = fmt.Sprintf("%ds", overallTimeout)
			break
		}
	}

	cmd := exec.CommandContext(ctx, "docker", dockerArgs...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	start := time.Now()
	err := cmd.Run()
	elapsed := int(time.Since(start).Milliseconds())

	output := stdout.String()

	// Check for compile error
	if strings.Contains(output, "---CE_START---") {
		ceMsg := extractBetween(output, "---CE_START---", "---CE_END---")
		return nil, strings.TrimSpace(ceMsg)
	}

	// If Docker itself failed (not the test cases)
	if err != nil && !strings.Contains(output, "---CASE:") {
		r.log.Error("docker execution failed",
			zap.Int("elapsed_ms", elapsed),
			zap.String("stderr", stderr.String()),
		)
		results := make([]caseOutput, len(testCases))
		for i := range results {
			results[i] = caseOutput{Verdict: VerdictRE, Stderr: stderr.String(), RuntimeMs: elapsed}
		}
		return results, ""
	}

	// Parse structured output
	return parseBatchOutput(output, testCases, sandbox.TimeLimitMs), ""
}

// buildBatchScript creates a shell script that compiles once and runs all test cases.
func buildBatchScript(lang LanguageConfig, code string, testCases []TestCaseInput, timeLimitMs int) string {
	var sb strings.Builder

	filename := fmt.Sprintf("/tmp/solution.%s", lang.FileExt)
	if lang.Language == "java" {
		filename = "/tmp/Solution.java"
	}

	// Timing function using /proc/uptime (available in Linux containers)
	sb.WriteString("get_ms() { awk '{print int($1 * 1000)}' /proc/uptime; }\n")

	// Write code to file using base64 to avoid heredoc escaping issues
	encoded := base64.StdEncoding.EncodeToString([]byte(code))
	sb.WriteString(fmt.Sprintf("echo '%s' | base64 -d > %s\n", encoded, filename))

	// Compile if needed
	if lang.CompileCmd != nil {
		compileCmd := strings.Join(lang.CompileCmd, " ")
		compileCmd = strings.ReplaceAll(compileCmd, "/sandbox/", "/tmp/")
		sb.WriteString(fmt.Sprintf("%s 2>/tmp/ce_err\n", compileCmd))
		sb.WriteString("if [ $? -ne 0 ]; then\n")
		sb.WriteString("  echo '---CE_START---'\n")
		sb.WriteString("  cat /tmp/ce_err\n")
		sb.WriteString("  echo '---CE_END---'\n")
		sb.WriteString("  exit 0\n")
		sb.WriteString("fi\n")
	}

	runCmd := strings.Join(lang.RunCmd, " ")
	runCmd = strings.ReplaceAll(runCmd, "/sandbox/", "/tmp/")
	perCaseTimeout := timeLimitMs/1000 + 1

	// Write test inputs as base64-encoded files
	for i, tc := range testCases {
		encodedInput := base64.StdEncoding.EncodeToString([]byte(tc.Input))
		sb.WriteString(fmt.Sprintf("echo '%s' | base64 -d > /tmp/input_%d\n", encodedInput, i))
	}

	// Run each test case
	for i := range testCases {
		sb.WriteString(fmt.Sprintf("T0=$(get_ms)\n"))
		sb.WriteString(fmt.Sprintf("timeout %d %s < /tmp/input_%d > /tmp/out_%d 2>/tmp/err_%d\n", perCaseTimeout, runCmd, i, i, i))
		sb.WriteString(fmt.Sprintf("EC=$?\n"))
		sb.WriteString(fmt.Sprintf("T1=$(get_ms)\n"))
		sb.WriteString(fmt.Sprintf("ELAPSED=$((T1 - T0))\n"))
		sb.WriteString(fmt.Sprintf("echo \"---CASE:%d:$EC:$ELAPSED---\"\n", i))
		sb.WriteString(fmt.Sprintf("cat /tmp/out_%d\n", i))
		sb.WriteString(fmt.Sprintf("echo '---STDERR:%d---'\n", i))
		sb.WriteString(fmt.Sprintf("cat /tmp/err_%d\n", i))
		sb.WriteString(fmt.Sprintf("echo '---END:%d---'\n", i))
	}

	return sb.String()
}

var caseHeaderRe = regexp.MustCompile(`---CASE:(\d+):(\d+):(\d+)---`)

// parseBatchOutput parses the structured output from the batch shell script.
func parseBatchOutput(output string, testCases []TestCaseInput, timeLimitMs int) []caseOutput {
	results := make([]caseOutput, len(testCases))

	// Split output by case markers
	for i := range testCases {
		caseMarker := fmt.Sprintf("---CASE:%d:", i)
		stderrMarker := fmt.Sprintf("---STDERR:%d---", i)
		endMarker := fmt.Sprintf("---END:%d---", i)

		caseIdx := strings.Index(output, caseMarker)
		if caseIdx == -1 {
			// Case didn't produce output (overall TLE or crash)
			results[i] = caseOutput{Verdict: VerdictRE, RuntimeMs: timeLimitMs}
			continue
		}

		// Extract header line
		headerEnd := strings.Index(output[caseIdx:], "\n")
		if headerEnd == -1 {
			results[i] = caseOutput{Verdict: VerdictRE}
			continue
		}
		header := output[caseIdx : caseIdx+headerEnd]
		matches := caseHeaderRe.FindStringSubmatch(header)
		if len(matches) != 4 {
			results[i] = caseOutput{Verdict: VerdictRE}
			continue
		}

		exitCode, _ := strconv.Atoi(matches[2])
		runtimeMs, _ := strconv.Atoi(matches[3])

		// Extract stdout (between header newline and stderr marker)
		outStart := caseIdx + headerEnd + 1
		stderrIdx := strings.Index(output[outStart:], stderrMarker)
		stdout := ""
		if stderrIdx != -1 {
			stdout = output[outStart : outStart+stderrIdx]
		}

		// Extract stderr (between stderr marker and end marker)
		stderrStart := strings.Index(output, stderrMarker)
		endIdx := strings.Index(output, endMarker)
		stderrContent := ""
		if stderrStart != -1 && endIdx != -1 {
			stderrStart += len(stderrMarker) + 1 // skip newline
			if stderrStart < endIdx {
				stderrContent = output[stderrStart:endIdx]
			}
		}

		tle := runtimeMs >= timeLimitMs

		if exitCode != 0 || tle {
			verdict := DetermineVerdict(exitCode, stderrContent, tle, false)
			results[i] = caseOutput{
				Verdict:   verdict,
				Output:    stdout,
				Stderr:    strings.TrimSpace(stderrContent),
				RuntimeMs: runtimeMs,
				ExitCode:  exitCode,
			}
		} else if !CompareOutput(stdout, testCases[i].Expected) {
			results[i] = caseOutput{
				Verdict:   VerdictWA,
				Output:    stdout,
				RuntimeMs: runtimeMs,
			}
		} else {
			results[i] = caseOutput{
				Verdict:   VerdictAC,
				Output:    stdout,
				RuntimeMs: runtimeMs,
			}
		}
	}

	return results
}

func extractBetween(s, start, end string) string {
	si := strings.Index(s, start)
	if si == -1 {
		return ""
	}
	si += len(start)
	ei := strings.Index(s[si:], end)
	if ei == -1 {
		return s[si:]
	}
	return s[si : si+ei]
}
