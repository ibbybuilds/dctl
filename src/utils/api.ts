const BASE = 'https://discord.com/api/v10';

export const PERMISSION: Record<string, bigint> = {
  view_channel: 1n << 10n,
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
  manage_channels: 1n << 4n,
  manage_roles: 1n << 28n,
  connect: 1n << 20n,
  speak: 1n << 21n,
  mute_members: 1n << 22n,
  deafen_members: 1n << 23n,
  move_members: 1n << 24n,
  use_voice_activity: 1n << 25n,
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
