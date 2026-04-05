import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { authAPI } from '@/api/client';

// screens: 'login' | 'register' | 'verify-otp' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, register } = useAuth();
  const [screen, setScreen] = useState('login');
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
    otp: '', newPassword: '', confirmNewPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const reset = () => { setError(''); setSuccess(''); };

  const goTo = (s) => { setScreen(s); reset(); };

  // ── Register Step 1: send OTP
  const handleRegister = async () => {
    reset();
    if (!form.full_name || !form.email || !form.password || !form.confirmPassword) {
      return setError('All fields are required');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await authAPI.registerSendOtp({ full_name: form.full_name, email: form.email, password: form.password });
      setSuccess(`OTP sent to ${form.email}`);
      goTo('verify-otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Register Step 2: verify OTP
  const handleVerifyOtp = async () => {
    reset();
    if (!form.otp) return setError('Enter the OTP');
    setLoading(true);
    try {
      const res = await authAPI.registerVerifyOtp({ email: form.email, otp: form.otp });
      localStorage.setItem('visapath_token', res.token);
      await register(res.token, res.user);
      setShowAuthModal(false);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Login
  const handleLogin = async () => {
    reset();
    if (!form.email || !form.password) return setError('Email and password required');
    setLoading(true);
    try {
      await login(form.email, form.password);
      setShowAuthModal(false);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Step 1: send OTP
  const handleForgotSendOtp = async () => {
    reset();
    if (!form.email) return setError('Email is required');
    setLoading(true);
    try {
      await authAPI.forgotSendOtp({ email: form.email });
      setSuccess(`OTP sent to ${form.email}`);
      goTo('forgot-otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Step 2: verify OTP
  const handleForgotVerifyOtp = async () => {
    reset();
    if (!form.otp) return setError('Enter the OTP');
    setLoading(true);
    try {
      await authAPI.forgotVerifyOtp({ email: form.email, otp: form.otp });
      goTo('forgot-reset');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Step 3: reset password
  const handleForgotReset = async () => {
    reset();
    if (!form.newPassword || !form.confirmNewPassword) return setError('All fields required');
    if (form.newPassword !== form.confirmNewPassword) return setError('Passwords do not match');
    if (form.newPassword.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.forgotReset({ email: form.email, otp: form.otp, newPassword: form.newPassword });
      setSuccess('Password reset! Please sign in.');
      goTo('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: 'Welcome back',
    register: 'Create your account',
    'verify-otp': 'Verify your email',
    'forgot-email': 'Forgot password',
    'forgot-otp': 'Enter OTP',
    'forgot-reset': 'Set new password',
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-primary font-display">VisaCurator</span>
          </div>
          <div className="flex items-center gap-2">
            {!['login', 'register'].includes(screen) && (
              <button onClick={() => goTo('login')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <DialogTitle className="text-xl">{titles[screen]}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* ── LOGIN ── */}
          {screen === 'login' && (<>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@email.com" value={form.email}
                onChange={e => update('email', e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password}
                onChange={e => update('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div className="text-right">
              <button className="text-sm text-primary hover:underline" onClick={() => goTo('forgot-email')}>
                Forgot password?
              </button>
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}
            <Button onClick={handleLogin} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sign In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button className="text-primary font-medium hover:underline" onClick={() => goTo('register')}>Register</button>
            </p>
          </>)}

          {/* ── REGISTER ── */}
          {screen === 'register' && (<>
            <div>
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={form.full_name}
                onChange={e => update('full_name', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@email.com" value={form.email}
                onChange={e => update('email', e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password}
                onChange={e => update('password', e.target.value)} />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="••••••••" value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <Button onClick={handleRegister} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Send OTP
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button className="text-primary font-medium hover:underline" onClick={() => goTo('login')}>Sign In</button>
            </p>
          </>)}

          {/* ── VERIFY OTP (register) ── */}
          {screen === 'verify-otp' && (<>
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit OTP to <span className="font-medium text-foreground">{form.email}</span>
              </p>
            </div>
            <div>
              <Label>Enter OTP</Label>
              <Input placeholder="123456" maxLength={6} value={form.otp}
                onChange={e => update('otp', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                className="text-center text-2xl tracking-widest font-bold h-14" />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}
            <Button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Verify & Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn't get it?{' '}
              <button className="text-primary font-medium hover:underline" onClick={handleRegister}>Resend OTP</button>
            </p>
          </>)}

          {/* ── FORGOT — ENTER EMAIL ── */}
          {screen === 'forgot-email' && (<>
            <p className="text-sm text-muted-foreground">Enter your registered email and we'll send you an OTP.</p>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@email.com" value={form.email}
                onChange={e => update('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotSendOtp()} />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <Button onClick={handleForgotSendOtp} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Send OTP
            </Button>
          </>)}

          {/* ── FORGOT — VERIFY OTP ── */}
          {screen === 'forgot-otp' && (<>
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                OTP sent to <span className="font-medium text-foreground">{form.email}</span>
              </p>
            </div>
            <div>
              <Label>Enter OTP</Label>
              <Input placeholder="123456" maxLength={6} value={form.otp}
                onChange={e => update('otp', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotVerifyOtp()}
                className="text-center text-2xl tracking-widest font-bold h-14" />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}
            <Button onClick={handleForgotVerifyOtp} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Verify OTP
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn't get it?{' '}
              <button className="text-primary font-medium hover:underline" onClick={handleForgotSendOtp}>Resend OTP</button>
            </p>
          </>)}

          {/* ── FORGOT — RESET PASSWORD ── */}
          {screen === 'forgot-reset' && (<>
            <div>
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" value={form.newPassword}
                onChange={e => update('newPassword', e.target.value)} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="••••••••" value={form.confirmNewPassword}
                onChange={e => update('confirmNewPassword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotReset()} />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <Button onClick={handleForgotReset} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Reset Password
            </Button>
          </>)}

        </div>
      </DialogContent>
    </Dialog>
  );
}