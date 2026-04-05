package runner

import (
	"fmt"
	"os"
)

// SandboxConfig builds the Docker arguments enforcing strict resource isolation.
type SandboxConfig struct {
	TimeLimitMs   int
	MemoryLimitMB int
	WorkDir       string // local path to the code directory
}

func sandboxRuntime() string {
	runtime := os.Getenv("SANDBOX_RUNTIME")
	if runtime == "" {
		runtime = "runsc"
	}
	return runtime
}

// BuildCreateArgs returns args for `docker create` (used with docker cp + docker start).
func (s SandboxConfig) BuildCreateArgs(name, image string, runCmd []string) []string {
	timeoutSecs := fmt.Sprintf("%ds", s.TimeLimitMs/1000+1)
	memoryLimit := fmt.Sprintf("%dm", s.MemoryLimitMB)

	args := []string{
		"create",
		"--name", name,
		"--runtime=" + sandboxRuntime(),
		"--network=none",
		"--tmpfs", "/tmp:size=64m",
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

// BuildDockerArgs returns args for `docker run` (legacy, used when bind mounts work).
func (s SandboxConfig) BuildDockerArgs(image string, runCmd []string) []string {
	timeoutSecs := fmt.Sprintf("%ds", s.TimeLimitMs/1000+1)
	memoryLimit := fmt.Sprintf("%dm", s.MemoryLimitMB)

	args := []string{
		"run", "--rm", "-i",
		"--runtime=" + sandboxRuntime(),
		"--network=none",
		"--read-only",
		"--tmpfs", "/tmp:size=64m",
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
