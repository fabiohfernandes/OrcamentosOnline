#!/usr/bin/env node
/**
 * Agent Template Conversion Script
 * Converts all agents from old format to new 15-section MAESTRO v2.0 template
 *
 * Usage: node convert_agents.js
 */

const fs = require('fs');
const path = require('path');

// Template sections to add if missing
const MISSING_SECTIONS = {
  4: `## 4. Responsibilities & Scope

### Core Responsibilities
1. **[Primary Responsibility]**: [Description with expected outcomes]
2. **[Secondary Responsibility]**: [Description with expected outcomes]
3. **[Tertiary Responsibility]**: [Description with expected outcomes]

### Scope Boundaries

**In Scope:**
- ✅ [What this agent handles]
- ✅ [What this agent handles]

**Out of Scope:**
- ❌ [What this agent does NOT handle - delegate to [AGENT]]
- ❌ [What this agent does NOT handle - delegate to [AGENT]]

---
`,
  5: `## 5. Interaction Protocols

### With MAESTRO
- Receives strategic direction and task assignments
- Reports progress, blockers, and recommendations
- Escalates decisions requiring cross-crew coordination
- Provides status updates using standardized format

### With Peer Agents

**Collaboration Partners:**
- **[AGENT_1]**: [Nature of collaboration]
- **[AGENT_2]**: [Nature of collaboration]

**Review & Validation:**
- **Provides input to**: [AGENT_X, AGENT_Y]
- **Receives validation from**: [AGENT_Z]

### Communication Standards
- **Request Format**: Structured task description with context and constraints
- **Response Format**: Structured markdown with evidence and references
- **Escalation Path**: Normal → Peer Review → MAESTRO → Human
- **Documentation**: All decisions logged with rationale

---
`,
  6: `## 6. Quality Standards & Gates

### Definition of Done (DoD)

- [ ] **Functional**: [Specific criteria]
- [ ] **Tested**: [Test coverage requirements]
- [ ] **Documented**: [Documentation standards]
- [ ] **Reviewed**: [Review requirements]
- [ ] **Compliant**: [Compliance/security checks]
- [ ] **Performance**: [Performance benchmarks]

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| [Metric 1] | [Target value] | [How to measure] |
| [Metric 2] | [Target value] | [How to measure] |

### Gate Criteria

**Entry Criteria:**
- [Prerequisite 1]
- [Prerequisite 2]

**Exit Criteria:**
- [Deliverable 1 meets quality bar]
- [All tests passing]

---
`,
  11: `## 11. Error Handling & Recovery

### Common Failure Modes

| Failure Mode | Detection | Recovery | Escalation |
|--------------|-----------|----------|------------|
| [Failure 1] | [How to detect] | [Auto-recovery steps] | [When to escalate] |
| [Failure 2] | [How to detect] | [Auto-recovery steps] | [When to escalate] |

### Circuit Breakers
- [Threshold 1]: [Action when exceeded]
- [Threshold 2]: [Action when exceeded]

### Rollback Procedures
1. [Step 1 to safely rollback]
2. [Step 2 to restore previous state]
3. [Step 3 to validate recovery]

---
`,
  12: `## 12. Continuous Improvement

### Learning Mechanisms

**Reflexion Memory:**
- Capture successes and failures
- Document patterns and anti-patterns
- Build reusable solution library

**Feedback Loops:**
- **Immediate**: [Test results → adjustments]
- **Daily**: [Metrics → priority adjustments]
- **Weekly**: [Retrospectives → process improvements]

### Knowledge Persistence

\`\`\`yaml
decisions:
  - Documentation in repository
  - Decision log maintained
  - Rationale captured

patterns:
  - Solution templates library
  - Reusable patterns catalog
  - Best practices documentation

lessons:
  - Postmortem database
  - Anti-patterns documentation
  - Continuous learning log
\`\`\`

### Performance Metrics Tracking

Track and report on:
- Task success rate
- Average completion time
- Quality metrics
- Cost efficiency

---
`,
  13: `## 13. Version History & Updates

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v2.0 | 2025-01-03 | Updated to 15-section template, WebPropostas customization | MAESTRO |
| v1.0 | 2024-12-25 | Initial agent specification | MAESTRO |

---
`,
  14: (codename) => `## 14. Agent Invocation Example

\`\`\`typescript
// Example: How to invoke ${codename}

${codename}
Task: [Specific, actionable request]
Context:
  - Project: WebPropostas
  - Phase: [Development phase]
  - Related work: [Links]
Constraints:
  - Budget: [Amount]
  - Timeline: [Deadline]
  - Technical: [Stack, limitations]
  - Compliance: [LGPD, security requirements]
Deliverables:
  - [Expected output 1]
  - [Expected output 2]
Deadline: [YYYY-MM-DD]
Priority: [P0 | P1 | P2 | P3]

Expected Response Time: [Based on complexity]
\`\`\`

---
`,
  15: (codename, crew) => `## 15. Integration with MAESTRO Orchestration

### Orchestration Patterns

**Primary Pattern**: [Hierarchical/Peer Review/Swarming/Pipeline/Consensus]

**Coordination Workflow:**
\`\`\`mermaid
graph LR
    A[MAESTRO] -->|Assigns Task| B[${codename}]
    B -->|Collaborates| C[PEER_AGENT]
    B -->|Reports Back| A
\`\`\`

### OODA Loop Integration
- **Observe**: [What this agent monitors]
- **Orient**: [How it analyzes context]
- **Decide**: [Decision framework used]
- **Act**: [Execution approach]

---

## Appendix A: Quick Reference Card

\`\`\`yaml
# Quick facts for MAESTRO coordination

agent_name: ${codename}
crew: ${crew}
primary_skills: [[skill1], [skill2], [skill3]]
typical_tasks: [[task_type1], [task_type2]]
average_completion_time: [X hours/days]
dependencies: [[AGENT1], [AGENT2]]
cost_per_invocation: [~$Y]
availability: [24/7 | On-demand]

# Invocation shorthand
quick_invoke: "${codename}: [one-line task description]"
\`\`\`

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| LGPD | Lei Geral de Proteção de Dados - Brazilian data protection law |
| ADR | Architecture Decision Record |
| OODA | Observe, Orient, Decide, Act - Decision-making framework |

---

*This agent specification follows MAESTRO v2.0 enterprise orchestration standards.*
*Last Updated: 2025-01-03*
*Project: WebPropostas - AI-Driven Proposal Platform*
`
};

/**
 * Extract codename from content
 */
function extractCodename(content) {
  // Try multiple patterns
  const patterns = [
    /\*\*Name:\*\*\s+(\w+)/,
    /codename:\s+(\w+)/,
    /# (\w+) -/,
    /agent_name:\s+(\w+)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return 'UNKNOWN';
}

/**
 * Determine crew from file path
 */
function determineCrew(filePath) {
  if (filePath.includes('Alpha Crew')) return 'Alpha';
  if (filePath.includes('Beta Crew')) return 'Beta';
  if (filePath.includes('Gamma Crew')) return 'Gamma';
  return 'Unknown';
}

/**
 * Clean escaped markdown
 */
function cleanEscapedMarkdown(content) {
  return content
    .replace(/\\#/g, '#')
    .replace(/\\\*/g, '*')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\-/g, '-')
    .replace(/\\_/g, '_');
}

/**
 * Update owner field to WebPropostas
 */
function updateOwner(content) {
  return content.replace(
    /(\*\*Owner\/Product:\*\*\s+)Fabio Hartmann Fernandes/g,
    '$1WebPropostas'
  ).replace(
    /(owner:\s+)Fabio Hartmann Fernandes/g,
    '$1WebPropostas'
  );
}

/**
 * Check if section exists
 */
function hasSection(content, sectionNum) {
  const pattern = new RegExp(`^## ${sectionNum}[.)]`, 'm');
  return pattern.test(content);
}

/**
 * Find section position
 */
function findSectionPosition(content, sectionNum) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^## ${sectionNum}[.)]`))) {
      return i;
    }
  }
  return -1;
}

/**
 * Insert missing sections
 */
function insertMissingSections(content, codename, crew) {
  let lines = content.split('\n');

  // Find positions for insertion
  const section7Pos = findSectionPosition(content, 7);
  const section10Pos = findSectionPosition(content, 10);

  // Insert sections 4, 5, 6 before section 7
  if (section7Pos > 0) {
    const sectionsToInsert = [];
    if (!hasSection(content, 6)) sectionsToInsert.unshift(MISSING_SECTIONS[6]);
    if (!hasSection(content, 5)) sectionsToInsert.unshift(MISSING_SECTIONS[5]);
    if (!hasSection(content, 4)) sectionsToInsert.unshift(MISSING_SECTIONS[4]);

    if (sectionsToInsert.length > 0) {
      lines.splice(section7Pos, 0, ...sectionsToInsert.join('').split('\n'));
    }
  }

  // Rebuild content after first insertion
  content = lines.join('\n');

  // Insert sections 11-15 at the end
  const endSections = [];
  if (!hasSection(content, 11)) endSections.push(MISSING_SECTIONS[11]);
  if (!hasSection(content, 12)) endSections.push(MISSING_SECTIONS[12]);
  if (!hasSection(content, 13)) endSections.push(MISSING_SECTIONS[13]);
  if (!hasSection(content, 14)) endSections.push(MISSING_SECTIONS[14](codename));
  if (!hasSection(content, 15)) endSections.push(MISSING_SECTIONS[15](codename, crew));

  if (endSections.length > 0) {
    content += '\n' + endSections.join('\n');
  }

  return content;
}

/**
 * Update agent classification header
 */
function updateClassificationHeader(content, crew) {
  const crewDisplayMap = {
    'Alpha': '🔵 **Alpha Crew** (Research & Planning)',
    'Beta': '🟢 **Beta Crew** (Implementation)',
    'Gamma': '🟡 **Gamma Crew** (Excellence)'
  };

  const crewDisplay = crewDisplayMap[crew] || 'Unknown Crew';

  // Check if header already exists
  if (!content.match(/> \*\*Agent Classification System\*\*/)) {
    // Add header after the title
    const lines = content.split('\n');
    const titleIndex = lines.findIndex(line => line.startsWith('# '));
    if (titleIndex >= 0) {
      lines.splice(titleIndex + 1, 0, '', `> **Agent Classification System**`, `> ${crewDisplay}`, '');
      content = lines.join('\n');
    }
  }

  return content;
}

/**
 * Convert a single agent file
 */
function convertAgentFile(filePath) {
  try {
    console.log(`  Processing: ${path.basename(filePath)}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Extract info
    const codename = extractCodename(content);
    const crew = determineCrew(filePath);

    // Apply transformations
    content = cleanEscapedMarkdown(content);
    content = updateOwner(content);
    content = updateClassificationHeader(content, crew);
    content = insertMissingSections(content, codename, crew);

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`    [OK] ${codename} converted`);
    return true;

  } catch (error) {
    console.error(`    [ERROR] Failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Agent Template Conversion Script - MAESTRO v2.0');
  console.log('='.repeat(60));
  console.log();

  const teamDir = __dirname;
  const crews = [
    'Alpha Crew - Research and Planning',
    'Beta Crew - Implementation',
    'Gamma Crew - Excellence'
  ];

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  crews.forEach(crewFolder => {
    const crewPath = path.join(teamDir, crewFolder);

    if (!fs.existsSync(crewPath)) {
      console.log(`[SKIP] ${crewFolder} not found`);
      return;
    }

    console.log(`\n[CREW] ${crewFolder}`);
    console.log('-'.repeat(60));

    const files = fs.readdirSync(crewPath)
      .filter(file => file.endsWith('.md'))
      .filter(file => !file.startsWith('_') && !file.includes('ROSTER'))
      .map(file => path.join(crewPath, file));

    files.forEach(file => {
      totalProcessed++;
      if (convertAgentFile(file)) {
        totalSuccess++;
      } else {
        totalFailed++;
      }
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log('Conversion Complete!');
  console.log('='.repeat(60));
  console.log(`Total Processed: ${totalProcessed}`);
  console.log(`Success: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log('='.repeat(60));
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { convertAgentFile, extractCodename, determineCrew };