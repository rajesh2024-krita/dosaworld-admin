import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/assets/logo.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, quickLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Staff'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({
        email: loginForm.email,
        password: loginForm.password
      });
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      setLocation('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleType: 'admin' | 'manager' | 'staff') => {
    setIsLoading(true);
    setError('');

    try {
      await quickLogin(roleType);
      toast({
        title: 'Welcome!',
        description: `Logged in as ${roleType}.`,
      });
      setLocation('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 to-green-800 items-start justify-center p-8">
        <div className="text-center text-primary-foreground">
          <div className="w-56 mx-auto mb-6 flex items-center justify-center">
            {/* Replace with restaurant logo */}
            <img src={Logo} alt="Dosa World Logo" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Dosa World</h1>
          <p className="text-xl opacity-90 mb-6">
            Authentic South Indian Flavors in the Heart of Germany
          </p>
          <div className="space-y-3 text-left max-w-sm">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5" />
              <span>Freshly made traditional dosas</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5" />
              <span>Variety of chutneys and fillings</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5" />
              <span>Cozy and family-friendly ambiance</span>
            </div>
          </div>
        </div>
      </div>


      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-card-foreground">
              {showRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {showRegister ? 'Sign up for a new account' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showRegister ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    data-testid="input-password"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={loginForm.rememberMe}
                      onCheckedChange={(checked) =>
                        setLoginForm(prev => ({ ...prev, rememberMe: !!checked }))
                      }
                      data-testid="checkbox-remember"
                    />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                  <Button variant="link" className="text-sm p-0" data-testid="link-forgot-password">
                    Forgot password?
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Demo Login Options */}
              {/* <div className="border-t border-border pt-6">
                <p className="text-center text-sm text-muted-foreground mb-4">Demo Login Options</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={isLoading}
                    data-testid="button-quick-admin"
                  >
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin User
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Full Access</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleQuickLogin('manager')}
                    disabled={isLoading}
                    data-testid="button-quick-manager"
                  >
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Manager User
                    </span>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">Limited Access</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleQuickLogin('staff')}
                    disabled={isLoading}
                    data-testid="button-quick-staff"
                  >
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Staff User
                    </span>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">Basic Access</span>
                  </Button>
                </div>
              </div> */}
            </>
          ) : (
            <form className="space-y-4" data-testid="form-register">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  data-testid="input-register-name"
                />
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  data-testid="input-register-email"
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Enter password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  data-testid="input-register-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {showRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            </span>
            <Button
              variant="link"
              className="text-sm p-0"
              onClick={() => setShowRegister(!showRegister)}
              data-testid="button-toggle-register"
            >
              {showRegister ? 'Sign in here' : 'Register here'}
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
