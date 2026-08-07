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
  <h1>Choose a new password</h1>
  <p class="auth-sub">Set a new password for <strong>{email}</strong>.</p>

  <form onsubmit={submit} novalidate>
    <Field id="password" label="New password" error={form.errors.password}>
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
        bind:value={form.passwordConfirmation}
        onchange={() => form.clearErrors('passwordConfirmation')}
      />
    </Field>

    {#if form.errors.token}
      <p class="field-error" role="alert">{form.errors.token}</p>
    {/if}

    <button
      class="btn btn-primary btn-block"
      type="submit"
      disabled={form.processing}
    >
      {form.processing ? 'Saving…' : 'Save new password'}
    </button>
  </form>

  <p class="auth-alt">
    <Link href="/login">Back to login</Link>
  </p>
</AuthLayout>
