<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { getApplication, updateApplication } from '$lib/api';
  import { auth } from '$lib/auth';
  import { goto } from '$app/navigation';

  const id = page.params.id!;
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let step = $state(1);
  const totalSteps = 4;
  const minReferences = 3;

  // Step 1
  let DateApplication = $state('');
  let ApplicationType = $state('New');
  let LoanAmount = $state('');
  let LoanTerm = $state('');

  // Step 2
  let FullName = $state('');
  let BirthDate = $state('');
  const Age = $derived(BirthDate ? calcAge(BirthDate) : null);
  let Citizenship = $state('');
  let Gender = $state('M');
  let TIN = $state('');
  let SSS_GSIS = $state('');
  let MobileNo = $state('');
  let EmailAddress = $state('');
  let idNumbers = $state<string[]>(['']);

  // Step 3
  let EmployerBusinessName = $state('');
  let EmployerBusinessAdd = $state('');
  let EmploymentStatus = $state('Regular');
  let EmploymentYearsStay = $state('');
  let PositionTitle = $state('');
  let Country = $state('');
  let ZipCode = $state('');
  let BusinessPhoneNo = $state('');
  let EmployeeID = $state('');
  let DateHired = $state('');
  let DateRegularized = $state('');
  let BasicIncome = $state('');
  let FixedAllowances = $state('');
  let LessDeductions = $state('');
  let NetPay = $state('');
  let AveOTCommissions = $state('');
  let NetTakeHomePay = $state('');

  // Step 4
  let references = $state<any[]>([]);
  let dependents = $state<any[]>([]);

  function calcAge(isoDate: string) {
    const birth = new Date(isoDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function isBlank(value: any) {
    return value === undefined || value === null || String(value).trim() === '';
  }

  function isPositiveNumber(value: any) {
    return !Number.isNaN(Number(value)) && Number(value) > 0;
  }

  function ensureMinReferences(list: any[]) {
    if (list.length >= minReferences) return list;
    const missing = minReferences - list.length;
    return [...list, ...Array.from({ length: missing }, () => ({ ReferenceID: '', ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' }))];
  }

  onMount(async () => {
    auth.init();
    if (!get(auth.isLoggedIn)) { goto('/login'); return; }
    if (!get(auth.isAdmin))    { goto('/my-application'); return; }
    try {
      const app = await getApplication(id);
      // Populate step 1
      DateApplication  = app.DateApplication?.split('T')[0] ?? '';
      ApplicationType  = app.ApplicationType;
      LoanAmount       = app.LoanAmount;
      LoanTerm         = app.LoanTerm;
      // Populate step 2
      FullName         = app.FullName;
      BirthDate        = app.BirthDate?.split('T')[0] ?? '';
      Citizenship      = app.Citizenship;
      Gender           = app.Gender;
      TIN              = app.TIN;
      SSS_GSIS         = app.SSS_GSIS;
      MobileNo         = app.MobileNo;
      EmailAddress     = app.EmailAddress;
      idNumbers        = app.idNumbers?.length ? app.idNumbers.map((i: any) => i.IDNumber) : [''];
      // Populate step 3
      EmployerBusinessName = app.EmployerBusinessName;
      EmployerBusinessAdd  = app.EmployerBusinessAdd;
      EmploymentStatus     = app.EmploymentStatus;
      EmploymentYearsStay  = app.EmploymentYearsStay;
      PositionTitle        = app.PositionTitle;
      Country              = app.Country;
      ZipCode              = app.ZipCode;
      BusinessPhoneNo      = app.BusinessPhoneNo;
      if (app.employee) {
        EmployeeID       = app.employee.EmployeeID;
        DateHired        = app.employee.DateHired?.split('T')[0] ?? '';
        DateRegularized  = app.employee.DateRegularized?.split('T')[0] ?? '';
        BasicIncome      = app.employee.BasicIncome;
        FixedAllowances  = app.employee.FixedAllowances;
        LessDeductions   = app.employee.LessDeductions;
        NetPay           = app.employee.NetPay;
        AveOTCommissions = app.employee.AveOTCommissions;
        NetTakeHomePay   = app.employee.NetTakeHomePay;
      }
      // Populate step 4
      references = ensureMinReferences(app.references?.length ? app.references : []);
      dependents = app.dependents?.length ? app.dependents : [{ DependentID: '', DependentsName: '' }];
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function next() { if (step < totalSteps) step++; }
  function prev() { if (step > 1) step--; }

  function addRef()            { references = [...references, { ReferenceID: '', ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' }]; }
  function removeRef(i: number){ if (references.length > minReferences) references = references.filter((_, idx) => idx !== i); }
  function addDep()            { dependents = [...dependents, { DependentID: '', DependentsName: '' }]; }
  function removeDep(i: number){ dependents = dependents.filter((_, idx) => idx !== i); }
  function addID()             { idNumbers  = [...idNumbers, '']; }
  function removeID(i: number) { idNumbers  = idNumbers.filter((_, idx) => idx !== i); }

  async function submit() {
    submitting = true;
    error = '';
    try {
      const requiredFields = [
        DateApplication, ApplicationType, LoanAmount, LoanTerm,
        FullName, BirthDate, Citizenship, Gender, TIN, SSS_GSIS,
        MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd,
        EmploymentStatus, EmploymentYearsStay, PositionTitle, Country,
        ZipCode, BusinessPhoneNo, EmployeeID, DateHired, DateRegularized,
        BasicIncome, FixedAllowances, LessDeductions, NetPay, AveOTCommissions,
        NetTakeHomePay,
      ];
      if (requiredFields.some(isBlank)) {
        error = 'Please complete all required fields before saving.';
        submitting = false;
        return;
      }
      if (!isPositiveNumber(LoanAmount) || !isPositiveNumber(LoanTerm) || !isPositiveNumber(EmploymentYearsStay)) {
        error = 'Loan amount, loan term, and years with employer must be valid numbers.';
        submitting = false;
        return;
      }
      if (!references.length || references.length < minReferences) {
        error = `Please provide at least ${minReferences} complete references.`;
        submitting = false;
        return;
      }
      await updateApplication(id, {
        application: { DateApplication, ApplicationType, LoanAmount: Number(LoanAmount), LoanTerm, FullName, BirthDate, Age: Age ?? null, Citizenship, Gender, TIN, SSS_GSIS, MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd, EmploymentStatus, EmploymentYearsStay: Number(EmploymentYearsStay), PositionTitle, Country, ZipCode, BusinessPhoneNo },
        idNumbers:   idNumbers.filter(Boolean).map(n => ({ IDNumber: n })),
        employee:    { EmployeeID, DateHired, DateRegularized, BasicIncome: Number(BasicIncome), FixedAllowances: Number(FixedAllowances), LessDeductions: Number(LessDeductions), NetPay: Number(NetPay), AveOTCommissions: Number(AveOTCommissions), NetTakeHomePay: Number(NetTakeHomePay) },
        references:  references.filter(r => r.ReferenceFullName && r.ReferencesRS && r.ReferencePhoneNo && r.ReferenceEmail),
        dependents:  dependents.filter(d => d.DependentsName).map(d => ({ ...d, TotalNoDependents: dependents.filter(x => x.DependentsName).length })),
      });
      goto(`/applications/${id}`);
    } catch (e: any) {
      error = e.message;
      submitting = false;
    }
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">Edit Application</h1>
    <p class="page-subtitle mono">{id} · Step {step} of {totalSteps}</p>
  </div>
  <a href="/applications/{id}"><button class="btn-secondary">Cancel</button></a>
</div>

<!-- Step indicator -->
<div class="step-bar">
  {#each Array(totalSteps) as _, i}
    <div class="step-item" class:done={i + 1 < step} class:active={i + 1 === step}>
      <div class="step-dot">{i + 1 < step ? '✓' : i + 1}</div>
      <div class="step-name">{['Loan Details', 'Personal Info', 'Employment', 'Refs & Dependents'][i]}</div>
    </div>
    {#if i < totalSteps - 1}<div class="step-line" class:done={i + 1 < step}></div>{/if}
  {/each}
</div>

{#if error}<div class="error-msg">⚠ {error}</div>{/if}

{#if loading}
  <div class="loading">Loading application data…</div>
{:else}
<div class="card form-card">

  <!-- Step 1 -->
  {#if step === 1}
    <div class="section-label">Loan Information</div>
    <div class="grid-3">
      <div class="field">
        <label>Date Filed</label>
        <input type="date" bind:value={DateApplication} required />
      </div>
      <div class="field">
        <label>Application Type</label>
        <select bind:value={ApplicationType} required>
          <option value="New">New</option>
          <option value="Old">Old (Renewal)</option>
        </select>
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label>Loan Amount (₱)</label>
        <input type="number" bind:value={LoanAmount} required />
      </div>
      <div class="field">
        <label>Loan Term (years)</label>
        <input type="number" bind:value={LoanTerm} required />
      </div>
    </div>
  {/if}

  <!-- Step 2 -->
  {#if step === 2}
    <div class="section-label">Personal Information</div>
    <div class="grid-2">
      <div class="field"><label>Full Name</label><input bind:value={FullName} required /></div>
      <div class="field"><label>Birth Date</label><input type="date" bind:value={BirthDate} required /></div>
      <div class="field"><label>Age</label><input type="number" value={Age ?? ''} readonly /></div>
      <div class="field"><label>Citizenship</label><input bind:value={Citizenship} required /></div>
      <div class="field">
        <label>Gender</label>
        <select bind:value={Gender} required>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <div class="field"><label>TIN</label><input bind:value={TIN} required /></div>
      <div class="field"><label>SSS / GSIS</label><input bind:value={SSS_GSIS} required /></div>
      <div class="field"><label>Mobile</label><input bind:value={MobileNo} required /></div>
      <div class="field"><label>Email</label><input type="email" bind:value={EmailAddress} required /></div>
    </div>
    <hr class="divider" />
    <div class="section-label">
      ID Numbers
      <button class="add-btn" on:click={addID}>+ Add ID</button>
    </div>
    {#each idNumbers as _, i}
      <div class="dynamic-row">
        <input placeholder="ID Number" bind:value={idNumbers[i]} required />
        {#if idNumbers.length > 1}
          <button class="remove-btn" on:click={() => removeID(i)}>✕</button>
        {/if}
      </div>
    {/each}
  {/if}

  <!-- Step 3 -->
  {#if step === 3}
    <div class="section-label">Employment Details</div>
    <div class="grid-2">
      <div class="field"><label>Employer Name</label><input bind:value={EmployerBusinessName} required /></div>
      <div class="field"><label>Business Phone</label><input bind:value={BusinessPhoneNo} required /></div>
    </div>
    <div class="field"><label>Employer Address</label><input bind:value={EmployerBusinessAdd} required /></div>
    <div class="grid-3">
      <div class="field">
        <label>Employment Status</label>
        <select bind:value={EmploymentStatus} required>
          <option value="Regular">Regular</option>
          <option value="Contractual">Contractual</option>
          <option value="Probationary">Probationary</option>
          <option value="Self-employed">Self-employed</option>
        </select>
      </div>
      <div class="field"><label>Years with Employer</label><input type="number" bind:value={EmploymentYearsStay} required /></div>
      <div class="field"><label>Position / Title</label><input bind:value={PositionTitle} required /></div>
      <div class="field"><label>Country</label><input bind:value={Country} required /></div>
      <div class="field"><label>Zip Code</label><input bind:value={ZipCode} required /></div>
    </div>
    <hr class="divider" />
    <div class="section-label">Payroll Information</div>
    <div class="grid-2">
      <div class="field"><label>Employee ID</label><input bind:value={EmployeeID} required /></div>
      <div class="field"><label>Date Hired</label><input type="date" bind:value={DateHired} required /></div>
      <div class="field"><label>Date Regularized</label><input type="date" bind:value={DateRegularized} required /></div>
      <div class="field"><label>Basic Income (₱)</label><input type="number" bind:value={BasicIncome} required /></div>
      <div class="field"><label>Fixed Allowances (₱)</label><input type="number" bind:value={FixedAllowances} required /></div>
      <div class="field"><label>Deductions (₱)</label><input type="number" bind:value={LessDeductions} required /></div>
      <div class="field"><label>Net Pay (₱)</label><input type="number" bind:value={NetPay} required /></div>
      <div class="field"><label>Avg OT / Commissions (₱)</label><input type="number" bind:value={AveOTCommissions} required /></div>
      <div class="field"><label>Net Take-Home Pay (₱)</label><input type="number" bind:value={NetTakeHomePay} required /></div>
    </div>
  {/if}

  <!-- Step 4 -->
  {#if step === 4}
    <div class="section-label">
      Character References
      <button class="add-btn" on:click={addRef}>+ Add Reference</button>
    </div>
    {#each references as ref, i}
      <div class="sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-2)">Reference {i + 1}</span>
          {#if references.length > minReferences}
            <button class="remove-btn" on:click={() => removeRef(i)}>Remove</button>
          {/if}
        </div>
        <div class="grid-2">
          <div class="field"><label>Reference ID</label><input bind:value={ref.ReferenceID} required /></div>
          <div class="field"><label>Full Name</label><input bind:value={ref.ReferenceFullName} required /></div>
          <div class="field"><label>Relationship</label><input bind:value={ref.ReferencesRS} required /></div>
          <div class="field"><label>Phone</label><input bind:value={ref.ReferencePhoneNo} required /></div>
          <div class="field"><label>Email</label><input type="email" bind:value={ref.ReferenceEmail} required /></div>
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
          <div class="field"><label>Dependent ID</label><input bind:value={dep.DependentID} required /></div>
          <div class="field"><label>Full Name</label><input bind:value={dep.DependentsName} required /></div>
        </div>
      </div>
    {/each}
  {/if}

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
        {submitting ? 'Saving…' : 'Save Changes'}
      </button>
    {/if}
  </div>
</div>
{/if}

<style>
  .form-card { max-width: 860px; }

  .step-bar { display: flex; align-items: center; margin-bottom: 2rem; }

  .step-item { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

  .step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid var(--border-strong);
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 600; color: var(--text-3); flex-shrink: 0;
  }
  .step-item.active .step-dot { background: var(--accent); border-color: var(--accent); color: #fff; }
  .step-item.done   .step-dot { background: var(--success-bg); border-color: var(--success); color: var(--success); }

  .step-name { font-size: 0.78rem; font-weight: 500; color: var(--text-3); white-space: nowrap; }
  .step-item.active .step-name { color: var(--text); }
  .step-item.done   .step-name { color: var(--text-2); }

  .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 0.75rem; min-width: 20px; }
  .step-line.done { background: var(--success); }

  .form-nav {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border);
  }

  .sub-card {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 0.75rem;
  }

  .dynamic-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }

  .add-btn {
    background: none; border: none; color: var(--accent);
    font-size: 0.78rem; font-weight: 600; padding: 0 0.25rem;
    cursor: pointer; margin-left: 0.5rem;
  }

  .remove-btn {
    background: var(--danger-bg); color: var(--danger);
    border: 1px solid #fca5a5; font-size: 0.75rem;
    padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);
  }
</style>
