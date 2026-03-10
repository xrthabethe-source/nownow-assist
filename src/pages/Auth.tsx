import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail, Lock, User, AlertCircle, Car, Users, ShieldAlert, CheckCircle2, XCircle, Phone, ShieldCheck } from 'lucide-react';
import { trackSecurityEvent } from '@/lib/sentry';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Logo } from '@/components/shared/Logo';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { 
  checkLoginRateLimit, 
  recordLoginAttempt, 
  validateStrongPassword 
} from '@/lib/security';

const emailSchema = z.string().trim().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long');
const phoneSchema = z.string().trim().regex(/^(\+27|0)\d{9}$/, 'Enter a valid SA phone number (e.g. 071 234 5678)');

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  useEffect(() => {
    if (otpResendCountdown > 0) {
      const timer = setTimeout(() => setOtpResendCountdown(otpResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendCountdown]);

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
        navigate('/customer', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate, location]);

  useEffect(() => {
    if (!isLogin && password) {
      setPasswordStrength(validateStrongPassword(password));
    }
  }, [password, isLogin]);

  // Reset OTP state when phone changes
  useEffect(() => {
    setOtpVerified(false);
    setShowOtp(false);
    setOtpCode('');
    setOtpError(null);
  }, [phone]);

  const validateFields = () => {
    const errors: Record<string, string> = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) errors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) errors.password = passwordResult.error.errors[0].message;
    if (!isLogin) {
      const strengthCheck = validateStrongPassword(password);
      if (!strengthCheck.valid) errors.password = 'Password does not meet security requirements';
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) errors.fullName = nameResult.error.errors[0].message;
      const cleanPhone = phone.replace(/\s/g, '');
      const phoneResult = phoneSchema.safeParse(cleanPhone);
      if (!phoneResult.success) errors.phone = phoneResult.error.errors[0].message;
      if (!otpVerified && cleanPhone && phoneResult.success) errors.phone = 'Please verify your phone number';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneResult = phoneSchema.safeParse(cleanPhone);
    if (!phoneResult.success) {
      setFieldErrors(prev => ({ ...prev, phone: phoneResult.error.errors[0].message }));
      return;
    }
    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required to send OTP' }));
      return;
    }

    setOtpSending(true);
    setOtpError(null);
    try {
      const { data, error } = await supabase.functions.invoke('driver-otp', {
        body: { action: 'send', email: email.trim().toLowerCase(), phone: cleanPhone, otp_type: 'phone' },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setShowOtp(true);
      setOtpResendCountdown(60);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 5) {
      setOtpError('Please enter the full 5-digit code');
      return;
    }
    setOtpVerifying(true);
    setOtpError(null);
    try {
      const { data, error } = await supabase.functions.invoke('driver-otp', {
        body: { action: 'verify', email: email.trim().toLowerCase(), otp_type: 'phone', otp_code: otpCode },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.verified) {
        setOtpVerified(true);
        setShowOtp(false);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (retryCountdown > 0) {
      setError(`Please wait ${retryCountdown} seconds before trying again.`);
      return;
    }
    if (!validateFields()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const rateLimit = await checkLoginRateLimit(email);
        if (!rateLimit.allowed || rateLimit.locked) {
          setIsLocked(true);
          setLockoutMessage(rateLimit.message || 'Account temporarily locked due to too many failed attempts.');
          if (rateLimit.retryAfterSeconds) setRetryCountdown(rateLimit.retryAfterSeconds);
          setLoading(false);
          return;
        }
        if (rateLimit.retryAfterSeconds && rateLimit.retryAfterSeconds > 0) {
          setRetryCountdown(rateLimit.retryAfterSeconds);
          setError(`Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`);
          setLoading(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          await recordLoginAttempt(email, false, error.message);
          trackSecurityEvent('login_failed', { email, reason: error.message });
          setError(error.message.includes('Invalid login credentials') ? 'Invalid email or password. Please try again.' : error.message);
        } else {
          await recordLoginAttempt(email, true);
          trackSecurityEvent('login_success', { email });
          setIsLocked(false);
          setLockoutMessage(null);
        }
      } else {
        const { error } = await signUp(email, password, fullName, accountType);
        if (error) {
          setError(error.message.includes('already registered') ? 'This email is already registered. Please sign in instead.' : error.message);
        } else {
          // Update profile with phone number after signup
          // The handle_new_user trigger creates the profile, so we update it
          const cleanPhone = phone.replace(/\s/g, '');
          if (cleanPhone) {
            // Small delay to allow trigger to fire
            setTimeout(async () => {
              const { data: { user: newUser } } = await supabase.auth.getUser();
              if (newUser) {
                await supabase.from('profiles').update({ phone: cleanPhone }).eq('id', newUser.id);
              }
            }, 1000);
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
          </p>
        </div>

        <Card variant="default">
          <CardHeader className="pb-4">
            <CardTitle>{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Create a new account to start using the app'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLocked && lockoutMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Account Temporarily Locked</p>
                  <p>{lockoutMessage}</p>
                  {retryCountdown > 0 && <p className="mt-1 font-mono">Retry in: {retryCountdown}s</p>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-3">
                    <Label>I want to sign up as a</Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(value) => setAccountType(value as 'customer' | 'driver')}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                        <Label
                          htmlFor="customer"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-secondary p-4 hover:bg-secondary/80 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Users className="mb-2 h-6 w-6 text-primary" />
                          <span className="font-medium">Customer</span>
                          <span className="text-xs text-muted-foreground">Request services</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="driver" id="driver" className="peer sr-only" />
                        <Label
                          htmlFor="driver"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-secondary p-4 hover:bg-secondary/80 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Car className="mb-2 h-6 w-6 text-primary" />
                          <span className="font-medium">Driver</span>
                          <span className="text-xs text-muted-foreground">Provide services</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: '' })); }}
                        className="pl-10"
                        maxLength={100}
                      />
                    </div>
                    {fieldErrors.fullName && <p className="text-sm text-destructive">{fieldErrors.fullName}</p>}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: '' })); setIsLocked(false); setLockoutMessage(null); }}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
              </div>

              {/* Mobile Number with OTP - Signup only */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 071 234 5678"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: '' })); }}
                        className="pl-10"
                        disabled={otpVerified}
                      />
                    </div>
                    {otpVerified ? (
                      <div className="flex items-center gap-1 rounded-md bg-primary/10 px-3 text-sm font-medium text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        Verified
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={handleSendOtp}
                        disabled={otpSending || otpResendCountdown > 0 || !phone.trim()}
                      >
                        {otpSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : otpResendCountdown > 0 ? (
                          `${otpResendCountdown}s`
                        ) : showOtp ? (
                          'Resend'
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    )}
                  </div>
                  {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}

                  {/* OTP Input */}
                  {showOtp && !otpVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 rounded-lg border border-border bg-secondary/50 p-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        Enter the 5-digit code sent to your phone
                      </p>
                      <div className="flex items-center gap-2">
                        <InputOTP maxLength={5} value={otpCode} onChange={setOtpCode}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                          </InputOTPGroup>
                        </InputOTP>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleVerifyOtp}
                          disabled={otpVerifying || otpCode.length < 5}
                        >
                          {otpVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                        </Button>
                      </div>
                      {otpError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {otpError}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: '' })); }}
                    className="pl-10"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
                {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                
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
                          {check ? <CheckCircle2 className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                          <span className={check ? 'text-success' : 'text-muted-foreground'}>{label}</span>
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
                onClick={() => { setIsLogin(!isLogin); setError(null); setFieldErrors({}); setIsLocked(false); setLockoutMessage(null); setRetryCountdown(0); setShowOtp(false); setOtpVerified(false); setOtpCode(''); setOtpError(null); }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Protected by enterprise-grade security. Your data is encrypted and secure.
        </p>
      </motion.div>
    </div>
  );
}
