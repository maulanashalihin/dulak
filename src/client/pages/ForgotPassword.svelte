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
  <h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Reset your password</h1>
  <p class="text-muted mb-5">Enter your email and we will send you a reset link.</p>

  {#if status === 'sent'}
    <div
      class="px-4 py-3 rounded-lg text-sm mb-5 border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
      role="status"
    >
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
        class="w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary"
        bind:value={form.email}
        onchange={() => form.clearErrors('email')}
      />
    </Field>

    <button
      class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Sending…' : 'Send reset link'}
    </button>
  </form>

  <p class="mt-5 text-center text-muted text-sm">
    Remembered it? <Link href="/login">Back to login</Link>
  </p>
</AuthLayout>
