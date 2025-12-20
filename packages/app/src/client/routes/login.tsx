import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useLogin } from '@client/hooks/mutations/useLogin';
import { Button } from '@llmops/ui';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await loginMutation.mutateAsync({ email, password });
      // Navigate to home after successful login
      navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: 'var(--color-text)',
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          LLMOps Login
        </h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: 'var(--color-error-background, #fef2f2)',
                color: 'var(--color-error, #dc2626)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor:
                  'var(--color-input-background, var(--color-background))',
                color: 'var(--color-text)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor:
                  'var(--color-input-background, var(--color-background))',
                color: 'var(--color-text)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%' }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
