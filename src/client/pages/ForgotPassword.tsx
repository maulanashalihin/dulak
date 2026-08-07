import { Head, Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'

export default function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors, clearErrors } = useForm({ email: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    post('/forgot-password')
  }

  return (
    <AuthLayout>
      <Head title="Forgot password" />
      <h1>Reset your password</h1>
      <p className="auth-sub">Enter your email and we will send you a reset link.</p>

      {status === 'sent' ? (
        <div className="notice notice-success" role="status">
          If that email is registered, a reset link has been sent. Check your inbox.
        </div>
      ) : null}

      <form onSubmit={submit} noValidate>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => {
              clearErrors('email')
              setData('email', e.target.value)
            }}
          />
        </Field>

        <button className="btn btn-primary btn-block" type="submit" disabled={processing}>
          {processing ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-alt">
        Remembered it? <Link href="/login">Back to login</Link>
      </p>
    </AuthLayout>
  )
}
