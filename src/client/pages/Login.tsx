import { Head, Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'

export default function Login() {
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    email: '',
    password: '',
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    post('/login')
  }

  return (
    <AuthLayout>
      <Head title="Login" />
      <h1>Welcome back</h1>
      <p className="auth-sub">Log in to your account to continue.</p>

      <form onSubmit={submit} noValidate>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            value={data.email}
            onChange={(e) => {
              clearErrors('email')
              setData('email', e.target.value)
            }}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={data.password}
            onChange={(e) => {
              clearErrors('password')
              setData('password', e.target.value)
            }}
          />
        </Field>

        <button className="btn btn-primary btn-block" type="submit" disabled={processing}>
          {processing ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-alt">
        No account yet? <Link href="/register">Create one</Link>
      </p>
    </AuthLayout>
  )
}
