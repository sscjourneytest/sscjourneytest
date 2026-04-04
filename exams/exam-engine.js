let EXAM_JSON = null;
let currentFilters = { tier: 'tier1', year: '', type: 'full_mocks', section: '' };

async function initExamEngine() {
    const pathParts = window.location.pathname.split('/');
    const examName = pathParts[pathParts.length - 2];
    
    document.getElementById('grid-sync').innerText = "🔄 Syncing Premium Database...";
    
    try {
        const response = await fetch(`https://sscjourneytest.github.io/sscjourneytest/data/${examName}-data.json`);
        EXAM_JSON = await response.json();
        
        // Auto-detect first year available
        const years = Object.keys(EXAM_JSON.data[currentFilters.tier]);
        currentFilters.year = years.sort().reverse()[0];
        
        setupFilters(years);
        renderMocks();
    } catch (e) {
        document.getElementById('grid-sync').innerHTML = "⚠️ Failed to sync. Check connection.";
    }
}

function setupFilters(years) {
    // Tier Toggle
    if (!EXAM_JSON.data.tier2) document.getElementById('tier-wrap').classList.add('hidden');
    
    // Year Scroll
    let yearHtml = '';
    years.forEach(y => {
        yearHtml += `<div class="pill-filter ${y === currentFilters.year ? 'active' : ''}" data-year="${y}" onclick="setYear('${y}', this)">${y}</div>`;
    });
    document.getElementById('year-scroll').innerHTML = yearHtml;
}

function renderMocks() {
    const grid = document.getElementById('quizGrid');
    const config = EXAM_JSON.config[currentFilters.tier];
    const source = EXAM_JSON.data[currentFilters.tier][currentFilters.year];
    const searchVal = document.getElementById('mockSearch').value.toLowerCase();
    
    // Auth Logic Integration
    const profile = typeof getLocalProfile === 'function' ? getLocalProfile() : null;
    const isPaidUser = profile ? profile.is_paid : false;
    const username = profile ? profile.username : "Guest";

    let html = '';
    let rawList = source[currentFilters.type] || [];
    let itemsToDisplay = [];

    // AUTO-SECTIONAL GENERATOR
    if (currentFilters.type === 'sectional') {
        const fullMocksForSection = source.full_mocks || [];
        const sectionDef = config.sections.find(s => s.id === currentFilters.section);
        
        fullMocksForSection.forEach(mock => {
            const cleanSec = sectionDef.name.replace(/\s+/g, '').toLowerCase();
            itemsToDisplay.push({
                ...mock,
                id: `${mock.id}-${cleanSec}`,
                originalId: mock.id,
                title: `${mock.title} - ${sectionDef.name}`,
                qs: sectionDef.qs,
                time: sectionDef.time,
                marks: sectionDef.marks,
                linkParam: `id=${mock.id}&section=${encodeURIComponent(sectionDef.name)}`
            });
        });
    } else {
        itemsToDisplay = rawList.map(item => ({...item, linkParam: `id=${item.id}`, originalId: item.id }));
    }

    itemsToDisplay.forEach(item => {
        if (searchVal && !item.title.toLowerCase().includes(searchVal)) return;

        // Logic 1: Release Date Check
        const isLockedDate = item.releaseDate && new Date(item.releaseDate) > new Date();
        
        // Logic 2: Premium Check
        const accessDenied = item.type === 'paid' && !isPaidUser;
        
        // Logic 3: Result & Resume Check
        const resultKey = `result_${username}_${item.id}`;
        const stateKey = `state_${username}_${item.id}`;
        const savedResult = JSON.parse(localStorage.getItem(resultKey) || "{}");
        const savedState = JSON.parse(localStorage.getItem(stateKey) || "{}");

        let actionHtml = '';
        let scoreHtml = '';

        if (isLockedDate) {
            actionHtml = `<div class="action-btn unlock-btn" style="opacity:0.6; cursor:default;">Available ${item.releaseDate}</div>`;
        } else if (accessDenied) {
            actionHtml = `<a href="/buy-premium.html" class="action-btn unlock-btn">🔒 UNLOCK TEST</a>`;
        } else {
            if (savedResult.submitted) {
                const pct = Math.min(100, (savedResult.totalMarks / (item.marks || 100)) * 100);
                const barColor = pct >= 75 ? '#22c55e' : (pct >= 50 ? '#f59e0b' : '#ef4444');
                
                actionHtml = `
                    <div class="btn-grid btn-dual">
                        <a href="${getLink(config)}?${item.linkParam}" class="action-btn analysis-btn">ANALYSIS</a>
                        <button onclick="reattempt('${item.id}', '${getLink(config)}?${item.linkParam}')" class="action-btn reattempt-btn">REATTEMPT</button>
                    </div>
                `;
                scoreHtml = `
                    <div class="score-row">
                        <div class="score-bar-bg"><div class="score-bar-fill" style="width:${pct}%; background:${barColor}"></div></div>
                        <div class="score-text">${savedResult.totalMarks}/${item.marks || 100}</div>
                    </div>
                `;
            } else if (savedState.isPaused) {
                actionHtml = `<a href="${getLink(config)}?${item.linkParam}" class="action-btn resume-btn">▶️ RESUME TEST</a>`;
            } else {
                actionHtml = `<a href="${getLink(config)}?${item.linkParam}" class="action-btn start-btn">START TEST</a>`;
            }
        }

        html += `
            <div class="mock-card">
                <div class="card-top">
                    <div class="card-info">
                        <div class="card-title">${item.title} <span class="badge-type ${item.type === 'free' ? 'free-badge' : 'paid-badge'}">${item.type.toUpperCase()}</span></div>
                        <div class="card-meta">${item.qs || 100} Questions • ${item.time || '60 Min'}</div>
                    </div>
                </div>
                ${scoreHtml}
                <div class="btn-grid">${actionHtml}</div>
            </div>
        `;
    });

    grid.innerHTML = html || `<div class="text-center p-5 text-muted">🚀 Tests Coming Soon...</div>`;
    document.getElementById('grid-sync').innerText = "";
}

function getLink(config) {
    if (currentFilters.type === 'full_mocks') return config.full_link;
    if (currentFilters.type === 'sectional') return config.sectional_link;
    return config.subject_link;
}

function setYear(y, el) {
    document.querySelectorAll('#year-scroll .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.year = y;
    renderMocks();
}

function filterType(type, el) {
    document.querySelectorAll('#type-filters .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.type = type;
    
    const secWrap = document.getElementById('section-wrap');
    if (type === 'sectional') {
        secWrap.classList.remove('hidden');
        renderSectionPills();
    } else {
        secWrap.classList.add('hidden');
        renderMocks();
    }
}

function renderSectionPills() {
    const sections = EXAM_JSON.config[currentFilters.tier].sections;
    currentFilters.section = sections[0].id;
    let html = '';
    sections.forEach(s => {
        html += `<div class="pill-filter ${s.id === currentFilters.section ? 'active' : ''}" onclick="setSection('${s.id}', this)">${s.name}</div>`;
    });
    document.getElementById('section-scroll').innerHTML = html;
    renderMocks();
}

function setSection(id, el) {
    document.querySelectorAll('#section-scroll .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.section = id;
    renderMocks();
}

function setTier(t, el) {
    document.querySelectorAll('#tier-wrap .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.tier = t;
    renderMocks();
}

function reattempt(id, url) {
    const profile = getLocalProfile();
    const username = profile ? profile.username : "Guest";
    if(confirm("Confirm Reattempt? Previous result will be deleted.")) {
        localStorage.removeItem(`result_${username}_${id}`);
        localStorage.removeItem(`state_${username}_${id}`);
        window.location.href = url;
    }
}
