<script lang="ts">
  import { onMount } from 'svelte';
  import { getApplications, deleteApplication } from '$lib/api';

  let applications = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  let search = $state('');
  let typeFilter = $state('All');

  onMount(async () => {
    try {
      applications = await getApplications();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  const filtered = $derived(applications.filter(a => {
    const matchSearch = !search ||
      a.FullName.toLowerCase().includes(search.toLowerCase()) ||
      a.ApplicationID.toLowerCase().includes(search.toLowerCase()) ||
      a.EmployerBusinessName?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || a.ApplicationType === typeFilter;
    return matchSearch && matchType;
  }));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete application for ${name}? This cannot be undone.`)) return;
    try {
      await deleteApplication(id);
      applications = applications.filter(a => a.ApplicationID !== id);
    } catch (e: any) {
      alert('Failed to delete: ' + e.message);
    }
  }

  function formatPeso(n: number) {
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">Applications</h1>
    <p class="page-subtitle">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
  </div>
  <a href="/applications/new"><button class="btn-primary">+ New Application</button></a>
</div>

<div class="filters card" style="margin-bottom:1.5rem; padding:1rem 1.25rem;">
  <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
    <input
      style="max-width:280px"
      type="search"
      placeholder="Search by name, ID, or employer…"
      bind:value={search}
    />
    <div class="type-btns">
      {#each ['All', 'New', 'Old'] as t}
        <button
          class:active={typeFilter === t}
          on:click={() => typeFilter = t}
        >{t}</button>
      {/each}
    </div>
    {#if filtered.length !== applications.length}
      <span style="font-size:0.8rem; color:var(--text-2)">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
    {/if}
  </div>
</div>

{#if error}
  <div class="error-msg">⚠ {error}</div>
{/if}

<div class="card" style="padding:0; overflow:hidden;">
  {#if loading}
    <div class="loading">Loading…</div>
  {:else if filtered.length === 0}
    <div class="empty-state">
      <h3>{search || typeFilter !== 'All' ? 'No results found' : 'No applications yet'}</h3>
      <p>{search || typeFilter !== 'All' ? 'Try a different search or filter.' : 'Click "New Application" to get started.'}</p>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Term</th>
          <th>Employment</th>
          <th>Date Filed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as app}
          <tr>
            <td><span class="mono" style="font-size:0.78rem; color:var(--text-2)">{app.ApplicationID}</span></td>
            <td>
              <div style="font-weight:500">{app.FullName}</div>
              <div style="font-size:0.78rem; color:var(--text-2)">{app.EmployerBusinessName}</div>
            </td>
            <td><span class="badge {app.ApplicationType === 'New' ? 'badge-new' : 'badge-old'}">{app.ApplicationType}</span></td>
            <td style="font-variant-numeric:tabular-nums; white-space:nowrap">{formatPeso(Number(app.LoanAmount))}</td>
            <td>{app.LoanTerm} yr{Number(app.LoanTerm) !== 1 ? 's' : ''}</td>
            <td>
              <span class="badge badge-regular">{app.EmploymentStatus}</span>
            </td>
            <td style="color:var(--text-2); white-space:nowrap">{formatDate(app.DateApplication)}</td>
            <td>
              <div class="actions">
                <a href="/applications/{app.ApplicationID}">
                  <button class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.6rem">View</button>
                </a>
                <a href="/applications/{app.ApplicationID}/edit">
                  <button class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.6rem">Edit</button>
                </a>
                <button
                  class="btn-danger"
                  style="font-size:0.78rem; padding:0.3rem 0.6rem"
                  on:click={() => handleDelete(app.ApplicationID, app.FullName)}
                >Del</button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .type-btns {
    display: flex;
    gap: 0.25rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.2rem;
  }

  .type-btns button {
    background: transparent;
    color: var(--text-2);
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 4px;
  }

  .type-btns button.active {
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }
</style>
