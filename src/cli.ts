import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerServer } from './commands/server.js';
import { registerChannel } from './commands/channel.js';
import { registerRole } from './commands/role.js';
import { registerMember } from './commands/member.js';
import { registerPermission } from './commands/permission.js';

const program = new Command();

program
  .name('dctl')
  .description('Discord server management CLI — control your servers from the terminal')
  .version('0.1.0')
  .option('--format <fmt>', 'Output format: json, table, auto (auto = json when piped, table in terminal)', 'auto')
  .option('--server <id>', 'Server ID override');

registerInit(program);
registerServer(program);
registerChannel(program);
registerRole(program);
registerMember(program);
registerPermission(program);

program.parse();
