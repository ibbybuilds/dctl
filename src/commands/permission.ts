import { Command } from 'commander';
import { DiscordAPI, PERMISSION } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel, resolveRole } from '../utils/resolve.js';

function parsePermissions(perms: string): bigint {
  let bits = 0n;
  for (const p of perms.split(',')) {
    const name = p.trim().toLowerCase();
    const val = PERMISSION[name];
    if (val === undefined) {
      console.error(`Unknown permission: ${name}`);
      console.error(`Available: ${Object.keys(PERMISSION).join(', ')}`);
      process.exit(2);
    }
    bits |= val;
  }
  return bits;
}

function describePermissions(bitfield: string): string[] {
  const bits = BigInt(bitfield);
  if (bits === 0n) return [];
  return Object.entries(PERMISSION)
    .filter(([, val]) => (bits & val) === val)
    .map(([name]) => name);
}

export function registerPermission(program: Command): void {
  const perm = program
    .command('permission')
    .alias('perm')
    .description('Manage channel permissions');

  perm
    .command('view')
    .description('View permission overwrites for a channel')
    .argument('<channel>', 'Channel name or ID')
    .action(async (channelName: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const full = await api.getChannel(ch.id);
      const overwrites = full.permission_overwrites ?? [];
      const roles = await api.listRoles(guildId);

      if (fmt === 'json') {
        printResult(overwrites, fmt);
        return;
      }

      if (overwrites.length === 0) {
        console.log(`\n#${ch.name}: no permission overwrites (inherits from category/server)`);
        return;
      }

      console.log(`\n#${ch.name} — Permission Overwrites`);
      console.log('─'.repeat(40));

      for (const ow of overwrites) {
        const target = ow.type === 0
          ? roles.find((r) => r.id === ow.id)?.name ?? ow.id
          : `member:${ow.id}`;
        const allowed = describePermissions(ow.allow);
        const denied = describePermissions(ow.deny);

        console.log(`\n  @${target} (${ow.type === 0 ? 'role' : 'member'})`);
        if (allowed.length > 0) console.log(`    ✅ allow: ${allowed.join(', ')}`);
        if (denied.length > 0) console.log(`    ❌ deny:  ${denied.join(', ')}`);
        if (allowed.length === 0 && denied.length === 0) console.log(`    (neutral)`);
      }
      console.log();
    });

  perm
    .command('set')
    .description('Set permission overwrite for a role on a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<role>', 'Role name or ID')
    .option('--allow <perms>', 'Comma-separated permissions to allow')
    .option('--deny <perms>', 'Comma-separated permissions to deny')
    .option('--dry-run', 'Show what would change')
    .action(async (channelName: string, roleName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);
      const role = await resolveRole(api, guildId, roleName);

      if (!opts.allow && !opts.deny) {
        console.error('Specify --allow and/or --deny with comma-separated permissions.');
        console.error(`Available: ${Object.keys(PERMISSION).join(', ')}`);
        process.exit(2);
      }

      const allow = opts.allow ? parsePermissions(opts.allow) : 0n;
      const deny = opts.deny ? parsePermissions(opts.deny) : 0n;

      if (opts.dryRun) {
        printResult({
          action: 'set_permission',
          channel: ch.name,
          role: role.name,
          allow: opts.allow ?? '(none)',
          deny: opts.deny ?? '(none)',
        }, fmt);
        return;
      }

      await api.editChannelPermission(ch.id, role.id, {
        allow: allow.toString(),
        deny: deny.toString(),
        type: 0, // role
      });

      if (fmt === 'json') {
        printResult({ channel: ch.name, role: role.name, allow: allow.toString(), deny: deny.toString() }, fmt);
      } else {
        console.log(`Set permissions on #${ch.name} for @${role.name}`);
        if (opts.allow) console.log(`  ✅ allow: ${opts.allow}`);
        if (opts.deny) console.log(`  ❌ deny:  ${opts.deny}`);
      }
    });

  perm
    .command('lock')
    .description('Make a channel read-only for @everyone')
    .argument('<channel>', 'Channel name or ID')
    .option('--dry-run', 'Show what would change')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      // @everyone role ID = guild ID
      const deny = PERMISSION.send_messages
        | PERMISSION.send_messages_in_threads
        | PERMISSION.create_public_threads;

      if (opts.dryRun) {
        printResult({ action: 'lock', channel: ch.name, deny_for: '@everyone' }, fmt);
        return;
      }

      await api.editChannelPermission(ch.id, guildId, {
        allow: '0',
        deny: deny.toString(),
        type: 0,
      });

      console.log(`Locked #${ch.name} — read-only for @everyone`);
    });

  perm
    .command('unlock')
    .description('Remove read-only restriction for @everyone')
    .argument('<channel>', 'Channel name or ID')
    .action(async (channelName: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.deleteChannelPermission(ch.id, guildId);
      console.log(`Unlocked #${ch.name} — @everyone can send messages`);
    });

  perm
    .command('list')
    .description('List all available permission names')
    .action(() => {
      const fmt = resolveFormat(program.opts().format);
      if (fmt === 'json') {
        const perms = Object.entries(PERMISSION).map(([name, val]) => ({ name, bit: val.toString() }));
        printResult(perms, fmt);
      } else {
        console.log('\nAvailable Permissions');
        console.log('────────────────────');
        for (const name of Object.keys(PERMISSION)) {
          console.log(`  ${name}`);
        }
      }
    });
}
