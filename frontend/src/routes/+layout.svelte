<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { auth } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const user = auth.user;
  const isLoggedIn = auth.isLoggedIn;
  const isAdmin = auth.isAdmin;

  onMount(() => {
    auth.init();
  });

  function logout() {
    auth.logout();
    window.location.href = '/login';
  }
</script>

{#if page.url.pathname === '/login'}
  {@render children()}
{:else if $isLoggedIn}
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="/logo1.png" alt="Sterling Bank of Asia" class="brand-img" />
    </div>

    <nav class="sidebar-nav">
      {#if $isAdmin}
        <a href="/" class:active={page.url.pathname === '/'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <a href="/applications" class:active={page.url.pathname === '/applications'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          All Applications
        </a>
        <a href="/applications/new" class:active={page.url.pathname === '/applications/new'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          New Application
        </a>
      {:else}
        <a href="/my-application" class:active={page.url.pathname.startsWith('/my-application')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          My Application
        </a>
        <a href="/applications/new" class:active={page.url.pathname === '/applications/new'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          New Application
        </a>
      {/if}
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{$user?.username?.[0]?.toUpperCase()}</div>
        <div>
          <div class="user-name">{$user?.username}</div>
          <div class="user-role">{$user?.role}</div>
        </div>
      </div>
      <button class="logout-btn" onclick={logout}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </div>
  </aside>

  <main class="main">
    {@render children()}
  </main>
</div>
{:else}
  {@render children()}
{/if}

<style>
  .layout { display: flex; min-height: 100vh; }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .sidebar-brand {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-img {
    width: 100%;
    max-width: 160px;
    height: auto;
    object-fit: contain;
  }

  .sidebar-nav {
    padding: 1rem 0.75rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .sidebar-nav a {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-sm);
    color: var(--text-2); font-size: 0.875rem; font-weight: 500;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
  }
  .sidebar-nav a:hover  { background: var(--bg); color: var(--text); }
  .sidebar-nav a.active { background: var(--accent-bg); color: var(--accent); }

  .sidebar-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-info {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.4rem 0.25rem;
  }

  .user-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--accent-bg); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
  }

  .user-name { font-size: 0.82rem; font-weight: 600; color: var(--text); }
  .user-role {
    font-size: 0.68rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent);
  }

  .logout-btn {
    display: flex; align-items: center; gap: 0.4rem;
    width: 100%; padding: 0.45rem 0.75rem;
    background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-2); font-size: 0.78rem;
    cursor: pointer; transition: all 0.12s;
  }
  .logout-btn:hover { background: var(--danger-bg); color: var(--danger); border-color: #fca5a5; }

  .main {
    flex: 1;
    padding: 2rem 2.5rem;
    max-width: calc(100vw - 240px);
    overflow-x: hidden;
  }
</style>
