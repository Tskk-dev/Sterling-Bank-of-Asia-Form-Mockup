<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { createApplication } from '$lib/api';
  import { auth } from '$lib/auth';
  import { goto } from '$app/navigation';

  let step = $state(1);
  const totalSteps = 4;
  let submitting = $state(false);
  let error = $state('');

  const minReferences = 3;

  // Step 1
  let DateApplication  = $state(new Date().toISOString().split('T')[0]);
  let ApplicationType  = $state('New');
  let LoanAmount       = $state('');
  let LoanTerm         = $state('');

  // Step 2
  let FullName         = $state('');
  let BirthDate        = $state('');
  const Age            = $derived(BirthDate ? calcAge(BirthDate) : null);
  let Citizenship      = $state('Filipino');
  let Gender           = $state('M');
  let TIN              = $state('');
  let SSS_GSIS         = $state('');
  let MobileNo         = $state('');
  let EmailAddress     = $state('');
  let idNumbers        = $state(['']);

  // Step 3
  let EmployerBusinessName = $state('');
  let EmployerBusinessAdd  = $state('');
  let EmploymentStatus     = $state('Regular');
  let EmploymentYearsStay  = $state('');
  let PositionTitle        = $state('');
  let Country              = $state('Philippines');
  let ZipCode              = $state('');
  let BusinessPhoneNo      = $state('');
  let DateHired          = $state('');
  let DateRegularized    = $state('');
  let BasicIncome        = $state('');
  let FixedAllowances    = $state('');
  let LessDeductions     = $state('');
  let NetPay             = $state('');
  let AveOTCommissions   = $state('');
  let NetTakeHomePay     = $state('');

  // Step 4
  let references  = $state(Array.from({ length: minReferences }, () => ({ ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' })));
  let dependents  = $state([{ DependentsName: '' }]);

  function addRef()            { references = [...references, { ReferenceFullName: '', ReferencesRS: '', ReferencePhoneNo: '', ReferenceEmail: '' }]; }
  function removeRef(i: number){ if (references.length > minReferences) references = references.filter((_, idx) => idx !== i); }
  function addDep()            { dependents = [...dependents, { DependentsName: '' }]; }
  function removeDep(i: number){ dependents = dependents.filter((_, idx) => idx !== i); }
  function addID()             { idNumbers  = [...idNumbers, '']; }
  function removeID(i: number) { idNumbers  = idNumbers.filter((_, idx) => idx !== i); }
  function next() { if (step < totalSteps) step++; }
  function prev() { if (step > 1) step--; }

  let hasExistingApplication = $state(false);

  onMount(() => {
    auth.init();
    if (!get(auth.isLoggedIn)) { goto('/login'); return; }
    const user = get(auth.user);
    hasExistingApplication = Boolean(user?.applicationID);
  });

  function calcAge(isoDate: string) {
    const birth = new Date(isoDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function hasMissingReference(ref: any) {
    return !ref?.ReferenceFullName || !ref?.ReferencesRS || !ref?.ReferencePhoneNo || !ref?.ReferenceEmail;
  }

  function isBlank(value: any) {
    return value === undefined || value === null || String(value).trim() === '';
  }

  function isPositiveNumber(value: any) {
    return !Number.isNaN(Number(value)) && Number(value) > 0;
  }

  function validateBeforeSubmit() {
    if (ApplicationType === 'New' && hasExistingApplication) {
      error = 'You cannot apply for a new loan while you have an existing unpaid loan.';
      return false;
    }
    const requiredFields = [
      DateApplication, ApplicationType, LoanAmount, LoanTerm,
      FullName, BirthDate, Citizenship, Gender, TIN, SSS_GSIS,
      MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd,
      EmploymentStatus, EmploymentYearsStay, PositionTitle, Country,
      ZipCode, BusinessPhoneNo, DateHired, DateRegularized, BasicIncome,
      FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay,
    ];
    if (requiredFields.some(isBlank)) {
      error = 'Please complete all required fields before submitting.';
      return false;
    }
    if (!isPositiveNumber(LoanAmount) || !isPositiveNumber(LoanTerm) || !isPositiveNumber(EmploymentYearsStay)) {
      error = 'Loan amount, loan term, and years with employer must be valid numbers.';
      return false;
    }
    const filledReferences = references.filter((ref) => ref.ReferenceFullName || ref.ReferencesRS || ref.ReferencePhoneNo || ref.ReferenceEmail);
    if (filledReferences.length < minReferences || filledReferences.some(hasMissingReference)) {
      error = `Please provide at least ${minReferences} complete references.`;
      return false;
    }
    if (!idNumbers.some(Boolean)) {
      error = 'Please provide at least one ID number.';
      return false;
    }
    if (!dependents.some((d) => d.DependentsName)) {
      error = 'Please provide at least one dependent.';
      return false;
    }
    return true;
  }

  async function submit() {
    submitting = true;
    error = '';
    try {
      if (!validateBeforeSubmit()) { submitting = false; return; }
      const user = get(auth.user);
      await createApplication({
        userID: user?.userID ?? null,
        application: { DateApplication, ApplicationType, LoanAmount: Number(LoanAmount), LoanTerm, FullName, BirthDate, Age: Age ?? null, Citizenship, Gender, TIN, SSS_GSIS, MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd, EmploymentStatus, EmploymentYearsStay: Number(EmploymentYearsStay), PositionTitle, Country, ZipCode, BusinessPhoneNo },
        idNumbers:  idNumbers.filter(Boolean).map(n => ({ IDNumber: n })),
        employee:   { DateHired, DateRegularized, BasicIncome: Number(BasicIncome), FixedAllowances: Number(FixedAllowances), LessDeductions: Number(LessDeductions), NetPay: Number(NetPay), AveOTCommissions: Number(AveOTCommissions), NetTakeHomePay: Number(NetTakeHomePay) },
        references: references.filter(r => r.ReferenceFullName && r.ReferencesRS && r.ReferencePhoneNo && r.ReferenceEmail),
        dependents: dependents.filter(d => d.DependentsName).map(d => ({ ...d, TotalNoDependents: dependents.filter(x => x.DependentsName).length })),
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

<div class="step-bar">
  {#each Array(totalSteps) as _, i}
    <div class="step-item" class:done={i + 1 < step} class:active={i + 1 === step}>
      <div class="step-dot">{i + 1 < step ? '✓' : i + 1}</div>
      <div class="step-name">{['Loan Details', 'Personal Info', 'Employment', 'References & Dependents'][i]}</div>
    </div>
    {#if i < totalSteps - 1}<div class="step-line" class:done={i + 1 < step}></div>{/if}
  {/each}
</div>

{#if error}<div class="error-msg">⚠ {error}</div>{/if}

<div class="card form-card">

  {#if step === 1}
    <div class="section-label">Loan Information</div>
    <div class="grid-3">
      <div class="field">
        <label for="date">Date Filed</label>
        <input id="date" type="date" bind:value={DateApplication} required />
      </div>
      <div class="field">
        <label for="apptype">Application Type</label>
        <select id="apptype" bind:value={ApplicationType} required>
          <option value="New">New</option>
          <option value="Old">Old (Renewal)</option>
        </select>
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="amount">Loan Amount (₱)</label>
        <input id="amount" type="number" placeholder="50000" bind:value={LoanAmount} required />
      </div>
      <div class="field">
        <label for="term">Loan Term (years)</label>
        <input id="term" type="number" placeholder="5" bind:value={LoanTerm} required />
      </div>
    </div>
  {/if}

  {#if step === 2}
    <div class="section-label">Personal Information</div>
    <div class="grid-2">
      <div class="field"><label for="fname">Full Name</label><input id="fname" placeholder="Juan Dela Cruz" bind:value={FullName} required /></div>
      <div class="field"><label for="bdate">Birth Date</label><input id="bdate" type="date" bind:value={BirthDate} required /></div>
      <div class="field"><label for="age">Age</label><input id="age" type="number" value={Age ?? ''} readonly /></div>
      <div class="field"><label for="cit">Citizenship</label><input id="cit" placeholder="Filipino" bind:value={Citizenship} required /></div>
      <div class="field">
        <label for="gender">Gender</label>
        <select id="gender" bind:value={Gender} required>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <div class="field"><label for="tin">TIN</label><input id="tin" placeholder="123456789" bind:value={TIN} required /></div>
      <div class="field"><label for="sss">SSS / GSIS</label><input id="sss" placeholder="1234567890" bind:value={SSS_GSIS} required /></div>
      <div class="field"><label for="mobile">Mobile</label><input id="mobile" placeholder="09XXXXXXXXX" bind:value={MobileNo} required /></div>
      <div class="field"><label for="email">Email</label><input id="email" type="email" placeholder="email@example.com" bind:value={EmailAddress} required /></div>
    </div>
    <hr class="divider" />
    <div class="section-label">
      ID Numbers
      <button class="add-btn" onclick={addID}>+ Add ID</button>
    </div>
    {#each idNumbers as _, i}
      <div class="dynamic-row">
        <input placeholder="ID Number" bind:value={idNumbers[i]} required />
        {#if idNumbers.length > 1}
          <button class="remove-btn" onclick={() => removeID(i)}>✕</button>
        {/if}
      </div>
    {/each}
  {/if}

  {#if step === 3}
    <div class="section-label">Employment Details</div>
    <div class="grid-2">
      <div class="field"><label for="employer">Employer Name</label><input id="employer" placeholder="ABC Company" bind:value={EmployerBusinessName} required /></div>
      <div class="field"><label for="bizphone">Business Phone</label><input id="bizphone" placeholder="09XXXXXXXXX" bind:value={BusinessPhoneNo} required /></div>
    </div>
    <div class="field"><label for="bizadd">Employer Address</label><input id="bizadd" placeholder="123 Street, City" bind:value={EmployerBusinessAdd} required /></div>
    <div class="grid-3">
      <div class="field">
        <label for="empstatus">Employment Status</label>
        <select id="empstatus" bind:value={EmploymentStatus} required>
          <option value="Regular">Regular</option>
          <option value="Contractual">Contractual</option>
          <option value="Probationary">Probationary</option>
          <option value="Self-employed">Self-employed</option>
        </select>
      </div>
      <div class="field"><label for="yrs">Years with Employer</label><input id="yrs" type="number" placeholder="3" bind:value={EmploymentYearsStay} required /></div>
      <div class="field"><label for="pos">Position / Title</label><input id="pos" placeholder="Software Engineer" bind:value={PositionTitle} required /></div>
      <div class="field"><label for="country">Country</label><input id="country" placeholder="Philippines" bind:value={Country} required /></div>
      <div class="field"><label for="zip">Zip Code</label><input id="zip" placeholder="1000" bind:value={ZipCode} required /></div>
    </div>
    <hr class="divider" />
    <div class="section-label">Payroll Information</div>
    <div class="grid-2">
      <div class="field"><label for="hired">Date Hired</label><input id="hired" type="date" bind:value={DateHired} required /></div>
      <div class="field"><label for="reg">Date Regularized</label><input id="reg" type="date" bind:value={DateRegularized} required /></div>
      <div class="field"><label for="basic">Basic Income (₱)</label><input id="basic" type="number" placeholder="25000" bind:value={BasicIncome} required /></div>
      <div class="field"><label for="allow">Fixed Allowances (₱)</label><input id="allow" type="number" placeholder="5000" bind:value={FixedAllowances} required /></div>
      <div class="field"><label for="ded">Deductions (₱)</label><input id="ded" type="number" placeholder="3000" bind:value={LessDeductions} required /></div>
      <div class="field"><label for="netpay">Net Pay (₱)</label><input id="netpay" type="number" placeholder="27000" bind:value={NetPay} required /></div>
      <div class="field"><label for="ot">Avg OT / Commissions (₱)</label><input id="ot" type="number" placeholder="2000" bind:value={AveOTCommissions} required /></div>
      <div class="field"><label for="takehome">Net Take-Home Pay (₱)</label><input id="takehome" type="number" placeholder="29000" bind:value={NetTakeHomePay} required /></div>
    </div>
  {/if}

  {#if step === 4}
    <div class="section-label">
      Character References
      <button class="add-btn" onclick={addRef}>+ Add Reference</button>
    </div>
    {#each references as ref, i}
      <div class="sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-2)">Reference {i + 1}</span>
          {#if references.length > minReferences}
            <button class="remove-btn" onclick={() => removeRef(i)}>Remove</button>
          {/if}
        </div>
        <div class="grid-2">
          <div class="field"><label for="rname{i}">Full Name</label><input id="rname{i}" placeholder="Name" bind:value={ref.ReferenceFullName} required /></div>
          <div class="field"><label for="rrs{i}">Relationship</label><input id="rrs{i}" placeholder="Boss / Colleague / Friend" bind:value={ref.ReferencesRS} required /></div>
          <div class="field"><label for="rphone{i}">Phone</label><input id="rphone{i}" placeholder="09XXXXXXXXX" bind:value={ref.ReferencePhoneNo} required /></div>
          <div class="field"><label for="remail{i}">Email</label><input id="remail{i}" type="email" placeholder="ref@email.com" bind:value={ref.ReferenceEmail} required /></div>
        </div>
      </div>
    {/each}
    <hr class="divider" />
    <div class="section-label">
      Dependents
      <button class="add-btn" onclick={addDep}>+ Add Dependent</button>
    </div>
    {#each dependents as dep, i}
      <div class="sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-2)">Dependent {i + 1}</span>
          {#if dependents.length > 1}
            <button class="remove-btn" onclick={() => removeDep(i)}>Remove</button>
          {/if}
        </div>
        <div class="field"><label for="dname{i}">Full Name</label><input id="dname{i}" placeholder="Name" bind:value={dep.DependentsName} required /></div>
      </div>
    {/each}
  {/if}

  <div class="form-nav">
    {#if step > 1}
      <button class="btn-secondary" onclick={prev}>← Back</button>
    {:else}
      <div></div>
    {/if}
    {#if step < totalSteps}
      <button class="btn-primary" onclick={next}>Next →</button>
    {:else}
      <button class="btn-primary" onclick={submit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    {/if}
  </div>
</div>

<style>
  .form-card { max-width: 860px; }
  .step-bar { display: flex; align-items: center; margin-bottom: 2rem; }
  .step-item { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
  .step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid var(--border-strong); background: var(--surface);
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
