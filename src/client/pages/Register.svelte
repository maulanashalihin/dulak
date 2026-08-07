<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte'
  import AuthLayout from '../components/AuthLayout.svelte'
  import Field from '../components/Field.svelte'

  let { googleEnabled = false }: { googleEnabled?: boolean } = $props()

  const form = useForm({ name: '', email: '', password: '' })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    form.post('/register')
  }
</script>

<svelte:head><title>Register</title></svelte:head>

<AuthLayout>
  <h1>Create your account</h1>
  <p class="auth-sub">Start building with the boilerplate in seconds.</p>

  {#if googleEnabled}
    <a class="btn btn-block btn-google" href="/auth/google">
      Register with Google
    </a>
    <div class="divider">or</div>
  {/if}

  <form onsubmit={submit} novalidate>
    <Field id="name" label="Name" error={form.errors.name}>
      <input
        id="name"
        type="text"
        name="name"
        autocomplete="name"
        bind:value={form.name}
        onchange={() => form.clearErrors('name')}
      />
    </Field>

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
        autocomplete="new-password"
        bind:value={form.password}
        onchange={() => form.clearErrors('password')}
      />
      <p class="field-hint">At least 8 characters.</p>
    </Field>

    <button
      class="btn btn-primary btn-block"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Creating account…' : 'Create account'}
    </button>
  </form>

  <p class="auth-alt">
    Already have an account? <Link href="/login">Log in</Link>
  </p>
</AuthLayout>
