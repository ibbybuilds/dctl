# dctl Output Schema

All commands support `--format json` (or auto-detect when piped). This document describes the JSON output shape for each command so agents can parse without trial runs.

## server list

```json
[
  { "id": "string", "name": "string", "icon": "string|null", "owner": "boolean", "permissions": "string" }
]
```

## server info

Full guild object from Discord API. Key fields:

```json
{
  "id": "string",
  "name": "string",
  "description": "string|null",
  "approximate_member_count": "number",
  "approximate_presence_count": "number",
  "premium_tier": "number",
  "premium_subscription_count": "number"
}
```

## channel list

```json
[
  { "id": "string", "name": "string", "type": "number", "position": "number", "parent_id": "string|null", "topic": "string|null" }
]
```

Channel types: `0` = text, `2` = voice, `4` = category, `5` = announcement, `13` = stage, `15` = forum.

## channel create / rename / topic / move

Returns the channel object (same shape as channel list item).

## channel delete

No output (exit code 0 = success).

## role list

```json
[
  { "id": "string", "name": "string", "color": "number", "position": "number", "permissions": "string", "managed": "boolean", "mentionable": "boolean" }
]
```

## role create

Returns the created role object (same shape as role list item).

## role delete / assign / remove

No output (exit code 0 = success).

## member list

```json
[
  {
    "user": { "id": "string", "username": "string", "global_name": "string|null" },
    "nick": "string|null",
    "roles": ["string"],
    "joined_at": "string (ISO 8601)"
  }
]
```

## member info

Returns single member object (same shape as member list item).

## permission view

```json
[
  { "id": "string", "type": "number", "allow": "string (bitfield)", "deny": "string (bitfield)" }
]
```

Type: `0` = role, `1` = member.

## permission set / lock / unlock

No output (exit code 0 = success).

## permission list

```json
[
  { "name": "string", "bit": "string" }
]
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Usage error (missing args, invalid flags) |
| 3 | Not found (channel, role, member) |
| 4 | Permission denied (403) |

## Dry Run

Commands with `--dry-run` return an action object:

```json
{ "action": "create_channel|rename_channel|create_role|set_permission|lock", ...params }
```
