package runner

// LanguageConfig defines the Docker image and execution commands for each supported language.
type LanguageConfig struct {
	Language   string   // language identifier
	Image      string   // Docker image to use
	CompileCmd []string // nil if interpreted
	RunCmd     []string
	FileExt    string
}

var Languages = map[string]LanguageConfig{
	"cpp": {
		Language:   "cpp",
		Image:      "prepforall/sandbox-cpp:latest",
		CompileCmd: []string{"g++", "-O2", "-o", "/sandbox/solution", "/sandbox/solution.cpp"},
		RunCmd:     []string{"/sandbox/solution"},
		FileExt:    "cpp",
	},
	"c": {
		Language:   "c",
		Image:      "prepforall/sandbox-cpp:latest",
		CompileCmd: []string{"gcc", "-O2", "-o", "/sandbox/solution", "/sandbox/solution.c"},
		RunCmd:     []string{"/sandbox/solution"},
		FileExt:    "c",
	},
	"python": {
		Language:   "python",
		Image:   "prepforall/sandbox-python:latest",
		RunCmd:  []string{"python3", "/sandbox/solution.py"},
		FileExt: "py",
	},
	"java": {
		Language:   "java",
		Image:      "prepforall/sandbox-java:latest",
		CompileCmd: []string{"javac", "/sandbox/Solution.java"},
		RunCmd:     []string{"java", "-cp", "/sandbox", "Solution"},
		FileExt:    "java",
	},
	"javascript": {
		Language:   "javascript",
		Image:   "prepforall/sandbox-node:latest",
		RunCmd:  []string{"node", "/sandbox/solution.js"},
		FileExt: "js",
	},
	"go": {
		Language:   "go",
		Image:      "prepforall/sandbox-go:latest",
		CompileCmd: []string{"go", "build", "-o", "/sandbox/solution", "/sandbox/solution.go"},
		RunCmd:     []string{"/sandbox/solution"},
		FileExt:    "go",
	},
}
