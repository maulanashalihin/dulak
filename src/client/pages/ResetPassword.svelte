<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte'
  import AuthLayout from '../components/AuthLayout.svelte'
  import Field from '../components/Field.svelte'

  let { email, token }: { email: string; token: string } = $props()

  const form = useForm({
    email: email,
    token: token,
    password: '',
    passwordConfirmation: '',
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    form.post('/reset-password')
  }
</script>

<svelte:head><title>Reset password</title></svelte:head>

<AuthLayout>
  <h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Choose a new password</h1>
  <p class="text-muted mb-5">
    Set a new password for <strong>{email}</strong>.
  </p>

  <form onsubmit={submit} novalidate>
    <Field id="password" label="New password" error={form.errors.password}>
      <input
        id="password"
        type="password"
        name="password"
        autocomplete="new-password"
        class="w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary"
        bind:value={form.password}
        onchange={() => form.clearErrors('password')}
      />
      <p class="text-xs text-muted mt-1">At least 8 characters.</p>
    </Field>

    <Field
      id="passwordConfirmation"
      label="Confirm password"
      error={form.errors.passwordConfirmation}
    >
      <input
        id="passwordConfirmation"
        type="password"
        name="passwordConfirmation"
        autocomplete="new-password"
        class="w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary"
        bind:value={form.passwordConfirmation}
        onchange={() => form.clearErrors('passwordConfirmation')}
      />
    </Field>

    {#if form.errors.token}
      <p class="text-danger text-xs mb-4" role="alert">
        {form.errors.token}
      </p>
    {/if}

    <button
      class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Saving…' : 'Save new password'}
    </button>
  </form>

  <p class="mt-5 text-center text-muted text-sm">
    <Link href="/login">Back to login</Link>
  </p>
</AuthLayout>
