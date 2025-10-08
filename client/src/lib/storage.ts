// storage.ts
export class LocalStorage {
  private static readonly USERS_KEY = 'rbac-users';
  private static readonly ROLES_KEY = 'rbac-roles';
  private static readonly SESSION_KEY = 'rbac-session';

  private static readonly API_BASE = "https://dosaworld-backend.vercel.app/api"; // backend URL

  // ===================== Users =====================
  static getUsers(): any[] {
    return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
  }

  static saveUsers(users: any[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  static async addUser(user: any, actorId?: string, actorName?: string): Promise<void> {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);

    console.log('users == ', users)

    await this.logActivity({
      userId: actorId || "system",
      action: "user_created",
      description: `User ${user.name} (${user.email}) was created with ${user.role} role`,
      targetId: user.id,
      targetType: "user",
    });
  }

  static async updateUser(id: string, updates: any, actorId?: string, actorName?: string): Promise<void> {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      const oldUser = { ...users[index] };
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);

      const sensitiveFields = ['password'];
      const changes = Object.keys(updates)
        .filter(key => !sensitiveFields.includes(key))
        .map(key => `${key}: ${oldUser[key]} → ${updates[key]}`)
        .join(', ');

      let description = `User ${oldUser.name} was updated`;
      if (changes) description += `: ${changes}`;
      if (updates.password) description += changes ? ', password updated' : ': password updated';

      await this.logActivity({
        userId: actorId || "system",
        action: "user_updated",
        description,
        targetId: id,
        targetType: "user",
      });
    }
  }

  static async deleteUser(id: string, actorId?: string, actorName?: string): Promise<void> {
    const users = this.getUsers();
    const userToDelete = users.find(u => u.id === id);
    const filteredUsers = users.filter(u => u.id !== id);
    this.saveUsers(filteredUsers);

    if (userToDelete) {
      await this.logActivity({
        userId: actorId || "system",
        action: "user_deleted",
        description: `User ${userToDelete.name} (${userToDelete.email}) was deleted`,
        targetId: id,
        targetType: "user",
      });
    }
  }

  // ===================== Roles =====================
  static getRoles(): any[] {
    return JSON.parse(localStorage.getItem(this.ROLES_KEY) || '[]');
  }

  static saveRoles(roles: any[]): void {
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
  }

  static async addRole(role: any, actorId?: string): Promise<void> {
    const roles = this.getRoles();
    roles.push(role);
    this.saveRoles(roles);

    await this.logActivity({
      userId: actorId || "system",
      action: "role_created",
      description: `Role "${role.name}" was created with ${role.permissions.length} permissions`,
      targetId: role.id,
      targetType: "role",
    });
  }

  static async updateRole(id: string, updates: any, actorId?: string): Promise<void> {
    const roles = this.getRoles();
    const index = roles.findIndex(r => r.id === id);
    if (index !== -1) {
      const oldRole = { ...roles[index] };
      roles[index] = { ...roles[index], ...updates };
      this.saveRoles(roles);

      const changes = Object.keys(updates).map(key => {
        if (key === 'permissions') {
          return `permissions: ${oldRole[key]?.length || 0} → ${updates[key]?.length || 0}`;
        }
        return `${key}: ${oldRole[key]} → ${updates[key]}`;
      }).join(', ');

      await this.logActivity({
        userId: actorId || "system",
        action: "role_updated",
        description: `Role "${oldRole.name}" was updated: ${changes}`,
        targetId: id,
        targetType: "role",
      });
    }
  }

  static async deleteRole(id: string, actorId?: string): Promise<void> {
    const roles = this.getRoles();
    const roleToDelete = roles.find(r => r.id === id);
    const filteredRoles = roles.filter(r => r.id !== id);
    this.saveRoles(filteredRoles);

    if (roleToDelete) {
      await this.logActivity({
        userId: actorId || "system",
        action: "role_deleted",
        description: `Role "${roleToDelete.name}" was deleted`,
        targetId: id,
        targetType: "role",
      });
    }
  }

  // ===================== Session =====================
  static getSession(): any | null {
    const session = localStorage.getItem(this.SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  static saveSession(user: any): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // ===================== Activity Logs (Backend) =====================
  static async getActivityLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${this.API_BASE}/logs`);
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch logs", err);
      return [];
    }
  }

  static async logActivity(activity: {
    userId: string;
    action: string;
    description: string;
    targetId?: string;
    targetType?: 'user' | 'role' | 'system';
  }): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
      });
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  }
}
