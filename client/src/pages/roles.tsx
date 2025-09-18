import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocalStorage } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { Plus, Edit, Copy, Trash2, Shield, Users as UsersIcon, Check, X } from 'lucide-react';
import CreateRoleModal from '@/components/modals/create-role-modal';
import { useToast } from '@/hooks/use-toast';

export default function Roles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const rolesData = LocalStorage.getRoles();
    const users = LocalStorage.getUsers();
    
    // Calculate user count for each role
    const rolesWithUserCount = rolesData.map(role => ({
      ...role,
      userCount: users.filter(u => u.role === role.name).length
    }));
    
    setRoles(rolesWithUserCount);
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    const users = LocalStorage.getUsers();
    const usersWithRole = users.filter(u => u.role === roleName);
    
    if (usersWithRole.length > 0) {
      toast({
        title: 'Cannot delete role',
        description: `This role is assigned to ${usersWithRole.length} user(s). Please reassign users before deleting.`,
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      LocalStorage.deleteRole(roleId, user?.id, user?.name);
      loadData();
      toast({
        title: 'Role deleted',
        description: 'The role has been successfully deleted.',
      });
    }
  };

  const handleCloneRole = (role: any) => {
    const clonedRole = {
      ...role,
      id: Date.now().toString(),
      name: `${role.name} Copy`,
      createdAt: new Date().toISOString(),
      userCount: 0
    };
    
    LocalStorage.addRole(clonedRole, user?.id, user?.name);
    
    // Log cloning activity separately
    LocalStorage.logActivity({
      action: 'role_cloned',
      description: `Role "${role.name}" was cloned to "${clonedRole.name}" with ${role.permissions.length} permissions`,
      targetId: clonedRole.id,
      targetType: 'role',
      actorId: user?.id || 'system',
      actorName: user?.name || 'System',
      metadata: {
        sourceRoleId: role.id,
        sourceRoleName: role.name,
        clonedPermissions: role.permissions
      }
    });
    
    loadData();
    toast({
      title: 'Role cloned',
      description: `"${clonedRole.name}" has been created with all permissions from "${role.name}".`,
    });
  };

  const canCreateRoles = user && hasPermission(user.permissions, 'roles:create');
  const canUpdateRoles = user && hasPermission(user.permissions, 'roles:update');
  const canDeleteRoles = user && hasPermission(user.permissions, 'roles:delete');

  const getRoleIcon = (roleName: string) => {
    if (roleName.toLowerCase().includes('admin')) return Shield;
    if (roleName.toLowerCase().includes('manager')) return UsersIcon;
    return Shield;
  };

  const modules = ['dashboard', 'users', 'roles', 'reports', 'settings', 'billing'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Role Management</h2>
          <p className="text-muted-foreground">Create and manage roles with specific permissions</p>
        </div>
        {canCreateRoles && (
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center space-x-2"
            data-testid="button-create-role"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </Button>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map((role) => {
          const RoleIcon = getRoleIcon(role.name);
          
          return (
            <Card key={role.id} data-testid={`card-role-${role.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <RoleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground" data-testid={`text-role-name-${role.id}`}>
                        {role.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-role-user-count-${role.id}`}>
                        {role.userCount} users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canUpdateRoles && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Edit Role"
                        data-testid={`button-edit-role-${role.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canCreateRoles && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCloneRole(role)}
                        title="Clone Role"
                        data-testid={`button-clone-role-${role.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {canDeleteRoles && role.name !== 'Administrator' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        title="Delete Role"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-role-${role.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4" data-testid={`text-role-description-${role.id}`}>
                  {role.description}
                </p>
                
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Permissions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 3).map((permission: string) => {
                      const [module] = permission.split(':');
                      return (
                        <Badge 
                          key={permission} 
                          variant="secondary" 
                          className="text-xs"
                          data-testid={`badge-permission-${role.id}-${module}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </Badge>
                      );
                    })}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <Card data-testid="card-permission-matrix">
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Module
                  </th>
                  {roles.map(role => (
                    <th 
                      key={role.id} 
                      className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      data-testid={`th-role-${role.id}`}
                    >
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {modules.map(module => (
                  <tr key={module}>
                    <td className="px-4 py-3 text-sm font-medium text-card-foreground capitalize">
                      {module === 'users' ? 'User Management' : 
                       module === 'roles' ? 'Role Management' :
                       module.charAt(0).toUpperCase() + module.slice(1)}
                    </td>
                    {roles.map(role => (
                      <td key={`${module}-${role.id}`} className="px-4 py-3 text-center">
                        {role.permissions.some((p: string) => p.startsWith(`${module}:`)) ? (
                          <Check 
                            className="w-5 h-5 text-primary mx-auto" 
                            data-testid={`icon-check-${module}-${role.id}`}
                          />
                        ) : (
                          <X 
                            className="w-5 h-5 text-muted-foreground mx-auto" 
                            data-testid={`icon-x-${module}-${role.id}`}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRoleCreated={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
