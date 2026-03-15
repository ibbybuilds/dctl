# discli

Discord server management CLI built with TypeScript.

## Stack

- TypeScript (ESM, target ES2022)
- Commander for CLI framework
- tsup for bundling
- Native `fetch` for Discord REST API calls
- `yaml` package for YAML output

## Project Structure

```
src/
  cli.ts              # Entry point, registers all command groups
  commands/
    init.ts            # discli init
    server.ts          # discli server {list, select, info, set}
    invite.ts          # discli invite {list, create, delete}
    channel.ts         # discli channel {list, create, delete, rename, topic, move}
    role.ts            # discli role {list, create, delete, assign, remove}
    member.ts          # discli member {list, info, kick, ban, nick}
    permission.ts      # discli perm {view, set, lock, unlock, list}
    message.ts         # discli msg {send, embed, read, edit, delete, react, unreact, pin, unpin, pins, thread}
    audit.ts           # discli audit {log, types}
  utils/
    api.ts             # DiscordAPI class, all REST calls, types
    config.ts          # Token + config management (~/.discli/)
    output.ts          # Format resolver (yaml/json/table/auto), table printer
    resolve.ts         # Name-to-ID resolution helpers
```

## Commands

```bash
npm run build        # Build with tsup
npm run dev          # Build with watch mode
npm run typecheck    # Type check without emitting
```

## Conventions

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Noun-verb command structure: `discli channel create`, not `discli create-channel`
- All list commands support `-n` to limit results
- Destructive commands require `--confirm` flag, never interactive prompts
- Output format: auto (YAML when piped, table in terminal), `--format` to override
- Errors go to stderr, data to stdout
- Exit codes: 0 success, 1 error, 2 usage, 3 not found, 4 forbidden
- New commands go in `src/commands/` as separate files with `registerX(program)` pattern
- API methods go in `src/utils/api.ts` on the `DiscordAPI` class
- Name/ID resolution helpers go in `src/utils/resolve.ts`

## Adding a New Command Group

1. Create `src/commands/thing.ts` with `export function registerThing(program: Command)`
2. Add API methods to `src/utils/api.ts`
3. Add resolver to `src/utils/resolve.ts` if needed
4. Register in `src/cli.ts`: `import { registerThing }` and `registerThing(program)`
5. Update `skills/SKILL.md` with new commands
6. Update `SCHEMA.md` with output shapes

## Config

User config lives in `~/.discli/`:
- `.env` has `BOT_TOKEN=xxx`
- `config.json` has `default_server_id` and `default_server_name`

Never commit tokens or credentials.

## Discord API

- Base URL: `https://discord.com/api/v10`
- Auth: `Bot {token}` header
- Rate limits: handled with error message and exit code 1
- Channel types: 0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum
- Permission overwrites: PUT `/channels/{id}/permissions/{overwrite_id}` with allow/deny bitfields
