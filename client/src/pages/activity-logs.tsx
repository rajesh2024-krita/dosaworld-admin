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
import { LocalStorage } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { Search, Filter, X, Download, Users, Shield, Activity, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ActivityLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      // const res = await fetch('http://localhost:3000/api/logs'); // adjust route if needed
      const res = await fetch('https://dosaworld-backend.vercel.app/api/logs'); // adjust route if needed
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load activity logs',
        variant: 'destructive',
      });
    }
  };


  const filteredLogs = logs.filter(log => {
    // Basic search
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase());

    // Action filter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    // Actor filter
    const matchesActor = actorFilter === 'all' || log.actorName === actorFilter;

    // Target type filter
    const matchesTargetType = targetTypeFilter === 'all' || log.targetType === targetTypeFilter;

    // Date range filter
    let matchesDateRange = true;
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(dateRangeFilter.start);
      const endDate = new Date(dateRangeFilter.end);
      matchesDateRange = logDate >= startDate && logDate <= endDate;
    }

    return matchesSearch && matchesAction && matchesActor && matchesTargetType && matchesDateRange;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setActorFilter('all');
    setTargetTypeFilter('all');
    setDateRangeFilter({ start: '', end: '' });
    setShowAdvancedFilters(false);
  };

  const handleExportLogs = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`https://dosaworld-backend.vercel.app/api/logs/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-export.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export completed',
        description: `Activity logs exported as ${format.toUpperCase()}`,
      });

      setTimeout(loadLogs, 100);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Export failed',
        variant: 'destructive',
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <Users className="w-4 h-4" />;
      case 'user_created':
      case 'user_updated':
      case 'user_deleted':
        return <Users className="w-4 h-4" />;
      case 'role_created':
      case 'role_updated':
      case 'role_deleted':
      case 'role_cloned':
        return <Shield className="w-4 h-4" />;
      case 'password_reset':
        return <RefreshCw className="w-4 h-4" />;
      case 'data_export':
        return <Download className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'login': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'logout': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'user_created': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'user_updated': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      'user_deleted': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'role_created': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'role_updated': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'role_deleted': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'role_cloned': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'password_reset': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'data_export': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[action] || 'bg-accent text-accent-foreground';
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueActors = Array.from(new Set(logs.map(log => log.actorName)));
  const uniqueTargetTypes = Array.from(new Set(logs.map(log => log.targetType).filter(Boolean)));

  const canViewLogs = user && hasPermission(user.permissions, 'dashboard:read');

  if (!canViewLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view activity logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Activity Logs</h2>
          <p className="text-muted-foreground">Monitor system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadLogs}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <Select onValueChange={(value) => value && handleExportLogs(value as 'csv' | 'json')}>
            <SelectTrigger className="w-40" data-testid="select-export-logs">
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

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Primary Filter Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-logs"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40" data-testid="select-action-filter">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={actorFilter} onValueChange={setActorFilter}>
                  <SelectTrigger className="w-40" data-testid="select-actor-filter">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueActors.map(actor => (
                      <SelectItem key={actor} value={actor}>{actor}</SelectItem>
                    ))}
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

                {(searchTerm || actionFilter !== 'all' || actorFilter !== 'all' ||
                  dateRangeFilter.start || dateRangeFilter.end || targetTypeFilter !== 'all') && (
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
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={dateRangeFilter.start}
                      onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                      className="flex-1"
                      data-testid="input-date-start"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={dateRangeFilter.end}
                      onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                      className="flex-1"
                      data-testid="input-date-end"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Type</label>
                  <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger data-testid="select-target-type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTargetTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} log entries
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                          {log.targetType && (
                            <Badge variant="outline" className="text-xs">
                              {log.targetType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-card-foreground">{log.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>by {log.actorName}</span>
                        {log.targetId && (
                          <span className="ml-2">• Target ID: {log.targetId}</span>
                        )}
                      </div>
                    </div>
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