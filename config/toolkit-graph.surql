-- Toolkit Dependency Graph Schema
-- Namespace: toolkit, Database: graph
-- Idempotent: safe to re-run (uses OVERWRITE)

-- File: represents any file in the toolkit
DEFINE TABLE file SCHEMAFULL;
DEFINE FIELD path ON file TYPE string COMMENT "Relative path from toolkit root";
DEFINE FIELD name ON file TYPE string COMMENT "Basename of the file";
DEFINE FIELD file_type ON file TYPE string COMMENT "hook | tool | guard | lib | config | doc | rule | skill | workflow | context | schema | reference";
DEFINE FIELD content_hash ON file TYPE string COMMENT "Hash of file content for change detection";
DEFINE FIELD last_scanned ON file TYPE datetime;
DEFINE INDEX idx_file_path ON file FIELDS path UNIQUE;
DEFINE INDEX idx_file_type ON file FIELDS file_type;

-- References: directed edge from one file to another
-- "file A references file B" means A contains a reference to B
DEFINE TABLE references TYPE RELATION IN file OUT file SCHEMAFULL;
DEFINE FIELD ref_type ON references TYPE string COMMENT "import | settings_command | doc_mention | config_entry | grep_match";
DEFINE FIELD line ON references TYPE option<int> COMMENT "Line number of the reference";
DEFINE FIELD context ON references TYPE option<string> COMMENT "The line content containing the reference";

-- Settings entry: tracks hook registrations in settings.json
DEFINE TABLE settings_entry SCHEMAFULL;
DEFINE FIELD hook_path ON settings_entry TYPE string COMMENT "Path to the hook file";
DEFINE FIELD event ON settings_entry TYPE string COMMENT "PreToolUse | PostToolUse | SessionStart | PreCompact | Stop | Notification";
DEFINE FIELD matcher ON settings_entry TYPE option<string> COMMENT "Tool matcher pattern (e.g., Bash, Edit|Write)";
DEFINE FIELD command ON settings_entry TYPE string COMMENT "Full command string from settings.json";
DEFINE INDEX idx_settings_hook ON settings_entry FIELDS hook_path;
