import { createRequire } from 'module';
import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerServer } from './commands/server.js';
import { registerChannel } from './commands/channel.js';
import { registerRole } from './commands/role.js';
import { registerMember } from './commands/member.js';
import { registerPermission } from './commands/permission.js';
import { registerMessage } from './commands/message.js';
import { registerAudit } from './commands/audit.js';
import { registerInvite } from './commands/invite.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('discli')
  .description('discli — Discord server management CLI')
  .version(version)
  .option('--format <fmt>', 'Output format: json, yaml, table, auto (auto = yaml when piped, table in terminal)', 'auto')
  .option('--server <id>', 'Server ID override');

registerInit(program);
registerServer(program);
registerChannel(program);
registerRole(program);
registerMember(program);
registerPermission(program);
registerMessage(program);
registerAudit(program);
registerInvite(program);

program.parse();
