package runner

import (
	"fmt"
	"os"
)

// SandboxConfig builds the Docker run arguments enforcing strict resource isolation.
// Security layers:
//   1. gVisor runtime (runsc) — kernel-level isolation, no host kernel syscalls
//   2. --network=none — zero network access from inside the container
//   3. --read-only — immutable filesystem except /sandbox tmpfs
//   4. --memory + --cpus — hard resource caps
//   5. --pids-limit — prevents fork bombs
//   6. --cap-drop=ALL — drop all Linux capabilities
//   7. --security-opt=no-new-privileges — cannot escalate privileges
type SandboxConfig struct {
	TimeLimitMs   int
	MemoryLimitMB int
	WorkDir       string
}

func (s SandboxConfig) BuildDockerArgs(image string, runCmd []string) []string {
	timeoutSecs := fmt.Sprintf("%ds", s.TimeLimitMs/1000+1)
	memoryLimit := fmt.Sprintf("%dm", s.MemoryLimitMB)

	runtime := os.Getenv("SANDBOX_RUNTIME")
	if runtime == "" {
		runtime = "runsc" // default to gVisor in production
	}

	args := []string{
		"run", "--rm",
		"--runtime=" + runtime, // gVisor (runsc) in prod, runc for local dev
		"--network=none",           // no network
		"--read-only",              // immutable filesystem
		"--tmpfs", "/tmp:size=64m", // writable temp dir
		"--memory", memoryLimit,
		"--memory-swap", memoryLimit, // disable swap
		"--cpus", "0.5",
		"--pids-limit", "50",
		"--cap-drop", "ALL",
		"--security-opt", "no-new-privileges",
		"-v", fmt.Sprintf("%s:/sandbox:ro", s.WorkDir),
		image,
		"timeout", timeoutSecs,
	}

	return append(args, runCmd...)
}
