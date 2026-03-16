---
name: discli
description: |
  Discord server management CLI. Use when you need to manage Discord servers —
  channels, roles, permissions, messages, embeds, file uploads, emojis, invites,
  audit logs, server settings. Send images, bulk delete, search messages, clone
  channels, upload custom emojis, change server icons. One command = one API call.
  Run discli --help or discli <command> --help to discover subcommands.
---

# discli — Discord Server Management CLI

Control Discord servers from the terminal. Works for both humans and AI agents.

## Agent Defaults

- Output is auto-detected: YAML when piped (agent), table in terminal (human).
- YAML is the preferred format for agents — 5x fewer tokens than JSON.
- Use `-n` to limit results and keep token usage low.
- Use `--format yaml` to force structured output, `--format json` if you need strict JSON.
- Use `--dry-run` on create/rename/permission commands to preview changes.
- Destructive commands (delete, kick, ban) require `--confirm` — they will NOT prompt.
- See SCHEMA.md for output shapes.

## Install / Update

```bash
npm install -g @ibbybuilds/discli         # Install
npm install -g @ibbybuilds/discli@latest   # Update to latest
```

If discli is not installed, install it first before running any commands.

**Windows:** Prefer Git Bash over PowerShell. Git Bash handles UTF-8, quoting, and special characters correctly out of the box. PowerShell has encoding issues (garbled emojis), quoting issues (special chars like `&`, `$`, `=` break messages), and argument expansion problems with long text.

If you must use PowerShell, run this at session start:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```
And use single quotes for message content to avoid special character expansion.
First-time setup: [docs/BOT_SETUP.md](https://github.com/ibbybuilds/discli/blob/master/docs/BOT_SETUP.md)

## Message Limits

- Message content: 2,000 characters max
- Embed description: 4,096 characters max
- Embed total (all fields combined): 6,000 characters max
- Max 10 embeds per message

If your message exceeds 2,000 characters, split it into multiple `msg send` calls. For longer content, use `msg embed` with --description (up to 4,096 chars). Never truncate silently.

## Quick Reference

```bash
discli init --token <token>           # First-time setup
discli server list                    # List servers
discli server select <id>             # Set default server
discli server info                    # Server overview
discli server set --name "X"         # Change server name
discli server set --description "X"  # Set description
discli server set --verification medium  # Verification level
discli server set --notifications only_mentions  # Notification default
discli server icon ./logo.png            # Change server icon

discli invite list                    # List all invites
discli invite create <channel>        # Create invite
discli invite create <ch> --max-age 3600 --max-uses 10  # With limits
discli invite delete <code> --confirm # Delete invite

discli channel list                   # List channels
discli channel create <name>          # Create channel (--type, --category, --topic)
discli channel delete <name>          # Delete channel (--confirm required)
discli channel rename <ch> <name>     # Rename channel
discli channel topic <ch> <text>      # Set topic
discli channel move <ch>              # Move to category (--category, --position)
discli channel clone <ch>             # Clone channel with same settings
discli channel slowmode <ch> <sec>    # Set slowmode (0 to disable)

discli role list                      # List roles
discli role create <name>             # Create role (--color, --mentionable)
discli role edit <name> --color "#hex" --name "New"  # Edit role
discli role delete <name>             # Delete role (--confirm required)
discli role assign <role> <user>      # Give role to member
discli role remove <role> <user>      # Remove role from member

discli member list                    # List members
discli member info <user>             # Member details
discli member kick <user>             # Kick (--confirm, --reason)
discli member ban <user>              # Ban (--confirm, --reason)
discli member nick <user> <nick>      # Change nickname

discli perm view <channel>            # View channel permissions
discli perm set <ch> <role>           # Set permissions (--allow, --deny)
discli perm lock <channel>            # Make read-only for @everyone
discli perm unlock <channel>          # Remove read-only
discli perm list                      # List available permission names

discli msg send <channel> "text"      # Send message
discli msg send <ch> "text" --reply <id>  # Reply to message
discli msg send <ch> "text" --file ./img.png  # Send with file attachment
discli msg send <ch> --file ./a.png --file ./b.pdf  # Multiple files
discli msg embed <ch> --title "X" --description "Y" --color "#hex"  # Rich embed
discli msg embed <ch> --title "X" --image ./local.png  # Embed with local image
discli msg embed <ch> --title "X" --field "Name|Value|inline"       # Embed with fields
discli msg search <ch> "keyword"      # Search messages by keyword
discli msg read <channel> -n 10       # Read last N messages
discli msg edit <ch> <msg-id> "new"   # Edit bot message
discli msg delete <ch> <id> --confirm # Delete message
discli msg bulk-delete <ch> -n 10 --confirm  # Delete multiple messages
discli msg react <ch> <id> 👍         # Add reaction
discli msg unreact <ch> <id> 👍       # Remove reaction
discli msg pin <ch> <id>              # Pin message
discli msg unpin <ch> <id>            # Unpin message
discli msg pins <channel>             # List pinned messages
discli msg thread <ch> "Name"         # Create thread
discli msg thread <ch> "Name" --message <id>  # Thread from message

discli emoji list                        # List custom emojis
discli emoji upload <name> ./img.png     # Upload custom emoji
discli emoji delete <name> --confirm     # Delete custom emoji

discli audit log                         # View recent audit log
discli audit log -n 50                   # Last 50 entries
discli audit log --type member_kick      # Filter by action type
discli audit log --user <id>             # Filter by who performed action
discli audit types                       # List action type names
```

## Global Flags

- `--format <yaml|json|table|auto>` — output format (default: auto = yaml when piped, table in terminal)
- `--server <id>` — target a specific server instead of default
- `-n <count>` — limit results on list commands

## Exit Codes

- `0` — success
- `1` — general error
- `2` — usage error
- `3` — not found
- `4` — permission denied

## Bot Personality (SOUL.md)

When sending messages, reacting, or interacting as the bot, check for a `SOUL.md` file at `~/.discli/SOUL.md`. If it exists, read it first and stay in character for all bot interactions (messages, replies, reactions, embeds).

If no SOUL.md exists yet, ask your human how they want their bot to sound:
- What's the bot's name?
- What personality? (cheeky, professional, friendly, chaotic, minimal, etc.)
- How should it talk? (casual lowercase, formal, emoji-heavy, dry wit, etc.)
- Any specific traits or quirks?

Then generate a SOUL.md and save it to `~/.discli/SOUL.md`. Use this structure:
- **Core Truths**: behavioral principles (how the bot acts)
- **Boundaries**: hard limits (what it won't do)
- **Vibe**: tone, humor style, emoji preferences, example responses
- **Identity**: name, what it is, who made it

The bot should feel like a character, not a command runner.

## Notes

- Channel/role/member names are resolved case-insensitively.
- You can use IDs instead of names to avoid ambiguity.
- Rate limits: Discord allows ~5 requests/second. Channel renames have a 10-min cooldown per channel.
- Config stored in `~/.discli/` (token in `.env`, defaults in `config.json`).
- Bot personality stored in `~/.discli/SOUL.md` (optional, see above).
