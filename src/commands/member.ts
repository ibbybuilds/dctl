import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveMember } from '../utils/resolve.js';

export function registerMember(program: Command): void {
  const member = program
    .command('member')
    .description('Manage server members');

  member
    .command('list')
    .description('List server members')
    .option('-n, --limit <n>', 'Max members to show', '100')
    .action(async (opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const members = await api.listMembers(guildId, parseInt(opts.limit));

      if (fmt === 'json') {
        printResult(members, fmt);
        return;
      }

      const rows = members.map((m) => ({
        username: m.user?.username ?? '?',
        display: m.user?.global_name ?? m.nick ?? '',
        nick: m.nick ?? '',
        roles: m.roles.length,
        joined: m.joined_at?.slice(0, 10) ?? '?',
      }));

      console.log(`\nMembers (${members.length})`);
      console.log('──────────');
      printResult(rows, fmt);
    });

  member
    .command('info')
    .description('Show member details')
    .argument('<user>', 'Username or ID')
    .action(async (userName: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const m = await resolveMember(api, guildId, userName);

      if (fmt === 'json') {
        printResult(m, fmt);
        return;
      }

      const roles = await api.listRoles(guildId);
      const memberRoles = m.roles
        .map((rid) => roles.find((r) => r.id === rid)?.name ?? rid)
        .join(', ');

      const info = {
        username: m.user?.username ?? '?',
        display_name: m.user?.global_name ?? '(none)',
        nickname: m.nick ?? '(none)',
        id: m.user?.id ?? '?',
        roles: memberRoles || '(none)',
        joined: m.joined_at?.slice(0, 10) ?? '?',
      };

      console.log(`\n${m.user?.username ?? 'Member'}`);
      console.log('─'.repeat((m.user?.username ?? 'Member').length));
      printResult(info, fmt);
    });

  member
    .command('kick')
    .description('Kick a member from the server')
    .argument('<user>', 'Username or ID')
    .option('--reason <text>', 'Reason for kick')
    .option('--confirm', 'Required to actually kick')
    .action(async (userName: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const m = await resolveMember(api, guildId, userName);

      if (!opts.confirm) {
        console.error(`This will kick ${m.user!.username} (${m.user!.id}). Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.kickMember(guildId, m.user!.id);
      console.log(`Kicked ${m.user!.username}${opts.reason ? ` — ${opts.reason}` : ''}`);
    });

  member
    .command('ban')
    .description('Ban a member from the server')
    .argument('<user>', 'Username or ID')
    .option('--reason <text>', 'Reason for ban')
    .option('--confirm', 'Required to actually ban')
    .action(async (userName: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const m = await resolveMember(api, guildId, userName);

      if (!opts.confirm) {
        console.error(`This will BAN ${m.user!.username} (${m.user!.id}). Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.banMember(guildId, m.user!.id);
      console.log(`Banned ${m.user!.username}${opts.reason ? ` — ${opts.reason}` : ''}`);
    });

  member
    .command('nick')
    .description('Change a member\'s nickname')
    .argument('<user>', 'Username or ID')
    .argument('<nickname>', 'New nickname')
    .action(async (userName: string, nickname: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const m = await resolveMember(api, guildId, userName);

      await api.modifyMember(guildId, m.user!.id, { nick: nickname });
      if (fmt === 'json') {
        printResult({ action: 'nick', user: m.user!.username, nick: nickname }, fmt);
      } else {
        console.log(`Set nickname for ${m.user!.username} → ${nickname}`);
      }
    });
}
