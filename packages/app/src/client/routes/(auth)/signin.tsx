import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@ui';
import { authClient } from '@client/lib/auth';
import Logo from '@client/components/icons/llmops.svg?react';
import { logoWithDarkmode } from '@client/styles/logo.css';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/signin' as any)({
  component: SignInPage,
});

interface SignInFormData {
  email: string;
  password: string;
}

function SignInPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>();

  const onSubmit = (data: SignInFormData) => {
    setServerError(null);
    setIsLoading(true);

    authClient.signIn
      .email({
        email: data.email,
        password: data.password,
      })
      .then((result) => {
        if (result.error) {
          setServerError(result.error.message || 'Failed to sign in');
          return;
        }

        navigate({
          to: '/',
          reloadDocument: true,
        });
      })
      .catch(() => {
        setServerError('An unexpected error occurred');
      })
      .finally(() => {
        setIsLoading(false);
      });
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

          <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.authField}>
              <label className={styles.authLabel} htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                size="lg"
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <span className={styles.authFieldError}>
                  {errors.email.message}
                </span>
              )}
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
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              {errors.password && (
                <span className={styles.authFieldError}>
                  {errors.password.message}
                </span>
              )}
            </div>

            {serverError && (
              <div className={styles.authError}>{serverError}</div>
            )}

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
