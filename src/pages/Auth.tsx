import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail, Lock, User, AlertCircle, Car, Users, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Logo } from '@/components/shared/Logo';
import { 
  checkLoginRateLimit, 
  recordLoginAttempt, 
  validateStrongPassword 
} from '@/lib/security';

// Validation schemas
const emailSchema = z.string().trim().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long');

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Countdown timer for retry delay
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  // Redirect authenticated users
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname;
      
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'driver') {
        navigate('/driver', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate, location]);

  // Validate password strength on change (only for signup)
  useEffect(() => {
    if (!isLogin && password) {
      setPasswordStrength(validateStrongPassword(password));
    }
  }, [password, isLogin]);

  const validateFields = () => {
    const errors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      // Check strong password requirements for signup
      const strengthCheck = validateStrongPassword(password);
      if (!strengthCheck.valid) {
        errors.password = 'Password does not meet security requirements';
      }
      
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        errors.fullName = nameResult.error.errors[0].message;
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check if there's an active countdown
    if (retryCountdown > 0) {
      setError(`Please wait ${retryCountdown} seconds before trying again.`);
      return;
    }
    
    if (!validateFields()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        // Check rate limiting BEFORE attempting login
        const rateLimit = await checkLoginRateLimit(email);
        
        if (!rateLimit.allowed || rateLimit.locked) {
          setIsLocked(true);
          setLockoutMessage(rateLimit.message || 'Account temporarily locked due to too many failed attempts.');
          if (rateLimit.retryAfterSeconds) {
            setRetryCountdown(rateLimit.retryAfterSeconds);
          }
          setLoading(false);
          return;
        }
        
        // Apply progressive delay if needed
        if (rateLimit.retryAfterSeconds && rateLimit.retryAfterSeconds > 0) {
          setRetryCountdown(rateLimit.retryAfterSeconds);
          setError(`Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`);
          setLoading(false);
          return;
        }
        
        const { error } = await signIn(email, password);
        
        if (error) {
          // Record failed attempt
          await recordLoginAttempt(email, false, error.message);
          
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        } else {
          // Record successful login
          await recordLoginAttempt(email, true);
          setIsLocked(false);
          setLockoutMessage(null);
        }
      } else {
        const { error } = await signUp(email, password, fullName, accountType);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/70">
            {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
          </p>
        </div>

        {/* Card with Soft Grey background for readability */}
        <Card variant="default">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground">{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Create a new account to start using the app'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Account Lockout Warning */}
            {isLocked && lockoutMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Account Temporarily Locked</p>
                  <p>{lockoutMessage}</p>
                  {retryCountdown > 0 && (
                    <p className="mt-1 font-mono">Retry in: {retryCountdown}s</p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-3">
                    <Label className="text-foreground">I want to sign up as a</Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(value) => setAccountType(value as 'customer' | 'driver')}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="customer"
                          id="customer"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="customer"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-green-800 p-4 hover:bg-green-700 peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer text-white"
                        >
                          <Users className="mb-2 h-6 w-6" />
                          <span className="font-medium">Customer</span>
                          <span className="text-xs text-white/70">Request services</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="driver"
                          id="driver"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="driver"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-green-800 p-4 hover:bg-green-700 peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer text-white"
                        >
                          <Car className="mb-2 h-6 w-6" />
                          <span className="font-medium">Driver</span>
                          <span className="text-xs text-white/70">Provide services</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                        }}
                        className="pl-10 bg-green-800 text-white placeholder:text-white/50 border-green-700"
                        maxLength={100}
                      />
                    </div>
                    {fieldErrors.fullName && (
                      <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                      setIsLocked(false);
                      setLockoutMessage(null);
                    }}
                    className="pl-10 bg-green-800 text-white placeholder:text-white/50 border-green-700"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    className="pl-10 bg-green-800 text-white placeholder:text-white/50 border-green-700"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-destructive">{fieldErrors.password}</p>
                )}
                
                {/* Password strength indicator for signup */}
                {!isLogin && password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { check: password.length >= 8, label: '8+ characters' },
                        { check: /[A-Z]/.test(password), label: 'Uppercase' },
                        { check: /[a-z]/.test(password), label: 'Lowercase' },
                        { check: /[0-9]/.test(password), label: 'Number' },
                        { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Special char' },
                      ].map(({ check, label }) => (
                        <div key={label} className="flex items-center gap-1 text-xs">
                          {check ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={check ? 'text-success' : 'text-muted-foreground'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="amber"
                className="w-full"
                disabled={loading || (retryCountdown > 0) || (isLocked && retryCountdown > 0)}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : retryCountdown > 0 ? (
                  `Wait ${retryCountdown}s...`
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setFieldErrors({});
                  setIsLocked(false);
                  setLockoutMessage(null);
                  setRetryCountdown(0);
                }}
                className="text-sm text-accent hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <p className="mt-4 text-center text-xs text-white/50">
          Protected by enterprise-grade security. Your data is encrypted and secure.
        </p>
      </motion.div>
    </div>
  );
}