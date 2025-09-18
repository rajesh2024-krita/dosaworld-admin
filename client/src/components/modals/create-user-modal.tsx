import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocalStorage } from '@/lib/storage';
import { insertUserSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { X } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const { toast } = useToast();
  const [roles] = useState(LocalStorage.getRoles());
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: ''
    }
  });

  const onSubmit = (data: any) => {
    try {
      const newUser = {
        id: nanoid(),
        ...data,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        lastLogin: undefined
      };

      LocalStorage.addUser(newUser);

      // Log activity
      LocalStorage.addActivityLog({
        id: nanoid(),
        userId: 'system',
        userName: 'System',
        action: 'user_created',
        description: `New user ${newUser.name} was created with ${newUser.role} role`,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'User created successfully',
        description: `${newUser.name} has been added to the system.`,
      });

      onUserCreated();
      form.reset();
    } catch (error) {
      toast({
        title: 'Error creating user',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-create-user">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New User</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-create-user">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter full name"
              data-testid="input-user-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="Enter email address"
              data-testid="input-user-email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value) => form.setValue('role', value)} required>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="Enter temporary password"
              data-testid="input-user-password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-password-change"
              checked={forcePasswordChange}
              onCheckedChange={(checked) => setForcePasswordChange(!!checked)}
              data-testid="checkbox-force-password-change"
            />
            <Label htmlFor="force-password-change" className="text-sm">
              Force password change on first login
            </Label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-create-user"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              data-testid="button-submit-create-user"
            >
              {form.formState.isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
