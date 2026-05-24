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

(1) The prompts used to create the application.  See the learn/ folder
(2) The generated code,  See the src/ folder
(3) Claude's comments on the project.  See README.md

To generate the code from the prompts, 

- Clone the git repo
- cd lucy
- start Claude and enter, "read and execute the file 'joy' "

# Claude's thoughts on The Lucy Experiment:

I instructed Claude: "Read all of the code in this folder, especially README.md, and share your thoughts"

Claude responded:

---
The meta-level observation

The most interesting thing in this repo isn't Lucy the product — it's the development methodology. The learn/ directory and the joy system represent a "prompts as source of truth" approach: the prompts encode the
specification, the code is a derived artifact, and bug fixes get backported to the prompts so they survive the next regeneration. That's a genuinely novel idea. Most people treat AI-generated code as the output;
you're treating it as a snapshot of the prompts.

The prompts themselves are high-quality engineering documents. They capture why decisions were made — why onMouseDownCapture instead of onMouseDown, why manual PKCE instead of oidc-client-ts, why the Cognito ID token
and not the access token, why skipLibCheck in the tsconfig. That institutional knowledge living in the prompts (not in comments or PRs that rot) is the real value here.

---
The code itself

What's solid:

- The applets windowing system is well-designed. DOM manipulation for drag/resize (bypassing React re-renders) is the right call, and the capture-phase trick for edges is correctly implemented.
- The auth flow is robust — manual PKCE, no broken OIDC libraries, Redis sessions with conditional TLS for local vs. ElastiCache.
- WorkbookContext cleanly avoids prop-drilling through the component tree.
- The idb-keyval cache with composite keys is thoughtful — avoids resending large image blobs across the network on every load.
- Backend is clean: services are well-separated, middleware is minimal, all the fiddly details (tilde expansion, 20mb body limit, frontend static serving) are accounted for.

What's unfinished or worth noting:

1. frames/ is a dead directory. The frontend was migrated to applets but lucy/frames/ still exists. It can be deleted.
2. UploadWorkbookApplet is a stub — it renders the text "UploadWorkbookApplet" and nothing else. The upload workbook button in WorkbookListApplet opens it but nothing happens.
3. referencedPics / multi-modal is scaffolded but not wired. promptProtocol.ts has getOutputFilename but no getReferencedPics. ComposerButtonRowComponent sends referencedPics: [] hardcoded. The backend marks it
unused. The {filename} curly-brace syntax in the prompt spec has no frontend parsing.
4. No delete-pic UI. The backend has a /delete-pic endpoint but PicListComponent has no delete action. The endpoint is unreachable from the UI.
5. Paginator edge case. If focusedIndex === -1 (no focused prompt), ComposerButtonRowComponent shows "0 of N" which looks odd. Should default the display to 1.
6. Frontend error handling is thin. generate-pic errors surface as alert(). Most other fetch failures are silently swallowed. Fine for now, worth noting for hardening.

---
The experiment result

The README says nine days, 100% generated code. Having worked through the prompts with you, I'd say the claim holds up. The architecture is coherent, the hard parts are correctly handled, and the code is production-adjacent (not toy quality). The sessions + Cognito + Redis + EFS + ALB sticky sessions stack is the kind of thing that usually takes days of debugging to get right.

The more interesting claim the experiment implicitly makes: a sufficiently experienced developer can encode their expertise into prompts well enough that the AI becomes a reliable implementation engine. The prompts
in learn/ are doing a lot of work — they're not just descriptions, they're error-preventing constraints derived from real failures. That's the skill that made this work.




