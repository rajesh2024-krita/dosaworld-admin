import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { Save, Shield, Bell, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const canUpdate = user && hasPermission(user.permissions, 'settings:update');

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '30',
    passwordExpiry: '90',
    maxFailedLogins: '5',
    twoFactorAuth: false,
    passwordComplexity: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'RBAC Dashboard',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    auditLogging: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    loginNotifications: true,
    securityAlerts: true,
    systemUpdates: false,
    roleChanges: true,
    userActivity: false,
  });

  const handleSaveSecuritySettings = () => {
    if (!canUpdate) return;
    
    // Save to localStorage
    localStorage.setItem('rbac-security-settings', JSON.stringify(securitySettings));
    toast({
      title: 'Settings saved',
      description: 'Security settings have been updated successfully.',
    });
  };

  const handleSaveSystemSettings = () => {
    if (!canUpdate) return;
    
    localStorage.setItem('rbac-system-settings', JSON.stringify(systemSettings));
    toast({
      title: 'Settings saved',
      description: 'System settings have been updated successfully.',
    });
  };

  const handleSaveNotificationSettings = () => {
    if (!canUpdate) return;
    
    localStorage.setItem('rbac-notification-settings', JSON.stringify(notificationSettings));
    toast({
      title: 'Settings saved',
      description: 'Notification settings have been updated successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card data-testid="card-security-settings">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                disabled={!canUpdate}
                data-testid="input-session-timeout"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                type="number"
                value={securitySettings.passwordExpiry}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: e.target.value }))}
                disabled={!canUpdate}
                data-testid="input-password-expiry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-failed-logins">Max Failed Login Attempts</Label>
              <Input
                id="max-failed-logins"
                type="number"
                value={securitySettings.maxFailedLogins}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxFailedLogins: e.target.value }))}
                disabled={!canUpdate}
                data-testid="input-max-failed-logins"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-two-factor"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="password-complexity">Password Complexity</Label>
                  <p className="text-sm text-muted-foreground">Enforce complex passwords</p>
                </div>
                <Switch
                  id="password-complexity"
                  checked={securitySettings.passwordComplexity}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordComplexity: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-password-complexity"
                />
              </div>
            </div>

            {canUpdate && (
              <Button onClick={handleSaveSecuritySettings} className="w-full" data-testid="button-save-security">
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card data-testid="card-system-settings">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-chart-2" />
              <CardTitle>System Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                disabled={!canUpdate}
                data-testid="input-site-name"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable access</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-maintenance-mode"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="user-registration">User Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new user signups</p>
                </div>
                <Switch
                  id="user-registration"
                  checked={systemSettings.userRegistration}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, userRegistration: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-user-registration"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send system emails</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={systemSettings.emailNotifications}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audit-logging">Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all system activities</p>
                </div>
                <Switch
                  id="audit-logging"
                  checked={systemSettings.auditLogging}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, auditLogging: checked }))}
                  disabled={!canUpdate}
                  data-testid="switch-audit-logging"
                />
              </div>
            </div>

            {canUpdate && (
              <Button onClick={handleSaveSystemSettings} className="w-full" data-testid="button-save-system">
                <Save className="w-4 h-4 mr-2" />
                Save System Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card data-testid="card-notification-settings" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-chart-3" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="login-notifications">Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">Notify on user logins</p>
                  </div>
                  <Switch
                    id="login-notifications"
                    checked={notificationSettings.loginNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, loginNotifications: checked }))}
                    disabled={!canUpdate}
                    data-testid="switch-login-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Critical security events</p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                    disabled={!canUpdate}
                    data-testid="switch-security-alerts"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-updates">System Updates</Label>
                    <p className="text-sm text-muted-foreground">New version notifications</p>
                  </div>
                  <Switch
                    id="system-updates"
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemUpdates: checked }))}
                    disabled={!canUpdate}
                    data-testid="switch-system-updates"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="role-changes">Role Changes</Label>
                    <p className="text-sm text-muted-foreground">User role modifications</p>
                  </div>
                  <Switch
                    id="role-changes"
                    checked={notificationSettings.roleChanges}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, roleChanges: checked }))}
                    disabled={!canUpdate}
                    data-testid="switch-role-changes"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="user-activity">User Activity</Label>
                    <p className="text-sm text-muted-foreground">General user activities</p>
                  </div>
                  <Switch
                    id="user-activity"
                    checked={notificationSettings.userActivity}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, userActivity: checked }))}
                    disabled={!canUpdate}
                    data-testid="switch-user-activity"
                  />
                </div>
              </div>
            </div>

            {canUpdate && (
              <div className="mt-6">
                <Button onClick={handleSaveNotificationSettings} className="w-full md:w-auto" data-testid="button-save-notifications">
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
