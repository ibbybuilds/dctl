import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import { requireToken, requireServer, setDefaultServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';

const VERIFICATION_LEVELS: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

const NOTIFICATION_LEVELS: Record<string, number> = {
  all_messages: 0,
  only_mentions: 1,
};

const CONTENT_FILTER_LEVELS: Record<string, number> = {
  disabled: 0,
  members_without_roles: 1,
  all_members: 2,
};

export function registerServer(program: Command): void {
  const server = program
    .command('server')
    .description('Manage and inspect servers');

  server
    .command('list')
    .description('List all servers the bot is in')
    .action(async () => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guilds = await api.listGuilds();

      if (fmt !== 'table') {
        printResult(guilds, fmt);
        return;
      }

      const rows = guilds.map((g) => ({
        id: g.id,
        name: g.name,
        owner: g.owner ? 'yes' : 'no',
      }));
      console.log('\nServers');
      console.log('───────');
      printResult(rows, fmt);
    });

  server
    .command('select')
    .description('Set the default server')
    .argument('<id>', 'Server ID')
    .action(async (id: string) => {
      const api = new DiscordAPI(requireToken());
      const guild = await api.getGuild(id);
      setDefaultServer(guild.id, guild.name);
      console.log(`Default server set to: ${guild.name} (${guild.id})`);
    });

  server
    .command('info')
    .description('Show server details')
    .action(async () => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const guild = await api.getGuild(guildId);

      if (fmt !== 'table') {
        printResult(guild, fmt);
        return;
      }

      const info = {
        name: guild.name,
        id: guild.id,
        description: guild.description || '(none)',
        members: guild.approximate_member_count ?? '?',
        online: guild.approximate_presence_count ?? '?',
        boosts: guild.premium_subscription_count,
        boost_tier: guild.premium_tier,
      };

      console.log(`\n${guild.name}`);
      console.log('─'.repeat(guild.name.length));
      printResult(info, fmt);
    });

  server
    .command('set')
    .description('Modify server settings')
    .option('--name <name>', 'Server name')
    .option('--description <text>', 'Server description')
    .option('--verification <level>', 'Verification level: none, low, medium, high, very_high')
    .option('--notifications <level>', 'Default notifications: all_messages, only_mentions')
    .option('--content-filter <level>', 'Content filter: disabled, members_without_roles, all_members')
    .option('--afk-timeout <seconds>', 'AFK timeout: 60, 300, 900, 1800, 3600', parseInt)
    .option('--system-channel <id>', 'System message channel ID')
    .option('--rules-channel <id>', 'Rules channel ID')
    .option('--boost-bar', 'Enable boost progress bar')
    .option('--no-boost-bar', 'Disable boost progress bar')
    .action(async (opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);

      const data: Record<string, unknown> = {};

      if (opts.name) data.name = opts.name;
      if (opts.description) data.description = opts.description;
      if (opts.verification) {
        const level = VERIFICATION_LEVELS[opts.verification];
        if (level === undefined) {
          console.error(`Invalid verification level. Use: ${Object.keys(VERIFICATION_LEVELS).join(', ')}`);
          process.exit(2);
        }
        data.verification_level = level;
      }
      if (opts.notifications) {
        const level = NOTIFICATION_LEVELS[opts.notifications];
        if (level === undefined) {
          console.error(`Invalid notification level. Use: ${Object.keys(NOTIFICATION_LEVELS).join(', ')}`);
          process.exit(2);
        }
        data.default_message_notifications = level;
      }
      if (opts.contentFilter) {
        const level = CONTENT_FILTER_LEVELS[opts.contentFilter];
        if (level === undefined) {
          console.error(`Invalid content filter level. Use: ${Object.keys(CONTENT_FILTER_LEVELS).join(', ')}`);
          process.exit(2);
        }
        data.explicit_content_filter = level;
      }
      if (opts.afkTimeout) data.afk_timeout = opts.afkTimeout;
      if (opts.systemChannel) data.system_channel_id = opts.systemChannel;
      if (opts.rulesChannel) data.rules_channel_id = opts.rulesChannel;
      if (opts.boostBar === true) data.premium_progress_bar_enabled = true;
      if (opts.boostBar === false) data.premium_progress_bar_enabled = false;

      if (Object.keys(data).length === 0) {
        console.error('Specify at least one setting to change.');
        console.error('Options: --name, --description, --verification, --notifications, --content-filter, --afk-timeout, --system-channel, --rules-channel, --boost-bar');
        process.exit(2);
      }

      const guild = await api.modifyGuild(guildId, data);
      if (fmt !== 'table') {
        printResult(guild, fmt);
      } else {
        console.log(`Updated server settings for ${guild.name}`);
        for (const [key, value] of Object.entries(data)) {
          console.log(`  ${key}: ${value}`);
        }
      }
    });
}
