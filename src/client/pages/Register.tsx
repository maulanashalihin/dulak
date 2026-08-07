import { Head, Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'

export default function Register({ googleEnabled }: { googleEnabled: boolean }) {
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    post('/register')
  }

  return (
    <AuthLayout>
      <Head title="Register" />
      <h1>Create your account</h1>
      <p className="auth-sub">Start building with the boilerplate in seconds.</p>

      {googleEnabled ? (
        <>
          <a className="btn btn-block btn-google" href="/auth/google">
            Register with Google
          </a>
          <div className="divider">or</div>
        </>
      ) : null}

      <form onSubmit={submit} noValidate>
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            value={data.name}
            onChange={(e) => {
              clearErrors('name')
              setData('name', e.target.value)
            }}
          />
        </Field>

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

        <Field id="password" label="Password" error={errors.password}>
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

        <button className="btn btn-primary btn-block" type="submit" disabled={processing}>
          {processing ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-alt">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
