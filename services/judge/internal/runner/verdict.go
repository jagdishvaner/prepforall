package runner

import (
	"strings"
	"unicode"
)

const (
	VerdictAC  = "AC"
	VerdictWA  = "WA"
	VerdictTLE = "TLE"
	VerdictMLE = "MLE"
	VerdictRE  = "RE"
	VerdictCE  = "CE"
)

// CompareOutput normalizes and compares program output with expected output.
// Normalizes trailing whitespace and newlines to avoid false WA verdicts.
func CompareOutput(actual, expected string) bool {
	return normalizeOutput(actual) == normalizeOutput(expected)
}

func normalizeOutput(s string) string {
	lines := strings.Split(strings.TrimRight(s, "\n\r"), "\n")
	var normalized []string
	for _, line := range lines {
		normalized = append(normalized, strings.TrimRightFunc(line, unicode.IsSpace))
	}
	return strings.Join(normalized, "\n")
}

// DetermineVerdict maps exit codes and stderr patterns to verdicts.
func DetermineVerdict(exitCode int, stderr string, timeLimitExceeded, memLimitExceeded bool) string {
	if timeLimitExceeded {
		return VerdictTLE
	}
	if memLimitExceeded {
		return VerdictMLE
	}
	if exitCode != 0 {
		return VerdictRE
	}
	return VerdictAC
}
