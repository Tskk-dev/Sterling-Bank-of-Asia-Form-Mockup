<script lang="ts">
  import { onMount } from 'svelte';
  import { getApplications } from '$lib/api';
  import { auth } from '$lib/auth';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';

  let applications = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    auth.init();
    if (!get(auth.isLoggedIn)) { goto('/login'); return; }
    if (!get(auth.isAdmin))    { goto('/my-application'); return; }

    try {
      applications = await getApplications();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  const totalLoan = $derived(applications.reduce((s, a) => s + Number(a.LoanAmount), 0));
  const newApps   = $derived(applications.filter(a => a.ApplicationType === 'New').length);
  const oldApps   = $derived(applications.filter(a => a.ApplicationType === 'Old').length);

  function formatPeso(n: number) {
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Overview of all loan applications</p>
  </div>
  <a href="/applications/new"><button class="btn-primary">+ New Application</button></a>
</div>

{#if error}
  <div class="error-msg">⚠ Could not connect to backend: {error}</div>
{/if}

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">Total Applications</div>
    <div class="stat-value">{applications.length}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Total Loan Value</div>
    <div class="stat-value">{formatPeso(totalLoan)}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">New Applications</div>
    <div class="stat-value">{newApps}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Renewals</div>
    <div class="stat-value">{oldApps}</div>
  </div>
</div>

<div class="card" style="margin-top: 2rem;">
  <div class="section-label">Recent Applications</div>
  {#if loading}
    <div class="loading">Loading applications…</div>
  {:else if applications.length === 0}
    <div class="empty-state">
      <h3>No applications yet</h3>
      <p>Start by creating a new loan application.</p>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Application ID</th>
          <th>Applicant</th>
          <th>Type</th>
          <th>Loan Amount</th>
          <th>Term</th>
          <th>Date Filed</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each applications as app}
          <tr>
            <td><span class="mono" style="font-size:0.8rem;color:var(--text-2)">{app.ApplicationID}</span></td>
            <td><strong style="font-weight:500">{app.FullName}</strong></td>
            <td><span class="badge {app.ApplicationType === 'New' ? 'badge-new' : 'badge-old'}">{app.ApplicationType}</span></td>
            <td style="font-variant-numeric:tabular-nums">{formatPeso(Number(app.LoanAmount))}</td>
            <td>{app.LoanTerm} yr{Number(app.LoanTerm) !== 1 ? 's' : ''}</td>
            <td style="color:var(--text-2)">{formatDate(app.DateApplication)}</td>
            <td><a href="/applications/{app.ApplicationID}"><button class="btn-secondary" style="font-size:0.8rem;padding:0.3rem 0.75rem">View →</button></a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow);
  }

  .stat-label {
    font-size: 0.72rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--text-3); margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.75rem; font-weight: 600;
    letter-spacing: -0.02em; color: var(--text);
  }
</style>
