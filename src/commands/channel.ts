import { Command } from 'commander';
import { DiscordAPI, CHANNEL_TYPE, CHANNEL_TYPE_NAME } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel, resolveCategory } from '../utils/resolve.js';

export function registerChannel(program: Command): void {
  const channel = program
    .command('channel')
    .description('Manage server channels');

  channel
    .command('list')
    .description('List all channels grouped by category')
    .option('-n <count>', 'Limit number of channels shown', parseInt)
    .action(async (opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      let channels = await api.listChannels(guildId);
      if (opts.n) channels = channels.slice(0, opts.n);

      if (fmt === 'json') {
        printResult(channels, fmt);
        return;
      }

      // Group by category
      const categories = channels
        .filter((c) => c.type === 4)
        .sort((a, b) => a.position - b.position);
      const uncategorized = channels.filter(
        (c) => c.type !== 4 && !c.parent_id
      );

      if (uncategorized.length > 0) {
        console.log('\n  (no category)');
        for (const ch of uncategorized.sort((a, b) => a.position - b.position)) {
          const type = CHANNEL_TYPE_NAME[ch.type] ?? '?';
          console.log(`    ${type === 'text' ? '#' : '🔊'} ${ch.name}`);
        }
      }

      for (const cat of categories) {
        console.log(`\n  ${cat.name.toUpperCase()}`);
        const children = channels
          .filter((c) => c.parent_id === cat.id && c.type !== 4)
          .sort((a, b) => a.position - b.position);
        for (const ch of children) {
          const type = CHANNEL_TYPE_NAME[ch.type] ?? '?';
          const prefix = type === 'voice' || type === 'stage' ? '🔊' : '#';
          const topic = ch.topic ? ` — ${ch.topic}` : '';
          console.log(`    ${prefix} ${ch.name}${topic}`);
        }
      }
      console.log();
    });

  channel
    .command('create')
    .description('Create a new channel')
    .argument('<name>', 'Channel name')
    .option('--type <type>', 'Channel type: text, voice, category, announcement, stage, forum', 'text')
    .option('--category <name>', 'Parent category name or ID')
    .option('--topic <topic>', 'Channel topic')
    .option('--dry-run', 'Show what would be created without creating it')
    .action(async (name: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);

      const channelType = CHANNEL_TYPE[opts.type];
      if (channelType === undefined) {
        console.error(`Unknown channel type: ${opts.type}. Use: ${Object.keys(CHANNEL_TYPE).join(', ')}`);
        process.exit(2);
      }

      let parentId: string | undefined;
      if (opts.category) {
        const cat = await resolveCategory(api, guildId, opts.category);
        parentId = cat.id;
      }

      if (opts.dryRun) {
        const result = { action: 'create_channel', name, type: opts.type, category: opts.category ?? null, topic: opts.topic ?? null };
        printResult(result, fmt);
        return;
      }

      const ch = await api.createChannel(guildId, {
        name,
        type: channelType,
        parent_id: parentId,
        topic: opts.topic,
      });

      if (fmt === 'json') {
        printResult(ch, fmt);
      } else {
        console.log(`Created #${ch.name} (${CHANNEL_TYPE_NAME[ch.type] ?? '?'}) — ${ch.id}`);
      }
    });

  channel
    .command('delete')
    .description('Delete a channel')
    .argument('<name>', 'Channel name or ID')
    .option('--confirm', 'Required to actually delete')
    .action(async (name: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, name);

      if (!opts.confirm) {
        console.error(`This will delete #${ch.name} (${ch.id}). Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.deleteChannel(ch.id);
      console.log(`Deleted #${ch.name}`);
    });

  channel
    .command('rename')
    .description('Rename a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<new-name>', 'New channel name')
    .option('--dry-run', 'Show what would change')
    .action(async (channelName: string, newName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      if (opts.dryRun) {
        printResult({ action: 'rename_channel', from: ch.name, to: newName, id: ch.id }, fmt);
        return;
      }

      await api.modifyChannel(ch.id, { name: newName });
      console.log(`Renamed #${ch.name} → #${newName}`);
    });

  channel
    .command('topic')
    .description('Set a channel topic')
    .argument('<channel>', 'Channel name or ID')
    .argument('<topic>', 'New topic text')
    .action(async (channelName: string, topic: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const updated = await api.modifyChannel(ch.id, { topic });
      if (fmt === 'json') {
        printResult(updated, fmt);
      } else {
        console.log(`Set topic for #${ch.name}: ${topic}`);
      }
    });

  channel
    .command('move')
    .description('Move a channel to a category')
    .argument('<channel>', 'Channel name or ID')
    .option('--category <name>', 'Target category name or ID')
    .option('--position <n>', 'Position within category', parseInt)
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const update: Record<string, unknown> = {};
      if (opts.category) {
        const cat = await resolveCategory(api, guildId, opts.category);
        update.parent_id = cat.id;
      }
      if (opts.position !== undefined) {
        update.position = opts.position;
      }

      if (Object.keys(update).length === 0) {
        console.error('Specify --category and/or --position.');
        process.exit(2);
      }

      const updated = await api.modifyChannel(ch.id, update);
      if (fmt === 'json') {
        printResult(updated, fmt);
      } else {
        console.log(`Moved #${ch.name}${opts.category ? ` → ${opts.category}` : ''}${opts.position !== undefined ? ` (position ${opts.position})` : ''}`);
      }
    });
}
