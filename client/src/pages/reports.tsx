import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, UserCheck, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';

export default function Reports() {
  const { user } = useAuth();
  
  const canExport = user && hasPermission(user.permissions, 'reports:export');

  const userGrowthData = [
    { month: 'Jan', users: 45 },
    { month: 'Feb', users: 52 },
    { month: 'Mar', users: 61 },
    { month: 'Apr', users: 73 },
    { month: 'May', users: 89 },
    { month: 'Jun', users: 102 },
  ];

  const loginActivityData = [
    { day: 'Mon', logins: 24 },
    { day: 'Tue', logins: 18 },
    { day: 'Wed', logins: 32 },
    { day: 'Thu', logins: 28 },
    { day: 'Fri', logins: 45 },
    { day: 'Sat', logins: 12 },
    { day: 'Sun', logins: 8 },
  ];

  const roleDistributionData = [
    { name: 'Administrator', value: 12, color: 'hsl(var(--primary))' },
    { name: 'Manager', value: 34, color: 'hsl(var(--chart-2))' },
    { name: 'Staff', value: 96, color: 'hsl(var(--chart-3))' },
  ];

  const handleExport = (reportType: string) => {
    // Mock export functionality
    const blob = new Blob([`${reportType} Report Data\nGenerated on: ${new Date().toISOString()}`], 
      { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase()}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Reports</h2>
          <p className="text-muted-foreground">Analyze user activity and system metrics</p>
        </div>
        {canExport && (
          <Button className="flex items-center space-x-2" data-testid="button-export-all">
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card data-testid="card-total-users">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-card-foreground">142</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary">+14.6%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-users">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-card-foreground">89</p>
              </div>
              <UserCheck className="w-8 h-8 text-chart-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-2">62.7%</span> of total users
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-daily-logins">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Logins</p>
                <p className="text-3xl font-bold text-card-foreground">28</p>
              </div>
              <Activity className="w-8 h-8 text-chart-3" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-3">+22.4%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-growth-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-3xl font-bold text-card-foreground">12.4%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-4" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Monthly user growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card data-testid="card-user-growth">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Growth</CardTitle>
              {canExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('User Growth')}
                  data-testid="button-export-user-growth"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Login Activity Chart */}
        <Card data-testid="card-login-activity">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Login Activity</CardTitle>
              {canExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('Login Activity')}
                  data-testid="button-export-login-activity"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Bar dataKey="logins" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card data-testid="card-role-distribution">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Role Distribution</CardTitle>
              {canExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('Role Distribution')}
                  data-testid="button-export-role-distribution"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Statistics */}
        <Card data-testid="card-detailed-stats">
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Average Session Duration</p>
                  <p className="text-2xl font-bold">1h 23m</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Failed Login Attempts</p>
                  <p className="text-2xl font-bold text-destructive">12</p>
                </div>
                <Activity className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Password Resets</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Role Changes</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
