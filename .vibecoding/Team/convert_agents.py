#!/usr/bin/env python3
"""
Agent Template Conversion Script
Converts all agents from old format to new 15-section template
"""

import os
import re
from pathlib import Path
from datetime import datetime

# Template sections for the new format
TEMPLATE_SECTIONS = {
    4: """## 4. Responsibilities & Scope

### Core Responsibilities
1. **[Primary Responsibility]**: [Description with expected outcomes]
2. **[Secondary Responsibility]**: [Description with expected outcomes]
3. **[Tertiary Responsibility]**: [Description with expected outcomes]

### Scope Boundaries

**In Scope:**
- ✅ [What this agent handles]
- ✅ [What this agent handles]
- ✅ [What this agent handles]

**Out of Scope:**
- ❌ [What this agent does NOT handle - delegate to [AGENT]]
- ❌ [What this agent does NOT handle - delegate to [AGENT]]

---
""",
    5: """## 5. Interaction Protocols

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
- **Escalation Path**: [Normal → Peer Review → MAESTRO → Human]
- **Documentation**: All decisions logged with rationale

---
""",
    6: """## 6. Quality Standards & Gates

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
""",
    11: """## 11. Error Handling & Recovery

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
""",
    12: """## 12. Continuous Improvement

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

```yaml
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
```

### Performance Metrics Tracking

Track and report on:
- Task success rate
- Average completion time
- Quality metrics
- Cost efficiency

---
""",
    13: """## 13. Version History & Updates

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v2.0 | 2025-01-03 | Updated to 15-section template, OrçamentosOnline customization | MAESTRO |
| v1.0 | 2024-12-25 | Initial agent specification | MAESTRO |

---
""",
    14: """## 14. Agent Invocation Example

```typescript
// Example: How to invoke this agent

[CODENAME]
Task: [Specific, actionable request]
Context:
  - Project: OrçamentosOnline
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
```

---
""",
    15: """## 15. Integration with MAESTRO Orchestration

### Orchestration Patterns

**Primary Pattern**: [Hierarchical/Peer Review/Swarming/Pipeline/Consensus]

**Coordination Workflow:**
```mermaid
graph LR
    A[MAESTRO] -->|Assigns Task| B[THIS_AGENT]
    B -->|Collaborates| C[PEER_AGENT]
    B -->|Reports Back| A
```

### OODA Loop Integration
- **Observe**: [What this agent monitors]
- **Orient**: [How it analyzes context]
- **Decide**: [Decision framework used]
- **Act**: [Execution approach]

---

## Appendix A: Quick Reference Card

```yaml
# Quick facts for MAESTRO coordination

agent_name: [CODENAME]
crew: [Alpha | Beta | Gamma]
primary_skills: [[skill1], [skill2], [skill3]]
typical_tasks: [[task_type1], [task_type2]]
average_completion_time: [X hours/days]
dependencies: [[AGENT1], [AGENT2]]
cost_per_invocation: [~$Y]
availability: [24/7 | On-demand]

# Invocation shorthand
quick_invoke: "[CODENAME]: [one-line task description]"
```

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
*Project: OrçamentosOnline - AI-Driven Proposal Platform*
"""
}


def extract_agent_info(content):
    """Extract key information from agent content"""
    info = {
        'codename': '',
        'role': '',
        'crew': '',
        'description': '',
        'values': [],
        'expertises': [],
        'tools': '',
        'requirements': [],
        'deliverables': '',
        'conventions': '',
        'acceptance': '',
    }

    # Extract codename from title or name field
    name_match = re.search(r'\*\*Name:\*\*\s*(\w+)', content)
    if name_match:
        info['codename'] = name_match.group(1)

    # Extract role
    role_match = re.search(r'\*\*Name:\*\*\s*\w+\s*[—-]\s*(.+?)(?:\n|\*\*)', content)
    if role_match:
        info['role'] = role_match.group(1).strip()

    return info


def determine_crew(file_path):
    """Determine crew based on file path"""
    if 'Alpha Crew' in file_path:
        return 'Alpha', '🔵 **Alpha Crew** (Research & Planning)'
    elif 'Beta Crew' in file_path:
        return 'Beta', '🟢 **Beta Crew** (Implementation)'
    elif 'Gamma Crew' in file_path:
        return 'Gamma', '🟡 **Gamma Crew** (Excellence)'
    return 'Unknown', 'Unknown Crew'


def clean_escaped_markdown(content):
    """Remove escaped markdown characters"""
    content = content.replace('\\*\\*', '**')
    content = content.replace('\\#\\#', '##')
    content = content.replace('\\[', '[')
    content = content.replace('\\]', ']')
    content = content.replace('\\-', '-')
    content = content.replace('\\_', '_')
    return content


def update_identity_section(content, codename, role, crew_name, file_path):
    """Update section 0/1 to new YAML format"""
    crew_short, crew_display = determine_crew(file_path)

    yaml_identity = f"""```yaml
codename: {codename}
role: {role}
crew: {crew_short}
version: v2.0
classification: {'Research/Planning' if crew_short == 'Alpha' else 'Implementation' if crew_short == 'Beta' else 'Quality/Excellence'}
owner: OrçamentosOnline
languages:
  primary: en
  secondary: pt-BR
  auto_detect: true
location: .vibecoding/Team/{crew_name}/
```"""

    return yaml_identity


def has_section(content, section_num):
    """Check if content already has a specific section"""
    pattern = f"## {section_num}[.)\\s]"
    return bool(re.search(pattern, content))


def insert_missing_sections(content, codename):
    """Insert missing sections 4, 5, 6, 11-15"""
    lines = content.split('\n')
    new_content = []
    current_section = 0

    for line in lines:
        # Detect section headers
        section_match = re.match(r'##\s*(\d+)[.)]\s*', line)
        if section_match:
            current_section = int(section_match.group(1))

            # Insert missing sections before this one
            if current_section == 7 and not has_section(content, 4):
                # Insert sections 4, 5, 6
                new_content.append(TEMPLATE_SECTIONS[4])
                new_content.append(TEMPLATE_SECTIONS[5])
                new_content.append(TEMPLATE_SECTIONS[6])
            elif current_section == 10 and not has_section(content, 11):
                # After section 10, insert 11-15
                pass  # Will be added at the end

        new_content.append(line)

    # Add sections 11-15 at the end if not present
    content_str = '\n'.join(new_content)
    if not has_section(content_str, 11):
        for section_num in [11, 12, 13, 14, 15]:
            new_content.append(TEMPLATE_SECTIONS[section_num].replace('[CODENAME]', codename))

    return '\n'.join(new_content)


def convert_agent_file(file_path):
    """Convert a single agent file to new format"""
    print(f"Processing: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Clean escaped markdown
        content = clean_escaped_markdown(content)

        # Extract info
        info = extract_agent_info(content)
        codename = info['codename']
        role = info['role']

        # Get crew info
        crew_name = ''
        if 'Alpha Crew' in file_path:
            crew_name = 'Alpha Crew - Research and Planning'
        elif 'Beta Crew' in file_path:
            crew_name = 'Beta Crew - Implementation'
        elif 'Gamma Crew' in file_path:
            crew_name = 'Gamma Crew - Excellence'

        # Insert missing sections
        content = insert_missing_sections(content, codename)

        # Update owner references
        content = re.sub(
            r'\*\*Owner/Product:\*\*\s*Fabio Hartmann Fernandes',
            '**Owner/Product:** OrçamentosOnline',
            content
        )

        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  [OK] Converted: {codename}")
        return True

    except Exception as e:
        print(f"  [ERROR] Error processing {file_path}: {e}")
        return False


def main():
    """Main conversion process"""
    print("=" * 60)
    print("Agent Template Conversion Script")
    print("Converting agents to 15-section MAESTRO v2.0 format")
    print("=" * 60)
    print()

    base_path = Path(".vibecoding/Team")

    # Find all agent files
    agent_files = []
    for crew_folder in ['Alpha Crew - Research and Planning',
                        'Beta Crew - Implementation',
                        'Gamma Crew - Excellence']:
        crew_path = base_path / crew_folder
        if crew_path.exists():
            for file in crew_path.glob("*.md"):
                if file.stem not in ['_AGENT_TEMPLATE', 'AGENT_ROSTER']:
                    agent_files.append(str(file))

    print(f"Found {len(agent_files)} agents to convert\n")

    # Convert each agent
    success_count = 0
    failed_count = 0

    for i, file_path in enumerate(agent_files, 1):
        print(f"[{i}/{len(agent_files)}] ", end='')
        if convert_agent_file(file_path):
            success_count += 1
        else:
            failed_count += 1

    print()
    print("=" * 60)
    print(f"Conversion Complete!")
    print(f"  [SUCCESS]: {success_count}")
    print(f"  [FAILED]: {failed_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()