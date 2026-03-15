import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import { requireToken, requireServer, setDefaultServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';

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

      if (fmt === 'json') {
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

      const info = {
        name: guild.name,
        id: guild.id,
        description: guild.description || '(none)',
        members: guild.approximate_member_count ?? '?',
        online: guild.approximate_presence_count ?? '?',
        boosts: guild.premium_subscription_count,
        boost_tier: guild.premium_tier,
      };

      if (fmt === 'json') {
        printResult(guild, fmt);
        return;
      }

      console.log(`\n${guild.name}`);
      console.log('─'.repeat(guild.name.length));
      printResult(info, fmt);
    });
}
