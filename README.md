<p align="center">
  <img src="assets/banner.png" alt="discli — Discord Server Management CLI" width="100%">
</p>

<p align="center">
  <strong>Discord server management CLI — built for AI agents and humans.</strong>
</p>

Create channels, manage roles, set permissions, and control your Discord servers entirely from the terminal. No bot server needed. No dashboard clicking. Just commands.

> Your AI agent (Claude Code, Cursor, Windsurf, Codex) can use discli to manage your Discord server — create channels, assign roles, rename everything — in seconds, not minutes.

---

## Why discli?

Setting up a Discord server manually is slow. Using bots for management is limited. MCP tools eat your token budget.

discli gives you (and your AI agent) direct control over Discord through simple CLI commands:

```bash
discli channel create "💬・general" --category "Community"
discli role create "Moderator" --color "#ff5733"
discli perm lock "📜・rules"
discli channel rename "old-name" "🎯・new-name"
```

**One command = one API call. No bot server running. No token overhead. No UI clicking.**

---

## Quick Start

```bash
# Install
npm install -g discli

# Setup (paste your bot token)
discli init --token YOUR_BOT_TOKEN

# Start managing
discli channel list
discli server info
```

<details>
<summary><strong>Getting a bot token</strong></summary>

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **Bot** → **Reset Token** → copy it
4. Go to **Installation** → set **Guild Install** scopes: `bot`, `applications.commands` with **Administrator** permission
5. Use the install link to add the bot to your server
6. Run `discli init --token YOUR_TOKEN`

</details>

---

## Commands

### Server

```bash
discli server list              # List servers the bot is in
discli server select <id>       # Set default server
discli server info              # Server overview (members, boosts, etc.)
```

### Channels

```bash
discli channel list                          # List all channels by category
discli channel create <name>                 # Create text channel
discli channel create <name> --type voice    # Create voice channel
discli channel create <name> --category Dev  # Create under category
discli channel create "Dev" --type category  # Create a category
discli channel rename <channel> <new-name>   # Rename channel
discli channel topic <channel> "topic text"  # Set channel topic
discli channel move <channel> --category X   # Move to category
discli channel delete <channel> --confirm    # Delete (requires --confirm)
```

### Roles

```bash
discli role list                            # List all roles
discli role create <name>                   # Create role
discli role create <name> --color "#e74c3c" # Create with color
discli role assign <role> <user>            # Give role to member
discli role remove <role> <user>            # Remove role from member
discli role delete <name> --confirm         # Delete (requires --confirm)
```

### Members

```bash
discli member list                # List members
discli member info <user>         # Member details
discli member nick <user> <nick>  # Change nickname
discli member kick <user> --confirm --reason "spam"  # Kick
discli member ban <user> --confirm                   # Ban
```

### Permissions

```bash
discli perm view <channel>                           # View channel permissions
discli perm lock <channel>                           # Make read-only
discli perm unlock <channel>                         # Remove read-only
discli perm set <channel> <role> --deny send_messages  # Fine-grained control
discli perm list                                     # List permission names
```

---

## For AI Agents

discli is designed to be used by AI coding agents like Claude Code, Cursor, Codex, and others.

### How agents use it

1. **Install the skill** — copy `skills/SKILL.md` to your agent's skill directory
2. **Agent reads the skill** — learns all available commands
3. **Agent runs commands** — manages your server through the terminal

### Agent-friendly features

- **Auto-detect output format** — JSON when piped, table in terminal
- **`-n` flag** — limit results to save tokens
- **`--dry-run`** — preview changes before applying
- **`--confirm` required** — destructive commands never auto-execute
- **Structured exit codes** — `0` success, `1` error, `2` usage, `3` not found, `4` forbidden
- **SCHEMA.md** — documents exact JSON output shapes for predictable parsing
- **No MCP overhead** — zero token cost at session start, just run commands as needed

### Claude Code / Cursor setup

```bash
# Install discli globally
npm install -g discli

# Copy the skill file
cp node_modules/discli/skills/SKILL.md ~/.claude/skills/discli/SKILL.md

# Done — your agent can now use discli
```

### Example: agent sets up an entire server

```
You: "Set up my Discord like a dev community — channels for general chat,
      code help, AI tools, and a read-only announcements channel"

Agent runs:
  discli channel create "Community" --type category
  discli channel create "💬・general" --category Community
  discli channel create "💻・code-help" --category Community
  discli channel create "🤖・ai-tools" --category Community
  discli channel create "📢・announcements" --category Info
  discli perm lock "📢・announcements"
```

---

## Global Flags

| Flag | Description |
|------|-------------|
| `--format <json\|table\|auto>` | Output format (default: auto — JSON when piped, table in terminal) |
| `--server <id>` | Target a specific server |
| `-n <count>` | Limit results on list commands |
| `--dry-run` | Preview changes without applying |
| `--confirm` | Required for destructive actions |

---

## How It Works

discli is not a bot. It's a thin CLI wrapper around the [Discord REST API](https://discord.com/developers/docs/reference).

```
discli channel create "test"
    ↓
POST https://discord.com/api/v10/guilds/{id}/channels
Authorization: Bot {your_token}
Body: {"name": "test", "type": 0}
    ↓
Channel created. Done.
```

No WebSocket connection. No bot process. No server hosting. Your bot can be offline — commands still work.

---

## Bring Your Own Bot

discli uses YOUR bot token. You create the bot, you control the permissions, you own the data. Nothing is sent to us.

```
~/.discli/
├── config.json    # default server
└── .env           # your bot token (never leaves your machine)
```

---

## vs Other Tools

| | discli | Discord MCP | discord-cli | Manual UI |
|---|---|---|---|---|
| **Purpose** | Server management | Server management | Read-only (fetch/search) | Everything |
| **Used by** | Agents + humans | Agents only | Agents + humans | Humans only |
| **Token cost** | Zero upfront | 20-40k tokens on load | Zero upfront | N/A |
| **Speed** | Instant | Instant | Instant | Slow (clicking) |
| **Create channels** | ✅ | ✅ | ❌ | ✅ |
| **Manage roles** | ✅ | ✅ | ❌ | ✅ |
| **Set permissions** | ✅ | ✅ | ❌ | ✅ |
| **Read messages** | ❌ (coming) | ✅ | ✅ | ✅ |
| **Self-hosted** | ✅ | ✅ | ✅ | N/A |

---

## Roadmap

- [ ] Message management (send, pin, delete)
- [ ] Webhook management
- [ ] Scheduled events
- [ ] Automod rules
- [ ] Server templates (export/import structure)
- [ ] `discli setup` — interactive guided server setup

---

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/ibbybuilds">@ibbybuilds</a> — tired of clicking through Discord settings.
</p>
