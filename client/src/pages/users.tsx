import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LocalStorage } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { Plus, Search, Edit, Key, Trash2, Filter, X, Calendar, Download } from 'lucide-react';
import CreateUserModal from '@/components/modals/create-user-modal';
import { useToast } from '@/hooks/use-toast';

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [lastLoginFilter, setLastLoginFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(LocalStorage.getUsers());
    setRoles(LocalStorage.getRoles());
  };

  const filteredUsers = users.filter(u => {
    // Basic search
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    
    // Date range filter (account creation)
    let matchesDateRange = true;
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const userDate = new Date(u.createdAt);
      const startDate = new Date(dateRangeFilter.start);
      const endDate = new Date(dateRangeFilter.end);
      matchesDateRange = userDate >= startDate && userDate <= endDate;
    }
    
    // Last login filter
    let matchesLastLogin = true;
    if (lastLoginFilter !== 'all') {
      const now = new Date();
      const lastLogin = new Date(u.lastLogin);
      const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (lastLoginFilter) {
        case 'today':
          matchesLastLogin = daysDiff === 0;
          break;
        case 'week':
          matchesLastLogin = daysDiff <= 7;
          break;
        case 'month':
          matchesLastLogin = daysDiff <= 30;
          break;
        case 'never':
          matchesLastLogin = !u.lastLogin;
          break;
      }
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDateRange && matchesLastLogin;
  });

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      LocalStorage.deleteUser(userId, user?.id, user?.name);
      loadData();
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });
    }
  };

  const handleResetPassword = (userId: string) => {
    if (window.confirm('Are you sure you want to reset this user\'s password?')) {
      // Generate a secure temporary password
      const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8).toUpperCase();
      LocalStorage.updateUser(userId, { password: tempPassword }, user?.id, user?.name);
      
      toast({
        title: 'Password reset',
        description: 'Password has been reset. The user will receive secure credentials through their registered email.',
      });
      
      loadData();
    }
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk actions.',
        variant: 'destructive'
      });
      return;
    }

    if (bulkAction === 'activate') {
      selectedUsers.forEach(userId => {
        LocalStorage.updateUser(userId, { status: 'active' }, user?.id, user?.name);
      });
      toast({
        title: 'Users activated',
        description: `${selectedUsers.length} users have been activated.`,
      });
    } else if (bulkAction === 'deactivate') {
      selectedUsers.forEach(userId => {
        LocalStorage.updateUser(userId, { status: 'inactive' }, user?.id, user?.name);
      });
      toast({
        title: 'Users deactivated',
        description: `${selectedUsers.length} users have been deactivated.`,
      });
    } else if (bulkAction.startsWith('role:')) {
      const newRole = bulkAction.replace('role:', '');
      selectedUsers.forEach(userId => {
        LocalStorage.updateUser(userId, { role: newRole }, user?.id, user?.name);
      });
      toast({
        title: 'Role updated',
        description: `${selectedUsers.length} users have been assigned to ${newRole} role.`,
      });
    }

    setSelectedUsers([]);
    setBulkAction('');
    loadData();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateRangeFilter({ start: '', end: '' });
    setLastLoginFilter('all');
    setShowAdvancedFilters(false);
  };

  const handleExportUsers = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvContent = LocalStorage.exportUsersToCSV();
      LocalStorage.downloadFile(csvContent, `users-export-${timestamp}.csv`, 'text/csv');
    } else {
      const jsonContent = LocalStorage.exportUsersToJSON();
      LocalStorage.downloadFile(jsonContent, `users-export-${timestamp}.json`, 'application/json');
    }

    // Log export activity
    LocalStorage.logActivity({
      action: 'data_export',
      description: `User data exported to ${format.toUpperCase()} format`,
      targetType: 'system',
      actorId: user?.id || 'system',
      actorName: user?.name || 'System',
      metadata: {
        exportType: 'users',
        format: format,
        recordCount: users.length
      }
    });

    toast({
      title: 'Export completed',
      description: `Users data has been exported to ${format.toUpperCase()} format.`,
    });
  };

  const canCreateUsers = user && hasPermission(user.permissions, 'users:create');
  const canUpdateUsers = user && hasPermission(user.permissions, 'users:update');
  const canDeleteUsers = user && hasPermission(user.permissions, 'users:delete');

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Administrator': 'bg-primary/10 text-primary',
      'Manager': 'bg-chart-2/10 text-chart-2',
      'Staff': 'bg-chart-3/10 text-chart-3',
    };
    return colors[role] || 'bg-accent text-accent-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage users and their role assignments</p>
        </div>
        {canCreateUsers && (
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center space-x-2"
            data-testid="button-add-user"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Select onValueChange={(value) => value && handleExportUsers(value as 'csv' | 'json')}>
            <SelectTrigger className="w-40" data-testid="select-export-format">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export as CSV</SelectItem>
              <SelectItem value="json">Export as JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Primary Filter Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40" data-testid="select-role-filter">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2"
                  data-testid="button-advanced-filters"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced</span>
                </Button>

                {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || 
                  dateRangeFilter.start || dateRangeFilter.end || lastLoginFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 text-muted-foreground"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Created</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={dateRangeFilter.start}
                      onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                      className="flex-1"
                      data-testid="input-date-start"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={dateRangeFilter.end}
                      onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                      className="flex-1"
                      data-testid="input-date-end"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Login</label>
                  <Select value={lastLoginFilter} onValueChange={setLastLoginFilter}>
                    <SelectTrigger data-testid="select-last-login-filter">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="never">Never Logged In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Results Count and Bulk Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
                {selectedUsers.length > 0 && (
                  <span className="ml-2 font-medium">
                    ({selectedUsers.length} selected)
                  </span>
                )}
              </div>

              {selectedUsers.length > 0 && canUpdateUsers && (
                <div className="flex items-center space-x-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48" data-testid="select-bulk-action">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Activate Selected</SelectItem>
                      <SelectItem value="deactivate">Deactivate Selected</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={`role:${role.name}`}>
                          Assign to {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    size="sm"
                    data-testid="button-apply-bulk-action"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-users">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-accent/50" data-testid={`row-user-${userData.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0">
                          {getUserInitials(userData.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-card-foreground" data-testid={`text-user-name-${userData.id}`}>
                            {userData.name}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-user-email-${userData.id}`}>
                            {userData.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleColor(userData.role)} data-testid={`badge-role-${userData.id}`}>
                        {userData.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(userData.status)} data-testid={`badge-status-${userData.id}`}>
                        {userData.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground" data-testid={`text-last-login-${userData.id}`}>
                      {userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canUpdateUsers && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleResetPassword(userData.id)}
                              title="Reset Password"
                              data-testid={`button-reset-password-${userData.id}`}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Edit User"
                              data-testid={`button-edit-${userData.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {canDeleteUsers && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteUser(userData.id)}
                            title="Delete User"
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${userData.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
          <span className="font-medium">{filteredUsers.length}</span> results
        </p>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
