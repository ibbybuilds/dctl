const BASE = 'https://discord.com/api/v10';

export const PERMISSION: Record<string, bigint> = {
  // General
  administrator: 1n << 3n,
  view_audit_log: 1n << 7n,
  manage_server: 1n << 5n,
  manage_roles: 1n << 28n,
  manage_channels: 1n << 4n,
  kick_members: 1n << 1n,
  ban_members: 1n << 2n,
  create_invite: 1n << 0n,
  change_nickname: 1n << 26n,
  manage_nicknames: 1n << 27n,
  manage_expressions: 1n << 30n,
  manage_webhooks: 1n << 29n,
  view_channel: 1n << 10n,
  manage_events: 1n << 33n,
  moderate_members: 1n << 40n,

  // Text
  send_messages: 1n << 11n,
  send_messages_in_threads: 1n << 38n,
  create_public_threads: 1n << 35n,
  create_private_threads: 1n << 36n,
  embed_links: 1n << 14n,
  attach_files: 1n << 15n,
  add_reactions: 1n << 6n,
  use_external_emojis: 1n << 18n,
  read_message_history: 1n << 16n,
  mention_everyone: 1n << 17n,
  manage_messages: 1n << 13n,
  manage_threads: 1n << 34n,
  use_slash_commands: 1n << 31n,

  // Voice
  connect: 1n << 20n,
  speak: 1n << 21n,
  video: 1n << 9n,
  mute_members: 1n << 22n,
  deafen_members: 1n << 23n,
  move_members: 1n << 24n,
  use_voice_activity: 1n << 25n,
  priority_speaker: 1n << 8n,
};

export const CHANNEL_TYPE: Record<string, number> = {
  text: 0,
  voice: 2,
  category: 4,
  announcement: 5,
  stage: 13,
  forum: 15,
};

export const CHANNEL_TYPE_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(CHANNEL_TYPE).map(([k, v]) => [v, k])
);

export class DiscordAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      Authorization: `Bot ${this.token}`,
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429) {
      const data = (await res.json()) as { retry_after?: number };
      console.error(`Rate limited. Retry after ${data.retry_after ?? '?'}s.`);
      process.exit(1);
    }
    if (res.status === 403) {
      console.error('403 Forbidden — missing permissions.');
      process.exit(4);
    }
    if (res.status === 404) {
      console.error('404 Not found.');
      process.exit(3);
    }
    if (res.status >= 400) {
      const text = await res.text();
      console.error(`Discord API error ${res.status}: ${text.slice(0, 200)}`);
      process.exit(1);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  // ── Guilds ──

  async listGuilds(): Promise<Guild[]> {
    return (await this.request('GET', '/users/@me/guilds')) as Guild[];
  }

  async getGuild(guildId: string): Promise<GuildFull> {
    return (await this.request('GET', `/guilds/${guildId}?with_counts=true`)) as GuildFull;
  }

  async modifyGuild(guildId: string, data: Record<string, unknown>): Promise<GuildFull> {
    return (await this.request('PATCH', `/guilds/${guildId}`, data)) as GuildFull;
  }

  // ── Invites ──

  async getGuildInvites(guildId: string): Promise<Invite[]> {
    return (await this.request('GET', `/guilds/${guildId}/invites`)) as Invite[];
  }

  async createChannelInvite(
    channelId: string,
    opts?: { max_age?: number; max_uses?: number; temporary?: boolean; unique?: boolean }
  ): Promise<Invite> {
    return (await this.request('POST', `/channels/${channelId}/invites`, opts ?? {})) as Invite;
  }

  async deleteInvite(code: string): Promise<void> {
    await this.request('DELETE', `/invites/${code}`);
  }

  // ── Audit Log ──

  async getAuditLog(
    guildId: string,
    opts?: { user_id?: string; action_type?: number; limit?: number; before?: string }
  ): Promise<AuditLog> {
    const params = new URLSearchParams();
    if (opts?.user_id) params.set('user_id', opts.user_id);
    if (opts?.action_type !== undefined) params.set('action_type', String(opts.action_type));
    if (opts?.limit) params.set('limit', String(Math.min(opts.limit, 100)));
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return (await this.request('GET', `/guilds/${guildId}/audit-logs${qs ? '?' + qs : ''}`)) as AuditLog;
  }

  // ── Channels ──

  async listChannels(guildId: string): Promise<Channel[]> {
    return (await this.request('GET', `/guilds/${guildId}/channels`)) as Channel[];
  }

  async createChannel(
    guildId: string,
    opts: { name: string; type?: number; parent_id?: string; topic?: string }
  ): Promise<Channel> {
    return (await this.request('POST', `/guilds/${guildId}/channels`, opts)) as Channel;
  }

  // ── Messages ──

  async sendMessage(channelId: string, data: MessagePayload): Promise<Message> {
    return (await this.request('POST', `/channels/${channelId}/messages`, data)) as Message;
  }

  async getMessages(channelId: string, limit = 50, before?: string): Promise<Message[]> {
    let path = `/channels/${channelId}/messages?limit=${Math.min(limit, 100)}`;
    if (before) path += `&before=${before}`;
    return (await this.request('GET', path)) as Message[];
  }

  async getMessage(channelId: string, messageId: string): Promise<Message> {
    return (await this.request('GET', `/channels/${channelId}/messages/${messageId}`)) as Message;
  }

  async editMessage(channelId: string, messageId: string, data: MessagePayload): Promise<Message> {
    return (await this.request('PATCH', `/channels/${channelId}/messages/${messageId}`, data)) as Message;
  }

  // ── Reactions ──

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    const encoded = encodeURIComponent(emoji);
    await this.request('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`);
  }

  async removeReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    const encoded = encodeURIComponent(emoji);
    await this.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`);
  }

  // ── Threads ──

  async createThread(channelId: string, name: string, messageId?: string): Promise<Channel> {
    if (messageId) {
      return (await this.request('POST', `/channels/${channelId}/messages/${messageId}/threads`, {
        name, auto_archive_duration: 1440
      })) as Channel;
    }
    return (await this.request('POST', `/channels/${channelId}/threads`, {
      name, type: 11, auto_archive_duration: 1440
    })) as Channel;
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    await this.request('DELETE', `/channels/${channelId}/messages/${messageId}`);
  }

  async pinMessage(channelId: string, messageId: string): Promise<void> {
    await this.request('PUT', `/channels/${channelId}/pins/${messageId}`);
  }

  async unpinMessage(channelId: string, messageId: string): Promise<void> {
    await this.request('DELETE', `/channels/${channelId}/pins/${messageId}`);
  }

  async getPinnedMessages(channelId: string): Promise<Message[]> {
    return (await this.request('GET', `/channels/${channelId}/pins`)) as Message[];
  }

  async deleteChannel(channelId: string): Promise<void> {
    await this.request('DELETE', `/channels/${channelId}`);
  }

  async modifyChannel(channelId: string, data: Record<string, unknown>): Promise<Channel> {
    return (await this.request('PATCH', `/channels/${channelId}`, data)) as Channel;
  }

  async getChannel(channelId: string): Promise<Channel> {
    return (await this.request('GET', `/channels/${channelId}`)) as Channel;
  }

  async editChannelPermission(
    channelId: string,
    overwriteId: string,
    data: { allow: string; deny: string; type: number }
  ): Promise<void> {
    await this.request('PUT', `/channels/${channelId}/permissions/${overwriteId}`, data);
  }

  async deleteChannelPermission(channelId: string, overwriteId: string): Promise<void> {
    await this.request('DELETE', `/channels/${channelId}/permissions/${overwriteId}`);
  }

  // ── Roles ──

  async listRoles(guildId: string): Promise<Role[]> {
    return (await this.request('GET', `/guilds/${guildId}/roles`)) as Role[];
  }

  async createRole(guildId: string, data: Record<string, unknown>): Promise<Role> {
    return (await this.request('POST', `/guilds/${guildId}/roles`, data)) as Role;
  }

  async modifyRole(guildId: string, roleId: string, data: Record<string, unknown>): Promise<Role> {
    return (await this.request('PATCH', `/guilds/${guildId}/roles/${roleId}`, data)) as Role;
  }

  async reorderRoles(guildId: string, positions: { id: string; position: number }[]): Promise<Role[]> {
    return (await this.request('PATCH', `/guilds/${guildId}/roles`, positions)) as Role[];
  }

  async deleteRole(guildId: string, roleId: string): Promise<void> {
    await this.request('DELETE', `/guilds/${guildId}/roles/${roleId}`);
  }

  async addRoleToMember(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.request('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
  }

  async removeRoleFromMember(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.request('DELETE', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
  }

  // ── Members ──

  async listMembers(guildId: string, limit = 100): Promise<Member[]> {
    return (await this.request('GET', `/guilds/${guildId}/members?limit=${Math.min(limit, 1000)}`)) as Member[];
  }

  async getMember(guildId: string, userId: string): Promise<Member> {
    return (await this.request('GET', `/guilds/${guildId}/members/${userId}`)) as Member;
  }

  async kickMember(guildId: string, userId: string): Promise<void> {
    await this.request('DELETE', `/guilds/${guildId}/members/${userId}`);
  }

  async banMember(guildId: string, userId: string): Promise<void> {
    await this.request('PUT', `/guilds/${guildId}/bans/${userId}`);
  }

  async modifyMember(guildId: string, userId: string, data: Record<string, unknown>): Promise<Member> {
    return (await this.request('PATCH', `/guilds/${guildId}/members/${userId}`, data)) as Member;
  }
}

// ── Types ──

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface GuildFull extends Guild {
  approximate_member_count?: number;
  approximate_presence_count?: number;
  description: string | null;
  premium_tier: number;
  premium_subscription_count: number;
}

export interface PermissionOverwrite {
  id: string;
  type: number; // 0 = role, 1 = member
  allow: string;
  deny: string;
}

export interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
  topic?: string | null;
  permission_overwrites?: PermissionOverwrite[];
}

export interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface Member {
  user?: {
    id: string;
    username: string;
    global_name: string | null;
  };
  nick: string | null;
  roles: string[];
  joined_at: string;
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface MessagePayload {
  content?: string;
  embeds?: Embed[];
  message_reference?: { message_id: string };
}

export interface Message {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  pinned: boolean;
  author: {
    id: string;
    username: string;
    bot?: boolean;
  };
  embeds?: Embed[];
}

export interface Invite {
  code: string;
  channel: { id: string; name: string } | null;
  inviter?: { id: string; username: string };
  uses: number;
  max_uses: number;
  max_age: number;
  temporary: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  target_id: string | null;
  action_type: number;
  reason?: string;
  changes?: { key: string; old_value?: unknown; new_value?: unknown }[];
}

export interface AuditLog {
  audit_log_entries: AuditLogEntry[];
  users: { id: string; username: string }[];
}

export const AUDIT_ACTION: Record<string, number> = {
  guild_update: 1,
  channel_create: 10,
  channel_update: 11,
  channel_delete: 12,
  member_kick: 20,
  member_prune: 21,
  member_ban_add: 22,
  member_ban_remove: 23,
  member_update: 24,
  member_role_update: 25,
  bot_add: 28,
  role_create: 30,
  role_update: 31,
  role_delete: 32,
  invite_create: 40,
  invite_delete: 42,
  webhook_create: 50,
  webhook_update: 51,
  webhook_delete: 52,
  emoji_create: 60,
  emoji_delete: 62,
  message_delete: 72,
  message_bulk_delete: 73,
  message_pin: 74,
  message_unpin: 75,
  thread_create: 110,
  thread_update: 111,
  thread_delete: 112,
  automod_rule_create: 140,
  automod_rule_update: 141,
  automod_rule_delete: 142,
  automod_block_message: 143,
  integration_create: 80,
  integration_update: 81,
  integration_delete: 82,
};

export const AUDIT_ACTION_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(AUDIT_ACTION).map(([k, v]) => [v, k])
);
