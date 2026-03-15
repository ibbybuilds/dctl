import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel } from '../utils/resolve.js';

export function registerInvite(program: Command): void {
  const invite = program
    .command('invite')
    .description('Manage server invites');

  invite
    .command('list')
    .description('List all server invites')
    .action(async () => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const invites = await api.getGuildInvites(guildId);

      if (fmt !== 'table') {
        printResult(invites, fmt);
        return;
      }

      if (invites.length === 0) {
        console.log('\n  No active invites');
        return;
      }

      const rows = invites.map((inv) => ({
        code: inv.code,
        channel: inv.channel?.name ?? '?',
        inviter: inv.inviter?.username ?? '?',
        uses: `${inv.uses}/${inv.max_uses || '∞'}`,
        max_age: inv.max_age === 0 ? 'never' : `${inv.max_age}s`,
        temp: inv.temporary ? 'yes' : 'no',
      }));

      console.log('\nInvites');
      console.log('───────');
      printResult(rows, fmt);
    });

  invite
    .command('create')
    .description('Create an invite link')
    .argument('<channel>', 'Channel name or ID')
    .option('--max-age <seconds>', 'Expire after seconds (0 = never)', parseInt)
    .option('--max-uses <count>', 'Max uses (0 = unlimited)', parseInt)
    .option('--temporary', 'Grant temporary membership')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const inviteOpts: Record<string, unknown> = { unique: true };
      if (opts.maxAge !== undefined) inviteOpts.max_age = opts.maxAge;
      if (opts.maxUses !== undefined) inviteOpts.max_uses = opts.maxUses;
      if (opts.temporary) inviteOpts.temporary = true;

      const inv = await api.createChannelInvite(ch.id, inviteOpts as any);

      if (fmt !== 'table') {
        printResult(inv, fmt);
      } else {
        console.log(`Created invite: https://discord.gg/${inv.code}`);
        console.log(`  Channel: #${ch.name}`);
        console.log(`  Max uses: ${inv.max_uses || 'unlimited'}`);
        console.log(`  Expires: ${inv.max_age === 0 ? 'never' : `${inv.max_age}s`}`);
      }
    });

  invite
    .command('delete')
    .description('Delete an invite')
    .argument('<code>', 'Invite code')
    .option('--confirm', 'Required to actually delete')
    .action(async (code: string, opts) => {
      const api = new DiscordAPI(requireToken());

      if (!opts.confirm) {
        console.error(`This will delete invite ${code}. Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.deleteInvite(code);
      console.log(`Deleted invite ${code}`);
    });
}
