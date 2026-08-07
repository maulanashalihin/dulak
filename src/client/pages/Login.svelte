<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte'
  import AuthLayout from '../components/AuthLayout.svelte'
  import Field from '../components/Field.svelte'

  let { googleEnabled = false, notice = null }: { googleEnabled?: boolean; notice?: string | null } = $props()

  const form = useForm({ email: '', password: '' })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    form.post('/login')
  }
</script>

<svelte:head><title>Login</title></svelte:head>

<AuthLayout>
  <h1>Welcome back</h1>
  <p class="auth-sub">Log in to your account to continue.</p>

  {#if notice}
    <div class="notice notice-success" role="status">{notice}</div>
  {/if}

  {#if googleEnabled}
    <a class="btn btn-block btn-google" href="/auth/google">
      Log in with Google
    </a>
    <div class="divider">or</div>
  {/if}

  <form onsubmit={submit} novalidate>
    <Field id="email" label="Email" error={form.errors.email}>
      <input
        id="email"
        type="email"
        name="email"
        autocomplete="email"
        bind:value={form.email}
        onchange={() => form.clearErrors('email')}
      />
    </Field>

    <Field id="password" label="Password" error={form.errors.password}>
      <input
        id="password"
        type="password"
        name="password"
        autocomplete="current-password"
        bind:value={form.password}
        onchange={() => form.clearErrors('password')}
      />
    </Field>

    <div class="form-row">
      <Link href="/forgot-password" class="link-small">
        Forgot your password?
      </Link>
    </div>

    <button
      class="btn btn-primary btn-block"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Signing in…' : 'Sign in'}
    </button>
  </form>

  <p class="auth-alt">
    No account yet? <Link href="/register">Create one</Link>
  </p>
</AuthLayout>
