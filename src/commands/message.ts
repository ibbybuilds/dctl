import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import type { Embed, MessagePayload } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel } from '../utils/resolve.js';

function parseColor(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

export function registerMessage(program: Command): void {
  const message = program
    .command('message')
    .alias('msg')
    .description('Send, read, and manage messages');

  message
    .command('send')
    .description('Send a message to a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<text>', 'Message content (supports Discord markdown)')
    .option('--reply <id>', 'Reply to a message ID')
    .action(async (channelName: string, text: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const payload: MessagePayload = { content: text };
      if (opts.reply) {
        payload.message_reference = { message_id: opts.reply };
      }

      const msg = await api.sendMessage(ch.id, payload);
      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Sent message to #${ch.name} (${msg.id})`);
      }
    });

  message
    .command('embed')
    .description('Send an embed (rich card) to a channel')
    .argument('<channel>', 'Channel name or ID')
    .option('--title <text>', 'Embed title')
    .option('--description <text>', 'Embed description (supports markdown)')
    .option('--color <hex>', 'Embed color (e.g. #5865F2)')
    .option('--url <url>', 'Title link URL')
    .option('--image <url>', 'Large image URL')
    .option('--thumbnail <url>', 'Small thumbnail URL')
    .option('--footer <text>', 'Footer text')
    .option('--author <name>', 'Author name')
    .option('--field <value...>', 'Add field: "Name|Value" or "Name|Value|inline"')
    .option('--content <text>', 'Text content above the embed')
    .option('--reply <id>', 'Reply to a message ID')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const embed: Embed = {};
      if (opts.title) embed.title = opts.title;
      if (opts.description) embed.description = opts.description;
      if (opts.color) embed.color = parseColor(opts.color);
      if (opts.url) embed.url = opts.url;
      if (opts.image) embed.image = { url: opts.image };
      if (opts.thumbnail) embed.thumbnail = { url: opts.thumbnail };
      if (opts.footer) embed.footer = { text: opts.footer };
      if (opts.author) embed.author = { name: opts.author };
      if (opts.field) {
        embed.fields = (opts.field as string[]).map((f: string) => {
          const parts = f.split('|');
          return {
            name: parts[0],
            value: parts[1] || '',
            inline: parts[2] === 'inline',
          };
        });
      }

      if (!embed.title && !embed.description) {
        console.error('Provide at least --title or --description for the embed.');
        process.exit(2);
      }

      const payload: MessagePayload = { embeds: [embed] };
      if (opts.content) payload.content = opts.content;
      if (opts.reply) payload.message_reference = { message_id: opts.reply };

      const msg = await api.sendMessage(ch.id, payload);
      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Sent embed to #${ch.name} (${msg.id})`);
      }
    });

  message
    .command('read')
    .description('Read recent messages from a channel')
    .argument('<channel>', 'Channel name or ID')
    .option('-n <count>', 'Number of messages to fetch', '10')
    .option('--before <id>', 'Fetch messages before this message ID')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const messages = await api.getMessages(ch.id, parseInt(opts.n), opts.before);

      if (fmt !== 'table') {
        printResult(messages, fmt);
        return;
      }

      console.log(`\n#${ch.name} — last ${messages.length} messages`);
      console.log('─'.repeat(40));

      for (const msg of messages.reverse()) {
        const time = new Date(msg.timestamp).toLocaleString();
        const bot = msg.author.bot ? ' [BOT]' : '';
        const edited = msg.edited_timestamp ? ' (edited)' : '';
        const pinned = msg.pinned ? ' 📌' : '';
        console.log(`  ${msg.author.username}${bot} — ${time}${edited}${pinned}`);
        if (msg.content) console.log(`    ${msg.content}`);
        if (msg.embeds && msg.embeds.length > 0) {
          for (const e of msg.embeds) {
            if (e.title) console.log(`    [Embed] ${e.title}`);
            if (e.description) console.log(`    ${e.description.slice(0, 100)}`);
          }
        }
        console.log();
      }
    });

  message
    .command('edit')
    .description('Edit a message sent by the bot')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to edit')
    .argument('<text>', 'New message content')
    .action(async (channelName: string, messageId: string, text: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const msg = await api.editMessage(ch.id, messageId, { content: text });
      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Edited message ${messageId} in #${ch.name}`);
      }
    });

  message
    .command('delete')
    .description('Delete a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to delete')
    .option('--confirm', 'Required to actually delete')
    .action(async (channelName: string, messageId: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      if (!opts.confirm) {
        console.error(`This will delete message ${messageId} in #${ch.name}. Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.deleteMessage(ch.id, messageId);
      console.log(`Deleted message ${messageId} from #${ch.name}`);
    });

  message
    .command('react')
    .description('Add a reaction to a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID')
    .argument('<emoji>', 'Emoji to react with (e.g. 👍 or :thumbsup:)')
    .action(async (channelName: string, messageId: string, emoji: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.addReaction(ch.id, messageId, emoji);
      console.log(`Reacted ${emoji} on message ${messageId} in #${ch.name}`);
    });

  message
    .command('unreact')
    .description('Remove bot reaction from a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID')
    .argument('<emoji>', 'Emoji to remove')
    .action(async (channelName: string, messageId: string, emoji: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.removeReaction(ch.id, messageId, emoji);
      console.log(`Removed ${emoji} reaction from message ${messageId}`);
    });

  message
    .command('pin')
    .description('Pin a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to pin')
    .action(async (channelName: string, messageId: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.pinMessage(ch.id, messageId);
      console.log(`Pinned message ${messageId} in #${ch.name}`);
    });

  message
    .command('unpin')
    .description('Unpin a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to unpin')
    .action(async (channelName: string, messageId: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.unpinMessage(ch.id, messageId);
      console.log(`Unpinned message ${messageId} in #${ch.name}`);
    });

  message
    .command('pins')
    .description('List pinned messages in a channel')
    .argument('<channel>', 'Channel name or ID')
    .action(async (channelName: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const pins = await api.getPinnedMessages(ch.id);

      if (fmt !== 'table') {
        printResult(pins, fmt);
        return;
      }

      if (pins.length === 0) {
        console.log(`\n#${ch.name}: no pinned messages`);
        return;
      }

      console.log(`\n#${ch.name} — ${pins.length} pinned`);
      console.log('─'.repeat(30));
      for (const msg of pins) {
        const time = new Date(msg.timestamp).toLocaleString();
        console.log(`  ${msg.author.username} — ${time}`);
        if (msg.content) console.log(`    ${msg.content}`);
        console.log(`    ID: ${msg.id}`);
        console.log();
      }
    });

  message
    .command('thread')
    .description('Create a thread from a message or in a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<name>', 'Thread name')
    .option('--message <id>', 'Create thread from this message ID')
    .action(async (channelName: string, name: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const thread = await api.createThread(ch.id, name, opts.message);
      if (fmt !== 'table') {
        printResult(thread, fmt);
      } else {
        console.log(`Created thread "${name}" in #${ch.name} (${thread.id})`);
      }
    });
}
