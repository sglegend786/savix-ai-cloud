function nextStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('d-none'));
    document.getElementById('step-' + step).classList.remove('d-none');
    document.getElementById('form-progress').style.width = (step * 50) + '%';
}

function resetForm() {
    document.getElementById('results-container').classList.add('d-none');
    document.getElementById('form-container').classList.remove('d-none');
    nextStep(1);
}

function submitForm() {
    const form = document.getElementById('insurance-form');
    
    // Build payload
    const reqs = [];
    document.querySelectorAll('.req-check:checked').forEach(el => reqs.push(el.value));
    
    const payload = {
        age: parseInt(form.age.value) || 0,
        budget: parseInt(form.budget.value) || 0,
        is_ex_serviceman: document.getElementById('ex_serviceman').checked,
        is_capf: document.getElementById('capf').checked,
        is_govt_employee: document.getElementById('govt').checked,
        coverageRequired: parseInt(form.coverageRequired.value) || 0,
        familyMembers: parseInt(form.familyMembers.value) || 1,
        requirements: reqs
    };
    
    if (payload.age <= 0) {
        alert("Please enter a valid age.");
        nextStep(1);
        return;
    }

    // Call API
    fetch('/api/insurance/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        renderResults(data);
    })
    .catch(err => {
        console.error(err);
        alert("Failed to calculate recommendations.");
    });
}

function renderResults(data) {
    document.getElementById('form-container').classList.add('d-none');
    document.getElementById('results-container').classList.remove('d-none');
    
    // Render top 3
    const recRow = document.getElementById('recommendations-row');
    recRow.innerHTML = '';
    
    data.recommendations.forEach((item, index) => {
        const badges = ['🥇 Best Overall', '🥈 Best Value', '🥉 Best Coverage'];
        const badge = badges[index] || 'Recommend';
        
        const reasonsHtml = item.recommendation_reasons.map(r => `<li><small class="text-muted"><i class="bi bi-check-circle-fill text-success"></i> ${r}</small></li>`).join('');
        
        let premDisplay = item.premium.display;
        if (item.premium.type === 'UNAVAILABLE') {
            premDisplay = `<span class="badge bg-secondary">Quote Unavailable</span>`;
        } else if (item.premium.type === 'OFFICIAL' && item.premium.amount === 0) {
            premDisplay = `<span class="badge bg-success">₹0 Premium</span>`;
        } else {
            premDisplay = `₹${item.premium.amount}${item.premium.type === 'INDICATIVE' ? ' (Est)' : ''}`;
        }

        const card = `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm border-0 position-relative">
            <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-primary px-3 py-2 shadow" style="font-size:0.9rem">${badge}</span>
            <div class="card-body pt-4 text-center">
              <h6 class="card-title text-primary mb-1">${item.scheme.name}</h6>
              <div class="small text-muted mb-3">${item.scheme.category.replace(/_/g, ' ')}</div>
              
              <div class="mb-3">
                <div style="font-size: 2rem; font-weight: 700; color: #0d6efd;">${item.savix_score} <span style="font-size:1rem; color:#6c757d">/100</span></div>
                <div class="small fw-bold text-muted">SAVIX SCORE</div>
              </div>
              
              <div class="d-flex justify-content-around mb-3 pb-3 border-bottom">
                <div>
                  <div class="small text-muted">Premium</div>
                  <div class="fw-bold">${premDisplay}</div>
                </div>
                <div>
                  <div class="small text-muted">Coverage</div>
                  <div class="fw-bold">${item.scheme.coverage.amount ? '₹' + (item.scheme.coverage.amount/100000) + 'L' : 'Depends'}</div>
                </div>
              </div>
              
              <ul class="list-unstyled text-start mb-4" style="min-height: 80px;">
                ${reasonsHtml}
              </ul>
              
              <a href="${item.scheme.official_url || '#'}" target="_blank" class="btn btn-outline-primary btn-sm w-100">Official Details <i class="bi bi-box-arrow-up-right"></i></a>
            </div>
          </div>
        </div>
        `;
        recRow.innerHTML += card;
    });

    if (data.recommendations.length === 0) {
        recRow.innerHTML = `<div class="col-12"><div class="alert alert-warning">No highly matching policies found for your profile. Try adjusting requirements.</div></div>`;
    }

    // Render comparison table
    const tbody = document.getElementById('comparison-tbody');
    tbody.innerHTML = '';
    
    // Combine eligible and ineligible for table
    const all = data.all_eligible.concat(data.ineligible);
    
    all.forEach(item => {
        const isElig = item.eligibility.eligible;
        const scoreClass = isElig ? (item.savix_score >= 80 ? 'text-success fw-bold' : '') : 'text-danger';
        const eligBadge = isElig ? `<span class="badge bg-success">Eligible</span>` : `<span class="badge bg-danger">Ineligible</span> <i class="bi bi-info-circle text-muted" title="${item.eligibility.failedConditions.join(', ')}"></i>`;
        
        let premTxt = item.premium.display;
        if(item.premium.type === 'UNAVAILABLE') premTxt = 'Depends on profile';
        
        const covTxt = item.scheme.coverage.amount ? '₹' + (item.scheme.coverage.amount/100000) + 'L' : 'Depends';

        const tr = `
        <tr>
          <td>
            <div class="fw-bold text-primary">${item.scheme.name}</div>
            <div class="small text-muted">${item.scheme.provider || 'Govt'}</div>
          </td>
          <td><span class="badge bg-secondary">${item.scheme.category.replace(/_/g, ' ')}</span></td>
          <td class="${scoreClass}">${item.savix_score}</td>
          <td class="small">${premTxt}</td>
          <td>${covTxt}</td>
          <td>${eligBadge}</td>
          <td><a href="${item.scheme.official_url || '#'}" target="_blank" class="btn btn-light btn-sm"><i class="bi bi-link"></i> Link</a></td>
        </tr>
        `;
        tbody.innerHTML += tr;
    });
}
