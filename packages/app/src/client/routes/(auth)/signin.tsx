import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Input } from '@ui';
import { authClient } from '@client/lib/auth';
import Logo from '@client/components/icons/llmops.svg?react';
import { logoWithDarkmode } from '@client/styles/logo.css';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/signin' as any)({
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to sign in');
        return;
      }

      // Redirect to home on success
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.logo}>
          <Logo
            className={logoWithDarkmode()}
            viewBox="450 550 1100 1500"
            style={{ height: 22, width: 18 }}
          />
          LLMOps
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Welcome back</h1>
            <p className={styles.authDescription}>
              Enter your credentials to sign in to your account
            </p>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.authField}>
              <label className={styles.authLabel} htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                size="lg"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.authField}>
              <label className={styles.authLabel} htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                size="lg"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className={styles.authError}>{error}</div>}

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className={styles.authButton}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
