<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte'
  import AuthLayout from '../components/AuthLayout.svelte'
  import Field from '../components/Field.svelte'

  let { status = undefined }: { status?: string } = $props()

  const form = useForm({ email: '' })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    form.post('/forgot-password')
  }
</script>

<svelte:head><title>Forgot password</title></svelte:head>

<AuthLayout>
  <h1>Reset your password</h1>
  <p class="auth-sub">Enter your email and we will send you a reset link.</p>

  {#if status === 'sent'}
    <div class="notice notice-success" role="status">
      If that email is registered, a reset link has been sent. Check your inbox.
    </div>
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

    <button
      class="btn btn-primary btn-block"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Sending…' : 'Send reset link'}
    </button>
  </form>

  <p class="auth-alt">
    Remembered it? <Link href="/login">Back to login</Link>
  </p>
</AuthLayout>
