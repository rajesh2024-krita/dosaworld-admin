import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { CreditCard, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();
  
  const canUpdate = user && hasPermission(user.permissions, 'billing:update');

  const currentPlan = {
    name: 'Enterprise',
    price: 99,
    billing: 'monthly',
    status: 'active',
    nextBilling: '2024-02-15',
    features: [
      'Unlimited users',
      'Advanced role management',
      'Audit logging',
      'Premium support',
      'API access'
    ]
  };

  const invoices = [
    {
      id: 'INV-001',
      date: '2024-01-15',
      amount: 99,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-002',
      date: '2023-12-15',
      amount: 99,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-003',
      date: '2023-11-15',
      amount: 99,
      status: 'paid',
      downloadUrl: '#'
    },
  ];

  const usage = {
    users: { current: 142, limit: 1000 },
    storage: { current: 2.4, limit: 10 },
    apiCalls: { current: 8750, limit: 100000 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.round((current / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="lg:col-span-2" data-testid="card-current-plan">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge className={getStatusColor(currentPlan.status)}>
                {currentPlan.status.charAt(0).toUpperCase() + currentPlan.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-card-foreground">{currentPlan.name}</h3>
                <p className="text-3xl font-bold text-primary">
                  ${currentPlan.price}
                  <span className="text-base font-normal text-muted-foreground">/{currentPlan.billing}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Next billing: {new Date(currentPlan.nextBilling).toLocaleDateString()}
                </p>
              </div>
              <CreditCard className="w-12 h-12 text-muted-foreground" />
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="font-semibold text-card-foreground">Plan Features</h4>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-3">
              {canUpdate && (
                <>
                  <Button variant="outline" data-testid="button-change-plan">
                    Change Plan
                  </Button>
                  <Button variant="outline" data-testid="button-update-payment">
                    Update Payment Method
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card data-testid="card-usage-stats">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Users</span>
                <span>{usage.users.current}/{usage.users.limit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.users.current, usage.users.limit)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Storage</span>
                <span>{usage.storage.current}GB/{usage.storage.limit}GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-chart-2 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.storage.current, usage.storage.limit)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>API Calls</span>
                <span>{usage.apiCalls.current.toLocaleString()}/{usage.apiCalls.limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-chart-3 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.apiCalls.current, usage.apiCalls.limit)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card data-testid="card-payment-method">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-primary rounded flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/24</p>
              </div>
            </div>
            {canUpdate && (
              <Button variant="outline" size="sm" data-testid="button-update-card">
                Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card data-testid="card-invoice-history">
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-medium">${invoice.amount}</p>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-download-${invoice.id}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
