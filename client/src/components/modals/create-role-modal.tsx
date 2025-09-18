import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { LocalStorage } from '@/lib/storage';
import { insertRoleSchema } from '@shared/schema';
import { ALL_PERMISSIONS, MODULES, getPermissionsByModule } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { X } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleCreated: () => void;
}

export default function CreateRoleModal({ isOpen, onClose, onRoleCreated }: CreateRoleModalProps) {
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const form = useForm({
    resolver: zodResolver(insertRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      color: 'primary'
    }
  });

  const groupedPermissions = getPermissionsByModule(ALL_PERMISSIONS);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permission];
      } else {
        return prev.filter(p => p !== permission);
      }
    });
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    const modulePermissions = groupedPermissions[module] || [];
    setSelectedPermissions(prev => {
      if (checked) {
        // Add all module permissions
        const newPermissions = [...prev];
        modulePermissions.forEach(perm => {
          if (!newPermissions.includes(perm)) {
            newPermissions.push(perm);
          }
        });
        return newPermissions;
      } else {
        // Remove all module permissions
        return prev.filter(perm => !modulePermissions.includes(perm as any));
      }
    });
  };

  const isModuleFullySelected = (module: string) => {
    const modulePermissions = groupedPermissions[module] || [];
    return modulePermissions.every(perm => selectedPermissions.includes(perm));
  };

  const onSubmit = (data: any) => {
    try {
      const newRole = {
        id: nanoid(),
        ...data,
        permissions: selectedPermissions,
        userCount: 0,
        createdAt: new Date().toISOString()
      };

      LocalStorage.addRole(newRole);

      // Log activity
      LocalStorage.addActivityLog({
        id: nanoid(),
        userId: 'system',
        userName: 'System',
        action: 'role_created',
        description: `New role "${newRole.name}" was created`,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Role created successfully',
        description: `"${newRole.name}" has been added to the system.`,
      });

      onRoleCreated();
      form.reset();
      setSelectedPermissions([]);
    } catch (error) {
      toast({
        title: 'Error creating role',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const getActionLabel = (permission: string) => {
    const [, action] = permission.split(':');
    switch (action) {
      case 'read': return 'View';
      case 'create': return 'Create';
      case 'update': return 'Edit';
      case 'delete': return 'Delete';
      case 'export': return 'Export';
      default: return action;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-role">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Role</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-create-role">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter role name"
                data-testid="input-role-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="color">Role Color</Label>
              <Select onValueChange={(value) => form.setValue('color', value)} defaultValue="primary">
                <SelectTrigger data-testid="select-role-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Blue</SelectItem>
                  <SelectItem value="secondary">Secondary Gray</SelectItem>
                  <SelectItem value="accent">Success Green</SelectItem>
                  <SelectItem value="chart-1">Warning Orange</SelectItem>
                  <SelectItem value="destructive">Danger Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              rows={3}
              placeholder="Describe the role and its responsibilities"
              data-testid="textarea-role-description"
            />
          </div>
          
          <div>
            <Label className="text-base font-medium">Permissions</Label>
            <div className="space-y-4 mt-4">
              {Object.entries(groupedPermissions).map(([module, permissions]) => (
                <div key={module} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-card-foreground capitalize">
                      {MODULES[module as keyof typeof MODULES] || module}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-${module}`}
                        checked={isModuleFullySelected(module)}
                        onCheckedChange={(checked) => handleModuleToggle(module, !!checked)}
                        data-testid={`checkbox-module-${module}`}
                      />
                      <Label htmlFor={`module-${module}`} className="text-sm">Full Access</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {permissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                          data-testid={`checkbox-${permission}`}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {getActionLabel(permission)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-create-role"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              data-testid="button-submit-create-role"
            >
              {form.formState.isSubmitting ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
