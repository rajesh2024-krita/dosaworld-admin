import { Permission } from "@shared/schema";

export const MODULES = {
  dashboard: 'Dashboard',
  users: 'User Management',
  roles: 'Role Management',
  reports: 'Reports',
  settings: 'Settings',
  billing: 'Billing'
};

export const ACTIONS = {
  read: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  export: 'Export'
};

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard:read',
  'users:read', 'users:create', 'users:update', 'users:delete',
  'roles:read', 'roles:create', 'roles:update', 'roles:delete',
  'reports:read', 'reports:export',
  'settings:read', 'settings:update',
  'billing:read', 'billing:update',
];

export function hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function getUserPermissions(roleName: string, roles: any[]): string[] {
  const role = roles.find(r => r.name === roleName);
  return role?.permissions || [];
}

export function canAccessModule(userPermissions: string[], module: string): boolean {
  return userPermissions.some(permission => permission.startsWith(`${module}:`));
}

export function getPermissionsByModule(permissions: Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    const [module] = permission.split(':');
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(permission);
  });
  
  return grouped;
}
