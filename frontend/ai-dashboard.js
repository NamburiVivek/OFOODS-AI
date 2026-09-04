const API_BASE = '/api/ai/recovery';

async function fetchStats() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('statTotal').innerText = data.stats.total;
            document.getElementById('statRecovered').innerText = data.stats.recovered;
            document.getElementById('statRate').innerText = `${data.stats.recoveryRate.toFixed(1)}%`;
        }
    } catch (e) { console.error('Error fetching stats:', e); }
}

async function fetchCases() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/cases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const tbody = document.getElementById('casesTableBody');
            tbody.innerHTML = '';
            
            data.cases.forEach(c => {
                const tr = document.createElement('tr');
                
                let actionsHTML = '';
                if (c.status === 'pending') {
                    actionsHTML = `
                        <button class="btn btn-approve" onclick="handleAction(${c.id}, 'approve')">Approve Strategy</button>
                        <button class="btn btn-reject" onclick="handleAction(${c.id}, 'reject')">Reject</button>
                    `;
                } else {
                    actionsHTML = `<span style="color:#777">Action Taken</span>`;
                }

                tr.innerHTML = `
                    <td>
                        <strong>${c.user_name || 'Unknown'}</strong><br>
                        <small style="color:var(--text-muted)">${c.user_email || ''}</small>
                    </td>
                    <td>${c.type.replace('_', ' ').toUpperCase()}</td>
                    <td>
                        <div style="font-weight:600; color:var(--primary); margin-bottom:5px;">${c.action_taken ? c.action_taken.replace(/_/g, ' ').toUpperCase() : 'NONE'}</div>
                        <small>${c.ai_recommendation}</small>
                    </td>
                    <td>
                        <div>${c.recovery_probability}%</div>
                        <div class="probability-bar">
                            <div class="probability-fill" style="width: ${c.recovery_probability}%"></div>
                        </div>
                    </td>
                    <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                    <td>${actionsHTML}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) { console.error('Error fetching cases:', e); }
}

async function handleAction(id, action) {
    if (!confirm(`Are you sure you want to ${action} this AI strategy?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/cases/${id}/action`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ action })
        });
        
        if (res.ok) {
            fetchStats();
            fetchCases();
        }
    } catch (e) { console.error('Error updating case:', e); }
}

// Init
fetchStats();
fetchCases();
