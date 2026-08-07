import { Head, Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'

export default function ResetPassword({ email, token }: { email: string; token: string }) {
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    email,
    token,
    password: '',
    passwordConfirmation: '',
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    post('/reset-password')
  }

  return (
    <AuthLayout>
      <Head title="Reset password" />
      <h1>Choose a new password</h1>
      <p className="auth-sub">Set a new password for <strong>{email}</strong>.</p>

      <form onSubmit={submit} noValidate>
        <Field id="password" label="New password" error={errors.password}>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={data.password}
            onChange={(e) => {
              clearErrors('password')
              setData('password', e.target.value)
            }}
          />
          <p className="field-hint">At least 8 characters.</p>
        </Field>

        <Field id="passwordConfirmation" label="Confirm password" error={errors.passwordConfirmation}>
          <input
            id="passwordConfirmation"
            type="password"
            name="passwordConfirmation"
            autoComplete="new-password"
            value={data.passwordConfirmation}
            onChange={(e) => {
              clearErrors('passwordConfirmation')
              setData('passwordConfirmation', e.target.value)
            }}
          />
        </Field>

        {errors.token ? (
          <p className="field-error" role="alert">
            {errors.token}
          </p>
        ) : null}

        <button className="btn btn-primary btn-block" type="submit" disabled={processing}>
          {processing ? 'Saving…' : 'Save new password'}
        </button>
      </form>

      <p className="auth-alt">
        <Link href="/login">Back to login</Link>
      </p>
    </AuthLayout>
  )
}
