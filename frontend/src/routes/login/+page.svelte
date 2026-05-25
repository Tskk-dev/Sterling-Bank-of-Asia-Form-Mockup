<script lang="ts">
  import { auth } from '$lib/auth';
  import { loginUser } from '$lib/api';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let selectedRole = $state<'admin' | 'user'>('user');
  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  onMount(() => {
    auth.init();
    if (get(auth.isLoggedIn)) goto('/');
  });

  async function handleLogin() {
    if (!username || !password) { error = 'Please enter your username and password.'; return; }
    loading = true;
    error = '';
    try {
      const data = await loginUser(username, password);
      if (data.role !== selectedRole) {
        error = `This account is not a${selectedRole === 'admin' ? 'n admin' : ' user'}. Please select the correct role.`;
        loading = false;
        return;
      }
      auth.login(data);
      goto('/');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }
</script>

<div class="login-bg">
  <div class="login-content">
    <div class="login-card">

    <!-- Brand -->
    <div class="brand">
      <img src="/logo1.png" alt="Sterling Bank of Asia" class="brand-img" />
    </div>

    <hr class="divider" />

    <!-- Role selector -->
    <div class="role-label">Login as</div>
    <div class="role-toggle">
      <button
        class="role-btn"
        class:active={selectedRole === 'user'}
        onclick={() => { selectedRole = 'user'; username = ''; password = ''; error = ''; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        User
      </button>
      <button
        class="role-btn"
        class:active={selectedRole === 'admin'}
        onclick={() => { selectedRole = 'admin'; username = ''; password = ''; error = ''; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Admin
      </button>
    </div>

    <!-- Hint -->
    <div class="hint">
      {#if selectedRole === 'user'}
        <span>Users can view and submit their own loan application.</span>
      {:else}
        <span>Admins have full access to all applications and data.</span>
      {/if}
    </div>

    <!-- Form -->
    <div class="field" style="margin-top: 1.5rem;">
      <label for="username">Username</label>
      <input
        id="username"
        placeholder={selectedRole === 'admin' ? 'admin' : 'e.g. ryanlang'}
        bind:value={username}
        onkeydown={handleKey}
        autocomplete="username"
      />
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        placeholder="••••••••"
        bind:value={password}
        onkeydown={handleKey}
        autocomplete="current-password"
      />
    </div>

    {#if error}
      <div class="error-msg">{error}</div>
    {/if}

    <button class="btn-primary submit-btn" onclick={handleLogin} disabled={loading}>
      {loading ? 'Logging in…' : `Login as ${selectedRole === 'admin' ? 'Admin' : 'User'}`}
    </button>

    <!-- Sample credentials hint -->
    <div class="creds-hint">
      {#if selectedRole === 'user'}
        Sample accounts: <strong>ryanlang</strong> / ryan123 &nbsp;·&nbsp; <strong>marklee</strong> / mark123
      {:else}
        Sample account: <strong>admin</strong> / admin123
      {/if}
    </div>

    </div>
  </div>

  <div class="disclaimer">
    This app is not officially affiliated with Sterling Bank of Asia and is only a mockup for educational purposes.
  </div>
</div>

<style>
  .login-bg {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    padding: 2rem;
  }

  .login-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-md);
  }

  .brand {
    display: flex;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .brand-img {
    width: 100%;
    max-width: 200px;
    height: auto;
    object-fit: contain;
  }

  .role-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-3);
    margin-bottom: 0.5rem;
  }

  .role-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .role-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem;
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .role-btn:hover { border-color: var(--border-strong); color: var(--text); }

  .role-btn.active {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent);
  }

  .hint {
    font-size: 0.78rem;
    color: var(--text-2);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
  }

  .submit-btn {
    width: 100%;
    padding: 0.7rem;
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }

  .creds-hint {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: var(--text-3);
    text-align: center;
    line-height: 1.6;
  }

  .disclaimer {
    margin-top: 1.5rem;
    padding: 0 1rem 0.75rem;
    text-align: center;
    font-size: 0.72rem;
    color: var(--text-3);
  }
</style>
