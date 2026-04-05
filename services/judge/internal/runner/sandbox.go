package runner

import (
	"fmt"
	"os"
)

type SandboxConfig struct {
	TimeLimitMs   int
	MemoryLimitMB int
}

func (s SandboxConfig) BuildDockerArgs(image string, runCmd []string) []string {
	timeoutSecs := fmt.Sprintf("%ds", s.TimeLimitMs/1000+1)
	memoryLimit := fmt.Sprintf("%dm", s.MemoryLimitMB)

	runtime := os.Getenv("SANDBOX_RUNTIME")
	if runtime == "" {
		runtime = "runsc"
	}

	args := []string{
		"run", "--rm", "-i",
		"--runtime=" + runtime,
		"--network=none",
		"--tmpfs", "/tmp:size=64m,exec", // writable + executable for compiled code
		"--memory", memoryLimit,
		"--memory-swap", memoryLimit,
		"--cpus", "0.5",
		"--pids-limit", "50",
		"--cap-drop", "ALL",
		"--security-opt", "no-new-privileges",
		image,
		"timeout", timeoutSecs,
	}

	return append(args, runCmd...)
}
