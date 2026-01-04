import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@ui';
import { authClient } from '@client/lib/auth';
import { hc } from '@client/lib/hc';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/setup' as any)({
  component: SetupPage,
});

function SetupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        return;
      }

      await hc.v1['workspace-settings'].$patch({
        json: { setupComplete: true },
      });

      // Reload the page to get fresh bootstrapData with setupComplete=true
      // The server middleware will set the new value and redirect logic will handle navigation
      window.location.href = '/';
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
          <h1 className={styles.authTitle}>Welcome to LLMOps</h1>
          <p className={styles.authDescription}>
            Create your admin account to get started
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className={styles.authField}>
            <label className={styles.authLabel} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              className={styles.authInput}
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className={styles.authField}>
            <label className={styles.authLabel} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.authInput}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {error && <div className={styles.authError}>{error}</div>}

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className={styles.authButton}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
