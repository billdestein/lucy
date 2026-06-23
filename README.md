# The Lucy Experiment

I've been working as a full-stack developer for almost two decades.  I've used Claude for code reviews,
test case generation, and various refactoring chores.  It was on May 5, 2026 that I asked myself,
"Can I use Claude to develop an entire three-tier application without writing a single line of code?"
More specifically:

- Can I singlehandedly create a three-tier application from scratch in seven calendar days?
- The three-tier application is a chatbot for image processing.  Her name is Lucy.
- Lucy allows users to generate, mutate, and combine images.
- Claude Code is used for code generation.
- Gemini APIs are called from the Lucy backend for image processing.
- Lucy is a public facing app, so it must use current best practices for authentication and authorization.

# The result:

With help from Claude, I successfully produced Lucy in nine calendar days.  Lucy is 100% generated code.

You can find the app running here:  https://lucythebot.com

The Git repo is here:  https://github.com/billdestein/lucy

In the Git repo, you'll find:

- The prompts used to create the application.  See the learn/ folder
- The generated code,  See the src/ folder
- Claude's comments on the project.  This README.md

To generate the code from the prompts, 

- Clone the git repo
- cd lucy
- start Claude and enter, "read and execute the file 'joy' "

# Claude's thoughts on The Lucy Experiment:

I instructed Claude: "Read all of the code in this folder and share your thoughts on the Lucy project
and how it compares to current best practives."

Claude responded:

That's a more interesting question. Here are my honest thoughts.

The core idea is genuinely novel

Most "AI-assisted development" still treats code as the source of truth and AI as a faster typist. Lucy inverts that. The learn/ files are the authoritative artifact — they express intent, constraints, and rationale in prose. The code in lucy/ is closer to a build output. That's a meaningful philosophical shift, not just a workflow tweak.

The .joy.ts format is clever

Specs are TypeScript modules — they can be imported, composed, and passed to a model programmatically via index.joy.ts. They're not markdown files sitting in a wiki somewhere, disconnected from the build process. Keeping them as typed modules means the spec itself is part of the package graph.

Committing specs and code together in the same repo is the right call

The git history becomes a record of intent, not just change. When you look at a commit, you see both what was specified and what was generated. Future developers (or future sessions) can read the spec to understand why the code looks the way it does, rather than reverse-engineering intent from implementation. This is solving a problem that documentation almost always fails to solve.

The backport discipline is load-bearing

The whole methodology depends on keeping specs accurate. When we fixed the clone bug or the prompt history corruption, we immediately updated the spec. If that step gets skipped — especially under time pressure — specs drift and the next regeneration produces something subtly wrong. The CLAUDE.md instruction to backport is the right instinct, but it requires consistent enforcement.

The regeneration story is still somewhat theoretical

In practice, the code has been iteratively patched rather than regenerated from scratch. The fixes this session (upsert, empty prompt filtering, pic sort) were made directly to the code, then backported to the spec — not the other way around. That's pragmatic, but it means the spec is more of a living document than a true source from which code can be cleanly regenerated at any time. Verifying that the spec is actually sufficient to regenerate the current code would be a meaningful test.

The development velocity is striking

Features that would take a team days to design, implement, review, and document are happening in single conversations. The bottleneck shifts from "writing code" to "clarifying intent" — which is where it probably should be.

The biggest open question

What happens as the system grows? Right now the spec files fit comfortably in a context window and the code is comprehensible in one session. At some point — more applets, more backend routes, more edge cases — the specs will outgrow a single context, and regenerating from them will require careful sequencing. The index.joy.ts master prompt suggests you've thought about this, but it's the natural scaling challenge for the methodology.

Overall: it's a serious experiment in making AI a first-class participant in software design rather than just an implementation tool. Worth continuing.



✻ Crunched for 3m 11s

