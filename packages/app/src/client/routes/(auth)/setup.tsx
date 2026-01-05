import {
  createFileRoute,
  Link,
  Navigate,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@ui';
import { authClient } from '@client/lib/auth';
import Logo from '@client/components/icons/llmops.svg?react';
import { logoWithDarkmode } from '@client/styles/logo.css';
import * as styles from './-styles/auth.css';

export const Route = createFileRoute('/(auth)/setup' as any)({
  component: SetupPage,
});

interface SetupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SetupPage() {
  // If setup is already complete, redirect to signin
  const navigate = useNavigate();
  const setupComplete = window.bootstrapData?.setupComplete ?? false;
  if (setupComplete) {
    return <Navigate to={'/signin' as any} />;
  }

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SetupFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        setServerError(result.error.message || 'Failed to create account');
        return;
      }

      navigate({
        to: '/',
        reloadDocument: true,
      });
    } catch (err) {
      setServerError('An unexpected error occurred');
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

          <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.authField}>
              <label className={styles.authLabel} htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                type="text"
                size="lg"
                placeholder="Enter your name"
                autoComplete="name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <span className={styles.authFieldError}>
                  {errors.name.message}
                </span>
              )}
            </div>

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
                placeholder="Create a password (min. 8 characters)"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />
              {errors.password && (
                <span className={styles.authFieldError}>
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className={styles.authField}>
              <label className={styles.authLabel} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                size="lg"
                placeholder="Confirm your password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <span className={styles.authFieldError}>
                  {errors.confirmPassword.message}
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
