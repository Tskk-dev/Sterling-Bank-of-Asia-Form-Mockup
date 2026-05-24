<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth';
  import { getApplication } from '$lib/api';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  let app = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    auth.init();
    if (!get(auth.isLoggedIn)) { goto('/login'); return; }
    if (get(auth.isAdmin))     { goto('/');      return; }

    const appID = get(auth.user)?.applicationID;
    if (!appID) {
      error = 'No application linked to your account yet. You can submit a new one below.';
      loading = false;
      return;
    }
    try {
      app = await getApplication(appID);
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function formatPeso(n: number) {
    return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function initials(name: string) {
    return name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">My Application</h1>
    <p class="page-subtitle">Your loan application details</p>
  </div>
</div>

{#if loading}
  <div class="loading">Loading your application…</div>

{:else if error}
  <div class="card" style="text-align:center; padding:3rem 2rem;">
    <div style="font-size:2rem; margin-bottom:1rem;">📋</div>
    <h3 style="font-weight:600; margin-bottom:0.5rem;">No Application Found</h3>
    <p style="color:var(--text-2); font-size:0.875rem; margin-bottom:1.5rem;">{error}</p>
    <a href="/applications/new"><button class="btn-primary">Submit New Application</button></a>
  </div>

{:else if app}
  <!-- Header card -->
  <div class="card" style="margin-bottom:1.25rem; display:flex; align-items:center; gap:1.25rem; flex-wrap:wrap;">
    <div class="avatar">{initials(app.FullName)}</div>
    <div>
      <h2 style="font-size:1.25rem; font-weight:600; letter-spacing:-0.01em">{app.FullName}</h2>
      <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; margin-top:0.25rem;">
        <span class="badge {app.ApplicationType === 'New' ? 'badge-new' : 'badge-old'}">{app.ApplicationType}</span>
        <span style="font-size:0.8rem; color:var(--text-2)">{app.PositionTitle} · {app.EmployerBusinessName}</span>
      </div>
    </div>
    <div style="margin-left:auto; text-align:right;">
      <div style="font-size:0.72rem; color:var(--text-3); text-transform:uppercase; letter-spacing:0.07em">Loan Amount</div>
      <div style="font-size:1.75rem; font-weight:600; letter-spacing:-0.02em">{formatPeso(app.LoanAmount)}</div>
      <div style="font-size:0.8rem; color:var(--text-2)">{app.LoanTerm} year term · Filed {formatDate(app.DateApplication)}</div>
    </div>
  </div>

  <div class="two-col">
    <!-- Personal Info -->
    <div class="card">
      <div class="section-label">Personal Information</div>
      <div class="info-grid">
        <div class="info-row"><span>Full Name</span><span>{app.FullName}</span></div>
        <div class="info-row"><span>Birth Date</span><span>{formatDate(app.BirthDate)}</span></div>
        <div class="info-row"><span>Age</span><span>{app.Age ?? '—'}</span></div>
        <div class="info-row"><span>Gender</span><span>{app.Gender === 'M' ? 'Male' : 'Female'}</span></div>
        <div class="info-row"><span>Citizenship</span><span>{app.Citizenship}</span></div>
        <div class="info-row"><span>TIN</span><span class="mono">{app.TIN}</span></div>
        <div class="info-row"><span>SSS / GSIS</span><span class="mono">{app.SSS_GSIS}</span></div>
        <div class="info-row"><span>Mobile</span><span>{app.MobileNo}</span></div>
        <div class="info-row"><span>Email</span><span style="color:var(--accent)">{app.EmailAddress}</span></div>
      </div>

      {#if app.idNumbers?.length}
        <hr class="divider" />
        <div class="section-label">ID Numbers</div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          {#each app.idNumbers as idNum}
            <span class="mono" style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.25rem 0.6rem; font-size:0.82rem">{idNum.IDNumber}</span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Employment -->
    <div class="card">
      <div class="section-label">Employment</div>
      <div class="info-grid">
        <div class="info-row"><span>Employer</span><span>{app.EmployerBusinessName}</span></div>
        <div class="info-row"><span>Address</span><span>{app.EmployerBusinessAdd}</span></div>
        <div class="info-row"><span>Status</span><span><span class="badge badge-regular">{app.EmploymentStatus}</span></span></div>
        <div class="info-row"><span>Years</span><span>{app.EmploymentYearsStay} yr{app.EmploymentYearsStay !== 1 ? 's' : ''}</span></div>
        <div class="info-row"><span>Position</span><span>{app.PositionTitle}</span></div>
        <div class="info-row"><span>Country</span><span>{app.Country}</span></div>
        <div class="info-row"><span>Zip Code</span><span class="mono">{app.ZipCode}</span></div>
        <div class="info-row"><span>Business Phone</span><span>{app.BusinessPhoneNo}</span></div>
      </div>
    </div>
  </div>

  <!-- Payroll -->
  {#if app.employee}
  <div class="card" style="margin-top:1.25rem;">
    <div class="section-label">Payroll & Income</div>
    <div class="pay-grid">
      <div class="pay-card"><div class="pay-label">Basic Income</div><div class="pay-val">{formatPeso(app.employee.BasicIncome)}</div></div>
      <div class="pay-card"><div class="pay-label">Fixed Allowances</div><div class="pay-val">{formatPeso(app.employee.FixedAllowances)}</div></div>
      <div class="pay-card"><div class="pay-label">Deductions</div><div class="pay-val" style="color:var(--danger)">−{formatPeso(app.employee.LessDeductions)}</div></div>
      <div class="pay-card"><div class="pay-label">Net Pay</div><div class="pay-val">{formatPeso(app.employee.NetPay)}</div></div>
      <div class="pay-card"><div class="pay-label">Avg OT / Commissions</div><div class="pay-val">{formatPeso(app.employee.AveOTCommissions)}</div></div>
      <div class="pay-card highlight"><div class="pay-label">Net Take-Home Pay</div><div class="pay-val">{formatPeso(app.employee.NetTakeHomePay)}</div></div>
    </div>
    <div style="margin-top:1rem; display:flex; gap:2rem; font-size:0.82rem; color:var(--text-2);">
      <span>Date Hired: <strong style="color:var(--text)">{formatDate(app.employee.DateHired)}</strong></span>
      <span>Regularized: <strong style="color:var(--text)">{formatDate(app.employee.DateRegularized)}</strong></span>
    </div>
  </div>
  {/if}

  <div class="two-col" style="margin-top:1.25rem;">
    {#if app.references?.length}
    <div class="card">
      <div class="section-label">References ({app.references.length})</div>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        {#each app.references as ref}
          <div class="ref-row">
            <div class="avatar-sm">{initials(ref.ReferenceFullName)}</div>
            <div>
              <div style="font-weight:500; font-size:0.9rem">{ref.ReferenceFullName}</div>
              <div style="font-size:0.78rem; color:var(--text-2)">{ref.ReferencesRS} · {ref.ReferencePhoneNo}</div>
              <div style="font-size:0.78rem; color:var(--accent)">{ref.ReferenceEmail}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    {/if}

    {#if app.dependents?.length}
    <div class="card">
      <div class="section-label">Dependents ({app.dependents.length})</div>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        {#each app.dependents as dep}
          <div class="ref-row">
            <div class="avatar-sm" style="background:var(--success-bg); color:var(--success)">{initials(dep.DependentsName)}</div>
            <div>
              <div style="font-weight:500; font-size:0.9rem">{dep.DependentsName}</div>
              <div style="font-size:0.78rem; color:var(--text-2)">Dependent ID: <span class="mono">{dep.DependentID}</span></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    {/if}
  </div>
{/if}

<style>
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

  .avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--accent-bg); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 1.1rem; flex-shrink: 0;
  }

  .avatar-sm {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--accent-bg); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 0.72rem; flex-shrink: 0;
  }

  .info-grid { display: flex; flex-direction: column; }
  .info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.5rem 0; border-bottom: 1px solid var(--border);
    font-size: 0.875rem; gap: 1rem;
  }
  .info-row:last-child { border-bottom: none; }
  .info-row > span:first-child { color: var(--text-2); flex-shrink: 0; }
  .info-row > span:last-child  { text-align: right; word-break: break-all; }

  .pay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
  @media (max-width: 700px) { .pay-grid { grid-template-columns: 1fr 1fr; } }

  .pay-card {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 0.85rem 1rem;
  }
  .pay-card.highlight { background: var(--accent-bg); border-color: var(--accent-border); }
  .pay-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); margin-bottom: 0.35rem; }
  .pay-val   { font-size: 1.1rem; font-weight: 600; font-variant-numeric: tabular-nums; }

  .ref-row {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.5rem 0; border-bottom: 1px solid var(--border);
  }
  .ref-row:last-child { border-bottom: none; }
</style>
