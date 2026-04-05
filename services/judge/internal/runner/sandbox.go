package runner

import (
	"fmt"
	"os"
	"strings"
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
	WorkDir       string // path inside the shared volume (e.g., /judge-work/judge-xxx)
}

// volumeName returns the Docker volume name for the judge work directory.
// In docker-compose, volumes are prefixed with the project name.
func volumeName() string {
	name := os.Getenv("JUDGE_VOLUME_NAME")
	if name == "" {
		name = "prepforall_judge-work"
	}
	return name
}

func (s SandboxConfig) BuildDockerArgs(image string, runCmd []string) []string {
	timeoutSecs := fmt.Sprintf("%ds", s.TimeLimitMs/1000+1)
	memoryLimit := fmt.Sprintf("%dm", s.MemoryLimitMB)

	runtime := os.Getenv("SANDBOX_RUNTIME")
	if runtime == "" {
		runtime = "runsc" // default to gVisor in production
	}

	args := []string{
		"run", "--rm", "-i",
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
		"--mount", fmt.Sprintf("type=volume,source=%s,target=/judge-work,readonly", volumeName()),
		image,
		"timeout", timeoutSecs,
	}

	// Rewrite /sandbox references in runCmd to the actual work directory
	rewritten := make([]string, len(runCmd))
	for i, arg := range runCmd {
		rewritten[i] = strings.ReplaceAll(arg, "/sandbox", s.WorkDir)
	}

	return append(args, rewritten...)
}
