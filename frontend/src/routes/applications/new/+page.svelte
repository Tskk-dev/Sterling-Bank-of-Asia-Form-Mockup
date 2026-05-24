<script lang="ts">
  import { createApplication } from '$lib/api';
  import { goto } from '$app/navigation';

  let step = $state(1);
  const totalSteps = 4;
  let submitting = $state(false);
  let error = $state('');

  // Step 1: Application basics
  let ApplicationID    = $state('');
  let DateApplication  = $state(new Date().toISOString().split('T')[0]);
  let ApplicationType  = $state('New');
  let LoanAmount       = $state('');
  let LoanTerm         = $state('');

  // Step 2: Personal info
  let FullName         = $state('');
  let BirthDate        = $state('');
  let Citizenship      = $state('Filipino');
  let Gender           = $state('M');
  let TIN              = $state('');
  let SSS_GSIS         = $state('');
  let MobileNo         = $state('');
  let EmailAddress     = $state('');
  let idNumbers        = $state(['']);

  // Step 3: Employment
  let EmployerBusinessName = $state('');
  let EmployerBusinessAdd  = $state('');
  let EmploymentStatus     = $state('Regular');
  let EmploymentYearsStay  = $state('');
  let PositionTitle        = $state('');
  let Country              = $state('Philippines');
  let ZipCode              = $state('');
  let BusinessPhoneNo      = $state('');

  // Employee payroll
  let EmployeeID         = $state('');
  let DateHired          = $state('');
  let DateRegularized    = $state('');
  let BasicIncome        = $state('');
  let FixedAllowances    = $state('');
  let LessDeductions     = $state('');
  let NetPay             = $state('');
  let AveOTCommissions   = $state('');
  let NetTakeHomePay     = $state('');

  // Step 4: References & Dependents
  let references  = $state([{ ReferenceID: '', ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' }]);
  let dependents  = $state([{ DependentID: '', DependentsName: '' }]);

  function addRef()   { references  = [...references,  { ReferenceID: '', ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' }]; }
  function removeRef(i: number) { references  = references.filter((_, idx) => idx !== i); }
  function addDep()   { dependents  = [...dependents,  { DependentID: '', DependentsName: '' }]; }
  function removeDep(i: number) { dependents  = dependents.filter((_, idx) => idx !== i); }
  function addID()    { idNumbers   = [...idNumbers, '']; }
  function removeID(i: number) { idNumbers = idNumbers.filter((_, idx) => idx !== i); }

  function next() { if (step < totalSteps) step++; }
  function prev() { if (step > 1) step--; }

  async function submit() {
    submitting = true;
    error = '';
    try {
      await createApplication({
        application: { ApplicationID, DateApplication, ApplicationType, LoanAmount: Number(LoanAmount), LoanTerm, FullName, BirthDate, Citizenship, Gender, TIN, SSS_GSIS, MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd, EmploymentStatus, EmploymentYearsStay: Number(EmploymentYearsStay), PositionTitle, Country, ZipCode, BusinessPhoneNo },
        idNumbers:  idNumbers.filter(Boolean).map(n => ({ IDNumber: n })),
        employee:   { EmployeeID, DateHired, DateRegularized, BasicIncome: Number(BasicIncome), FixedAllowances: Number(FixedAllowances), LessDeductions: Number(LessDeductions), NetPay: Number(NetPay), AveOTCommissions: Number(AveOTCommissions), NetTakeHomePay: Number(NetTakeHomePay) },
        references: references.filter(r => r.ReferenceFullName),
        dependents: dependents.filter(d => d.DependentsName).map((d, i) => ({ ...d, TotalNoDependents: dependents.filter(x => x.DependentsName).length })),
      });
      goto('/applications');
    } catch (e: any) {
      error = e.message;
      submitting = false;
    }
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">New Application</h1>
    <p class="page-subtitle">Step {step} of {totalSteps}</p>
  </div>
  <a href="/applications"><button class="btn-secondary">Cancel</button></a>
</div>

<!-- Step indicator -->
<div class="step-bar">
  {#each Array(totalSteps) as _, i}
    <div class="step-item" class:done={i + 1 < step} class:active={i + 1 === step}>
      <div class="step-dot">{i + 1 < step ? '✓' : i + 1}</div>
      <div class="step-name">{['Loan Details', 'Personal Info', 'Employment', 'References & Dependents'][i]}</div>
    </div>
    {#if i < totalSteps - 1}<div class="step-line" class:done={i + 1 < step}></div>{/if}
  {/each}
</div>

{#if error}
  <div class="error-msg">⚠ {error}</div>
{/if}

<div class="card form-card">

  <!-- Step 1: Loan Details -->
  {#if step === 1}
    <div class="section-label">Loan Information</div>
    <div class="grid-3">
      <div class="field">
        <label>Application ID</label>
        <input placeholder="e.g. APP-004" bind:value={ApplicationID} />
      </div>
      <div class="field">
        <label>Date Filed</label>
        <input type="date" bind:value={DateApplication} />
      </div>
      <div class="field">
        <label>Application Type</label>
        <select bind:value={ApplicationType}>
          <option value="New">New</option>
          <option value="Old">Old (Renewal)</option>
        </select>
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label>Loan Amount (₱)</label>
        <input type="number" placeholder="50000" bind:value={LoanAmount} />
      </div>
      <div class="field">
        <label>Loan Term (years)</label>
        <input type="number" placeholder="5" bind:value={LoanTerm} />
      </div>
    </div>
  {/if}

  <!-- Step 2: Personal Info -->
  {#if step === 2}
    <div class="section-label">Personal Information</div>
    <div class="grid-2">
      <div class="field">
        <label>Full Name</label>
        <input placeholder="Juan Dela Cruz" bind:value={FullName} />
      </div>
      <div class="field">
        <label>Birth Date</label>
        <input type="date" bind:value={BirthDate} />
      </div>
      <div class="field">
        <label>Citizenship</label>
        <input placeholder="Filipino" bind:value={Citizenship} />
      </div>
      <div class="field">
        <label>Gender</label>
        <select bind:value={Gender}>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <div class="field">
        <label>TIN</label>
        <input placeholder="123456789" bind:value={TIN} />
      </div>
      <div class="field">
        <label>SSS / GSIS Number</label>
        <input placeholder="1234567890" bind:value={SSS_GSIS} />
      </div>
      <div class="field">
        <label>Mobile Number</label>
        <input placeholder="09XXXXXXXXX" bind:value={MobileNo} />
      </div>
      <div class="field">
        <label>Email Address</label>
        <input type="email" placeholder="email@example.com" bind:value={EmailAddress} />
      </div>
    </div>

    <hr class="divider" />
    <div class="section-label">
      ID Numbers
      <button class="add-btn" on:click={addID}>+ Add ID</button>
    </div>
    {#each idNumbers as _, i}
      <div class="dynamic-row">
        <input placeholder="ID Number" bind:value={idNumbers[i]} />
        {#if idNumbers.length > 1}
          <button class="remove-btn" on:click={() => removeID(i)}>✕</button>
        {/if}
      </div>
    {/each}
  {/if}

  <!-- Step 3: Employment -->
  {#if step === 3}
    <div class="section-label">Employment Details</div>
    <div class="grid-2">
      <div class="field">
        <label>Employer / Business Name</label>
        <input placeholder="ABC Company" bind:value={EmployerBusinessName} />
      </div>
      <div class="field">
        <label>Business Phone</label>
        <input placeholder="09XXXXXXXXX" bind:value={BusinessPhoneNo} />
      </div>
    </div>
    <div class="field">
      <label>Employer Address</label>
      <input placeholder="123 Street, City, Province" bind:value={EmployerBusinessAdd} />
    </div>
    <div class="grid-3">
      <div class="field">
        <label>Employment Status</label>
        <select bind:value={EmploymentStatus}>
          <option value="Regular">Regular</option>
          <option value="Contractual">Contractual</option>
          <option value="Probationary">Probationary</option>
          <option value="Self-employed">Self-employed</option>
        </select>
      </div>
      <div class="field">
        <label>Years with Employer</label>
        <input type="number" placeholder="3" bind:value={EmploymentYearsStay} />
      </div>
      <div class="field">
        <label>Position / Title</label>
        <input placeholder="Software Engineer" bind:value={PositionTitle} />
      </div>
      <div class="field">
        <label>Country</label>
        <input placeholder="Philippines" bind:value={Country} />
      </div>
      <div class="field">
        <label>Zip Code</label>
        <input placeholder="1000" bind:value={ZipCode} />
      </div>
    </div>

    <hr class="divider" />
    <div class="section-label">Payroll Information</div>
    <div class="grid-2">
      <div class="field">
        <label>Employee ID</label>
        <input placeholder="EMP-001" bind:value={EmployeeID} />
      </div>
      <div class="field">
        <label>Date Hired</label>
        <input type="date" bind:value={DateHired} />
      </div>
      <div class="field">
        <label>Date Regularized</label>
        <input type="date" bind:value={DateRegularized} />
      </div>
      <div class="field">
        <label>Basic Income (₱)</label>
        <input type="number" placeholder="25000" bind:value={BasicIncome} />
      </div>
      <div class="field">
        <label>Fixed Allowances (₱)</label>
        <input type="number" placeholder="5000" bind:value={FixedAllowances} />
      </div>
      <div class="field">
        <label>Deductions (₱)</label>
        <input type="number" placeholder="3000" bind:value={LessDeductions} />
      </div>
      <div class="field">
        <label>Net Pay (₱)</label>
        <input type="number" placeholder="27000" bind:value={NetPay} />
      </div>
      <div class="field">
        <label>Avg OT / Commissions (₱)</label>
        <input type="number" placeholder="2000" bind:value={AveOTCommissions} />
      </div>
      <div class="field">
        <label>Net Take-Home Pay (₱)</label>
        <input type="number" placeholder="29000" bind:value={NetTakeHomePay} />
      </div>
    </div>
  {/if}

  <!-- Step 4: References & Dependents -->
  {#if step === 4}
    <div class="section-label">
      Character References
      <button class="add-btn" on:click={addRef}>+ Add Reference</button>
    </div>
    {#each references as ref, i}
      <div class="sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-2)">Reference {i + 1}</span>
          {#if references.length > 1}
            <button class="remove-btn" on:click={() => removeRef(i)}>Remove</button>
          {/if}
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Reference ID</label>
            <input placeholder="REF001-1" bind:value={ref.ReferenceID} />
          </div>
          <div class="field">
            <label>Full Name</label>
            <input placeholder="Name" bind:value={ref.ReferenceFullName} />
          </div>
          <div class="field">
            <label>Relationship</label>
            <input placeholder="Boss / Colleague / Friend" bind:value={ref.ReferencesRS} />
          </div>
          <div class="field">
            <label>Phone</label>
            <input placeholder="09XXXXXXXXX" bind:value={ref.ReferencePhoneNo} />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" placeholder="ref@email.com" bind:value={ref.ReferenceEmail} />
          </div>
        </div>
      </div>
    {/each}

    <hr class="divider" />
    <div class="section-label">
      Dependents
      <button class="add-btn" on:click={addDep}>+ Add Dependent</button>
    </div>
    {#each dependents as dep, i}
      <div class="sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-2)">Dependent {i + 1}</span>
          {#if dependents.length > 1}
            <button class="remove-btn" on:click={() => removeDep(i)}>Remove</button>
          {/if}
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Dependent ID</label>
            <input placeholder="DEP001-1" bind:value={dep.DependentID} />
          </div>
          <div class="field">
            <label>Full Name</label>
            <input placeholder="Name" bind:value={dep.DependentsName} />
          </div>
        </div>
      </div>
    {/each}
  {/if}

  <!-- Nav buttons -->
  <div class="form-nav">
    {#if step > 1}
      <button class="btn-secondary" on:click={prev}>← Back</button>
    {:else}
      <div></div>
    {/if}
    {#if step < totalSteps}
      <button class="btn-primary" on:click={next}>Next →</button>
    {:else}
      <button class="btn-primary" on:click={submit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    {/if}
  </div>
</div>

<style>
  .form-card { max-width: 860px; }

  .step-bar {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    gap: 0;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid var(--border-strong);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-3);
    flex-shrink: 0;
  }

  .step-item.active .step-dot {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .step-item.done .step-dot {
    background: var(--success-bg);
    border-color: var(--success);
    color: var(--success);
  }

  .step-name {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-3);
    white-space: nowrap;
  }

  .step-item.active .step-name { color: var(--text); }
  .step-item.done  .step-name  { color: var(--text-2); }

  .step-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin: 0 0.75rem;
    min-width: 20px;
  }

  .step-line.done { background: var(--success); }

  .form-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
  }

  .sub-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
  }

  .dynamic-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .add-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0 0.25rem;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  .remove-btn {
    background: var(--danger-bg);
    color: var(--danger);
    border: 1px solid #fca5a5;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }
</style>
