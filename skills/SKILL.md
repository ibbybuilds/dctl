---
name: discli
description: |
  Discord server management CLI. Use when you need to manage Discord servers —
  create channels, assign roles, manage members, rename channels, set permissions.
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

discli role list                      # List roles
discli role create <name>             # Create role (--color, --mentionable)
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
discli msg embed <ch> --title "X" --description "Y" --color "#hex"  # Rich embed
discli msg embed <ch> --title "X" --field "Name|Value|inline"       # Embed with fields
discli msg read <channel> -n 10       # Read last N messages
discli msg edit <ch> <msg-id> "new"   # Edit bot message
discli msg delete <ch> <id> --confirm # Delete message
discli msg react <ch> <id> 👍         # Add reaction
discli msg unreact <ch> <id> 👍       # Remove reaction
discli msg pin <ch> <id>              # Pin message
discli msg unpin <ch> <id>            # Unpin message
discli msg pins <channel>             # List pinned messages
discli msg thread <ch> "Name"         # Create thread
discli msg thread <ch> "Name" --message <id>  # Thread from message

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

## Notes

- Channel/role/member names are resolved case-insensitively.
- You can use IDs instead of names to avoid ambiguity.
- Rate limits: Discord allows ~5 requests/second. Channel renames have a 10-min cooldown per channel.
- Config stored in `~/.discli/` (token in `.env`, defaults in `config.json`).
