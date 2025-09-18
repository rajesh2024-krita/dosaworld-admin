import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalStorage } from '@/lib/storage';
import { Users, UserCog, LogIn, Shield } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 0,
    loginSessions: 0,
    securityAlerts: 3
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const users = LocalStorage.getUsers();
    const roles = LocalStorage.getRoles();
    const activities = LocalStorage.getActivityLogs();

    // Calculate stats
    setStats({
      totalUsers: users.length,
      activeRoles: roles.length,
      loginSessions: users.filter(u => u.status === 'active').length,
      securityAlerts: 3
    });

    // Get recent activity (last 5)
    // Safe slice
setRecentActivity(Array.isArray(activities) ? activities.slice(0, 5) : []);


    // Calculate role distribution
    const roleCount: Record<string, number> = {};
    users.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });

    const distribution = Object.entries(roleCount).map(([role, count]) => ({
      name: role,
      value: count,
      percentage: Math.round((count / users.length) * 100)
    }));

    setRoleDistribution(distribution);
  };

  const activityChartData = [
    { name: 'Mon', logins: 24 },
    { name: 'Tue', logins: 18 },
    { name: 'Wed', logins: 32 },
    { name: 'Thu', logins: 28 },
    { name: 'Fri', logins: 45 },
    { name: 'Sat', logins: 12 },
    { name: 'Sun', logins: 8 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card data-testid="card-total-users">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-card-foreground" data-testid="stat-total-users">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-active-roles">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
                <p className="text-3xl font-bold text-card-foreground" data-testid="stat-active-roles">
                  {stats.activeRoles}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-chart-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-2">+2</span> new roles added
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-login-sessions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login Sessions</p>
                <p className="text-3xl font-bold text-card-foreground" data-testid="stat-login-sessions">
                  {stats.loginSessions}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <LogIn className="w-6 h-6 text-chart-3" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-3">{Math.floor(stats.loginSessions * 0.3)}</span> active now
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-security-alerts">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Alerts</p>
                <p className="text-3xl font-bold text-card-foreground" data-testid="stat-security-alerts">
                  {stats.securityAlerts}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-chart-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-1">2 resolved</span> today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card data-testid="card-activity-chart">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Activity</CardTitle>
              <select className="text-sm border border-input rounded px-3 py-1 bg-background">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="logins" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card data-testid="card-role-distribution">
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleDistribution.map((role, index) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-card-foreground">{role.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-card-foreground">{role.value}</span>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${role.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-border last:border-b-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-card-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
