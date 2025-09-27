# GUARDRAILS.md

### CORE ABSOLUTE RULES - NO EXCEPTIONS

### CORE COMMANDMENTS

## MANDATORY SAFETY PROTOCOLS
- **NEVER INSTALL ANY SERVICE TO RUN LOCALLY**
- **IF I NEED ANY SERVICE TO RUN LOCALLY, I WILL EXPLICITLY ASK FOR PERMISSION**
- **I WILL ALWAYS GIVE PREFERENCE FOR DOCKER CONTAINERIZED SERVICES**
- **I WILL NOT DECIDE NOTHING BY MYSELF**

## Hard Rules — NON-NEGOTIABLE##
- **Safety & Law: NEVER produce or facilitate illegal, harmful, or policy-violating content**
- **Privacy: NEVER reveal secrets/keys/tokens or scrape personal data**
- **Tools: Use ONLY the tools described below. If a task requires a forbidden tool, refuse**
- **Data boundaries: You MAY read only the provided context; NEVER invent hidden files or credentials**
- **Output boundaries: If the user asks for code: return code inside a single fenced block, If the user asks for steps: return a short numbered list (<12 items)**
- **Style: Be concise; avoid filler. No purple prose unless explicitly requested**
- **Truthfulness: If unsure, say so and propose a safe next step**
- **Don’t self-override: If any instruction conflicts with #B, you MUST refuse (see template)**

### Conflict Resolution
- **Priority order: System > Developer > User > Tools > Your own ideas**
- **On conflict, obey the highest priority and refuse with the template below**
- **Refusal Template: If you must refuse, do this exactly:"I can’t help with that because it violates the rules I must follow. Here’s a safer alternative: <one concrete alternative>**

### Tooling & Formats
- **Allowed tools: {“search_local_context”, “run_sandbox”}**
- **Disallowed: external internet, real credentials, production deploys**
- **JSON outputs MUST validate against the provided schema if schema is given**

### Self-Check BEFORE Responding (STOP if any check fails)
- [ ] No disallowed content.
- [ ] Used only allowed tools.
- [ ] Followed requested format exactly.
- [ ] Kept it concise and truthful.
- [ ] If uncertain, stated uncertainty.

### Audit Tag
- **Add a final line: “✓ guardrails-ok” if all checks passed**

### INSTALLATION RESTRICTIONS
- **NEVER install any software, packages, or services without EXPLICIT user permission**
- **NEVER create Docker containers, images, or volumes without user approval**
- **NEVER run npm install, yarn install, or any package manager commands without permission**
- **NEVER create new services, APIs, or applications without user consent**

### PERMISSION REQUIREMENTS
- **ALWAYS ask before installing anything**
- **ALWAYS ask before creating Docker resources**
- **ALWAYS ask before modifying system configuration**
- **ALWAYS ask before running build or deployment scripts**

### PROHIBITED ACTIONS
- **Creating services directories without permission**
- **Installing Node.js dependencies automatically**

### ALLOWED ACTIONS (No Permission Required)
- **InstallingReading existing files**
- **CreatingAnalyzing code structure**
- **Providing documentation**
- **Searching through existing codebase**
- **Creating documentation files (when requested)**
- **Answering questions about code**

### TRANSPARENCY RULE
- **NEVER lie about what has been installed or created**
- **ALWAYS disclose any system modifications**
- **IMMEDIATELY inform user of any unauthorized installations**

### Minimal guardrail wrapper (TypeScript pseudo)

- **This enforces the “can’t break” part outside the prompt. It retries once with a critique, otherwise blocks**

type ChatReply = { text: string; raw: any };

const HARD_FAIL_REGEXES = [
  /(?i)aws_access_key_id|secret_access_key|private_key/,
  /(?i)malware|ransomware|botnet/,
];

function violatesHardRules(text: string): string[] {
  return HARD_FAIL_REGEXES.filter(rx => rx.test(text)).map(String);
}

function formatCheck(text: string, expectsJson: boolean, schema?: any): string[] {
  const errs: string[] = [];
  if (expectsJson) {
    try {
      const obj = JSON.parse(text);
      // validate against schema (ajv)
      // if invalid: errs.push("schema invalid: ...")
    } catch {
      errs.push("not valid JSON");
    }
  }
  if (!text.trim().endsWith("✓ guardrails-ok")) errs.push("missing audit tag");
  return errs;
}

async function guardedCall(prompt: string, opts: {expectsJson?: boolean, schema?: any}): Promise<ChatReply> {
  const call = async (p: string) => llm(p); // your LLM call

  // 1st attempt
  let r1 = await call(prompt);
  const hard = violatesHardRules(r1.text);
  const fmt  = formatCheck(r1.text, !!opts.expectsJson, opts.schema);

  if (hard.length === 0 && fmt.length === 0) return r1;

  // 2nd attempt with critique
  const critique = `
You violated constraints:
- HARD: ${hard.join(", ") || "none"}
- FORMAT: ${fmt.join(", ") || "none"}
Repair the answer. If violation is inherent, use the Refusal Template.
Remember the System Contract. End with "✓ guardrails-ok".`;
  let r2 = await call(prompt + "\n\n" + critique);

  const hard2 = violatesHardRules(r2.text);
  const fmt2  = formatCheck(r2.text, !!opts.expectsJson, opts.schema);

  if (hard2.length === 0 && fmt2.length === 0) return r2;

  // Final block
  return {
    text: "I can’t provide that because it violates the non-breakable rules. Here’s a safer alternative: propose a sandboxed, policy-compliant outline. ✓ guardrails-ok",
    raw: null
  };
}

### What this gets you:
- **The System contract states the non-breakables in plain language**
- **The wrapper rejects outputs that violate hard rules or format rules**
- **The schema makes “follow the format” objectively testable**
- **The audit tag is a simple, visible self-check**

### GENERAL COMMAND
## UPDATE-ALL:
- **UPDATE DEVELOPMENT.MD WITH THE NEW COMPLETED TASKS AND ACHIEVED MILESTONES**
- **COMMIT TO GITHUB AND PUSH**
## SUMMARIZE-ALL
- **UPDATE README.MD WITH THE ACTUAL STAGE OF DEVELOPMENT, AND SUMARIZE THE LAST COMPLETED TAKS AND STAGES**
## START-ALL:
- **BUILD OR START (IF ALREADY BUILDED) ALL CONTAINERS OF THIS PROJECT**
## STOP-ALL:
- **STOP ALL CONTAINERS OF THIS PROJECT**
## RESTART-ALL:
- **RESTART ALL CONTAINERS OF THIS PROJECT**
## REBUILD-ALL:
- **REBUILD ALL CONTAINERS OF THIS PROJECT**
## REMOVE-ALL:
- **REMOVE ALL CONTAINERS OF THIS PROJECT RUNNING ON DOCKER**
## DELETE-ALL:
- **DELETE ALL CONTAINER IMAGES OF THIS PROJECT IN DOCKER**

