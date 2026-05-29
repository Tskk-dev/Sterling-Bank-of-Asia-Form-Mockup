<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { getApplication, deleteApplication } from '$lib/api';
  import { auth } from '$lib/auth';
  import { goto } from '$app/navigation';

  const id = page.params.id!;
  let app = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    auth.init();
    if (!get(auth.isLoggedIn)) { goto('/login'); return; }
    if (!get(auth.isAdmin))    { goto('/my-application'); return; }
    try {
      app = await getApplication(id);
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  async function handleDelete() {
    if (!confirm(`Delete application ${id}? This cannot be undone.`)) return;
    try {
      await deleteApplication(id);
      goto('/applications');
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  }

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
  <div style="display:flex; align-items:center; gap:0.75rem;">
    <a href="/applications" style="color:var(--text-3); text-decoration:none; font-size:0.875rem">← Back</a>
    <span style="color:var(--border)">|</span>
    <span class="mono" style="font-size:0.875rem; color:var(--text-2)">{id}</span>
  </div>
  {#if app}
    <div class="actions">
      <a href="/applications/{id}/edit"><button class="btn-secondary">Edit</button></a>
      <button class="btn-danger" onclick={handleDelete}>Delete</button>
    </div>
  {/if}
</div>

{#if error}
  <div class="error-msg">⚠ {error}</div>
{:else if loading}
  <div class="loading">Loading application…</div>
{:else if app}

<!-- Header card -->
<div class="card" style="margin-bottom:1.25rem; display:flex; align-items:center; gap:1.25rem;">
  <div class="avatar">{initials(app.FullName)}</div>
  <div>
    <h1 class="page-title" style="margin-bottom:0.2rem">{app.FullName}</h1>
    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
      <span class="badge {app.ApplicationType === 'New' ? 'badge-new' : 'badge-old'}">{app.ApplicationType}</span>
      <span style="font-size:0.8rem; color:var(--text-2)">{app.PositionTitle} · {app.EmployerBusinessName}</span>
    </div>
  </div>
  <div style="margin-left:auto; text-align:right;">
    <div style="font-size:0.72rem; color:var(--text-3); text-transform:uppercase; letter-spacing:0.07em">Loan Amount</div>
    <div style="font-size:1.75rem; font-weight:600; letter-spacing:-0.02em">{formatPeso(app.LoanAmount)}</div>
    <div style="font-size:0.8rem; color:var(--text-2)">{app.LoanTerm} year term</div>
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
        {#each app.idNumbers as id}
          <span class="mono" style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.25rem 0.6rem; font-size:0.82rem">{id.IDNumber}</span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Employment Info -->
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
      <div class="info-row"><span>Date Filed</span><span>{formatDate(app.DateApplication)}</span></div>
    </div>
  </div>
</div>

<!-- Employee Payroll -->
{#if app.employee}
<div class="card" style="margin-top:1.25rem;">
  <div class="section-label">Payroll & Income — Employee ID: <span class="mono">{app.employee.EmployeeID}</span></div>
  <div class="pay-grid">
    <div class="pay-card">
      <div class="pay-label">Basic Income</div>
      <div class="pay-val">{formatPeso(app.employee.BasicIncome)}</div>
    </div>
    <div class="pay-card">
      <div class="pay-label">Fixed Allowances</div>
      <div class="pay-val">{formatPeso(app.employee.FixedAllowances)}</div>
    </div>
    <div class="pay-card">
      <div class="pay-label">Deductions</div>
      <div class="pay-val" style="color:var(--danger)">−{formatPeso(app.employee.LessDeductions)}</div>
    </div>
    <div class="pay-card">
      <div class="pay-label">Net Pay</div>
      <div class="pay-val">{formatPeso(app.employee.NetPay)}</div>
    </div>
    <div class="pay-card">
      <div class="pay-label">Avg OT / Commissions</div>
      <div class="pay-val">{formatPeso(app.employee.AveOTCommissions)}</div>
    </div>
    <div class="pay-card highlight">
      <div class="pay-label">Net Take-Home Pay</div>
      <div class="pay-val">{formatPeso(app.employee.NetTakeHomePay)}</div>
    </div>
  </div>
  <div style="margin-top:1rem; display:flex; gap:2rem; font-size:0.82rem; color:var(--text-2);">
    <span>Date Hired: <strong style="color:var(--text)">{formatDate(app.employee.DateHired)}</strong></span>
    <span>Regularized: <strong style="color:var(--text)">{formatDate(app.employee.DateRegularized)}</strong></span>
  </div>
</div>
{/if}

<div class="two-col" style="margin-top:1.25rem;">
  <!-- References -->
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

  <!-- Dependents -->
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
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }
  @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-bg);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .avatar-sm {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent-bg);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.72rem;
    flex-shrink: 0;
  }

  .info-grid { display: flex; flex-direction: column; gap: 0; }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.875rem;
    gap: 1rem;
  }
  .info-row:last-child { border-bottom: none; }
  .info-row > span:first-child { color: var(--text-2); flex-shrink: 0; }
  .info-row > span:last-child  { text-align: right; word-break: break-all; }

  .pay-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  @media (max-width: 700px) { .pay-grid { grid-template-columns: 1fr 1fr; } }

  .pay-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.85rem 1rem;
  }
  .pay-card.highlight {
    background: var(--accent-bg);
    border-color: var(--accent-border);
  }

  .pay-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin-bottom: 0.35rem;
  }
  .pay-val {
    font-size: 1.1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }

  .ref-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .ref-row:last-child { border-bottom: none; }
</style>
