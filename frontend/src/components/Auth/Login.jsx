import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Login — handles sign-in, sign-up, and email verification in one component.
 * Uses AWS Amplify Cognito auth under the hood.
 */
const Login = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // 'signin' | 'signup' | 'confirm'
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', name: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signIn({ username: form.email, password: form.password });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signUp({
        username: form.email,
        password: form.password,
        options: { userAttributes: { email: form.email, name: form.name } },
      });
      setMode('confirm');
      setSuccessMsg('Verification code sent to your email.');
    } catch (err) {
      setErrorMsg(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await confirmSignUp({ username: form.email, confirmationCode: form.code });
      // Auto sign-in after confirmation
      await signIn({ username: form.email, password: form.password });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendSignUpCode({ username: form.email });
      setSuccessMsg('Verification code resent!');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-gray-900">StudySync</h1>
          <p className="text-gray-500 text-sm mt-1">Find your perfect study group</p>
        </div>

        {/* Tab switcher */}
        {mode !== 'confirm' && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'signin' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'signup' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {successMsg}
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange}
                className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange}
                className="input-field" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange}
                className="input-field" placeholder="Min. 8 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Confirm Email Form */}
        {mode === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-gray-600">Enter the 6-digit code sent to <strong>{form.email}</strong>.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input name="code" type="text" required maxLength={6} value={form.code} onChange={handleChange}
                className="input-field text-center text-2xl tracking-widest" placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={handleResend} className="btn-secondary w-full text-sm">
              Resend Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
