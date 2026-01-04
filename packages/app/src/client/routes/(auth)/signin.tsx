import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@ui';
import { authClient } from '@client/lib/auth';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/signin' as any)({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
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
      navigate({ to: '/' });
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authDescription}>
            Sign in to your LLMOps account
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className={styles.authField}>
            <label className={styles.authLabel} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.authInput}
              placeholder="Enter your email"
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
            <input
              id="password"
              type="password"
              className={styles.authInput}
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
  );
}
