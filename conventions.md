# Conventions

## Folder Structure
| Folder | Purpose |
|--------|---------|
| hooks/ | Shell scripts triggered by Claude Code events |
| skills/ | Reusable prompt-driven workflows (each in its own subfolder with SKILL.md) |
| rules/ | Persistent instructions loaded every session |
| workflows/ | Multi-step workflow definitions |
| references/ | Reference docs, project catalog, cheat sheets |
| context/ | Context files for various domains |
| knowledge/ | Knowledge base files |
| errors/ | Logged errors from all projects |
| successes/ | Logged wins from all projects |
| retros/ | Project retrospectives |

## Rules
- Always update CHANGELOG.md when modifying hooks or skills
- Do not modify settings.json directly (use the update-config skill)
- Each skill lives in its own subfolder: `skills/<name>/SKILL.md`
- Hook scripts must be executable (chmod +x)
- Test changes by verifying the hook/skill loads correctly in a new session
- Do not delete any files without explicit permission
- The PDF and instructions markdown are generated docs. Update the source, not the output.
