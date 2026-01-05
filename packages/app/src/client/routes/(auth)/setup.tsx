import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@ui';
import { authClient } from '@client/lib/auth';
import { hc } from '@client/lib/hc';
import Logo from '@client/components/icons/llmops.svg?react';
import { logoWithDarkmode } from '@client/styles/logo.css';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/setup' as any)({
  component: SetupPage,
});

function SetupPage() {
  // If setup is already complete, redirect to signin
  const setupComplete = window.bootstrapData?.setupComplete ?? false;
  if (setupComplete) {
    return <Navigate to={'/signin' as any} />;
  }
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      // Get the user ID from the signup result
      const userId = result.data?.user?.id;

      // Set up workspace with superAdminId and mark setup complete
      await hc.v1['workspace-settings'].$patch({
        json: {
          setupComplete: true,
          superAdminId: userId,
        },
      });

      // Reload the page to get fresh bootstrapData with setupComplete=true
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
        <Link to={'/signin' as any} className={styles.topLink}>
          Sign in
        </Link>

        <div className={styles.formContainer}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Create an account</h1>
            <p className={styles.authDescription}>
              Enter your details below to create your account
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
              <input
                id="password"
                type="password"
                className={styles.authInput}
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <p className={styles.authFooter}>
            Already have an account?{' '}
            <Link to={'/signin' as any} className={styles.authLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
