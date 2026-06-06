// Tab Switcher (CodePen safe version)
window.switchTab = function(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ==========================================
// CONFIG RUNTIME GOOGLE SHEETS LINKS
// ==========================================
const standingsUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJPLwWXeARI0f9UC68aD6LOI8s-rMkps1g_FY6qFznpD-pWZaqFnZH3oq7DNPlrf-LzSm7ATvy94zk/pub?gid=0&single=true&output=csv'; 
const resultsUrl   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJPLwWXeARI0f9UC68aD6LOI8s-rMkps1g_FY6qFznpD-pWZaqFnZH3oq7DNPlrf-LzSm7ATvy94zk/pub?gid=1781997492&single=true&output=csv'; 
const historyUrl   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJPLwWXeARI0f9UC68aD6LOI8s-rMkps1g_FY6qFznpD-pWZaqFnZH3oq7DNPlrf-LzSm7ATvy94zk/pub?gid=486742642&single=true&output=csv'; 
const trophiesUrl  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJPLwWXeARI0f9UC68aD6LOI8s-rMkps1g_FY6qFznpD-pWZaqFnZH3oq7DNPlrf-LzSm7ATvy94zk/pub?gid=343254526&single=true&output=csv';

const cacheBuster = `&cache=${new Date().getTime()}`;

// Data Cleaner
function parseCSVRow(rowStr) {
    let delimiter = ',';
    if (rowStr.includes(';')) delimiter = ';';
    return rowStr.split(delimiter).map(item => item.replace(/^"|"$/g, '').trim());
}

// 1. Fetch Standings
async function fetchStandings() {
    try {
        const res = await fetch(standingsUrl + cacheBuster);
        const rows = (await res.text()).split(/\r?\n/);
        const tb = document.getElementById('league-table-body'); tb.innerHTML = '';
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            const cols = parseCSVRow(rows[i]);
            if (cols.length >= 2 && cols[1] !== "") {
                tb.innerHTML += `
                    <tr>
                        <td><span style="color: var(--text-muted);">${cols[0] || i}</span></td>
                        <td><strong>${cols[1]}</strong></td>
                        <td>${cols[2] || 0}</td>
                        <td>${cols[3] || 0}-${cols[4] || 0}-${cols[5] || 0}</td>
                        <td>${cols[6] || 0}</td>
                        <td><strong style="color: var(--accent-color);">${cols[7] || 0}</strong></td>
                    </tr>`;
            }
        }
    } catch(e) { document.getElementById('league-table-body').innerHTML = '<tr><td colspan="6" class="error-msg">Error loading Standings.</td></tr>'; }
}

// 2. Fetch Results
async function fetchResults() {
    try {
        const res = await fetch(resultsUrl + cacheBuster);
        const rows = (await res.text()).split(/\r?\n/);
        const rb = document.getElementById('results-box'); rb.innerHTML = '';
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            const cols = parseCSVRow(rows[i]);
            if (cols.length >= 2 && cols[1] !== "") {
                rb.innerHTML += `
                    <div class="matchup-row">
                        <div class="score-box">
                            <span class="team-name team-home">${cols[1]}</span>
                            <div class="score-center">
                                <span class="score-numbers">${cols[2]||'-'} : ${cols[3]||'-'}</span>
                                <span class="status-tag">${cols[5]||'Scheduled'}</span>
                            </div>
                            <span class="team-name team-away">${cols[4]||'TBD'}</span>
                        </div>
                    </div>`;
            }
        }
    } catch(e) { document.getElementById('results-box').innerHTML = '<p class="error-msg">Error loading Results.</p>'; }
}

// 3. Fetch Trophies (Aligned for your exact 5 columns)
async function fetchTrophies() {
    try {
        const res = await fetch(trophiesUrl + cacheBuster);
        const rows = (await res.text()).split(/\r?\n/);
        const tc = document.getElementById('trophies-container');
        tc.innerHTML = '';

        let currentComp = '';
        let tableHTML = '';

        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            const cols = parseCSVRow(rows[i]);
            
            // Proceed if the row has enough data
            if (cols.length >= 4 && cols[0] !== "") {
                const competition = cols[0];

                if (competition !== currentComp) {
                    if (currentComp !== '') tableHTML += `</tbody></table></div>`; 
                    currentComp = competition;
                    tableHTML += `
                        <div class="comp-block">
                            <h3 class="comp-title">${competition} History</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 20%;">Season</th>
                                        <th style="width: 40%;">Winner</th>
                                        <th style="width: 40%;">Competition Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                }

                let detailText = '-';
                const scoreOrPoints = cols[3] || 'N/A';
                const runnerUp = cols[4] || 'TBD';

                if (competition.toLowerCase().includes('league')) {
                    detailText = `${scoreOrPoints} Pts (Runner-Up: ${runnerUp})`;
                } else {
                    detailText = `Score: ${scoreOrPoints} vs ${runnerUp}`;
                }

                tableHTML += `
                    <tr>
                        <td><span style="color: var(--text-muted);">Season ${cols[1]}</span></td>
                        <td><strong style="color: var(--accent-color);">${cols[2]}</strong></td>
                        <td>${detailText}</td>
                    </tr>`;
            }
        }
        
        if (tableHTML !== '') {
            tableHTML += `</tbody></table></div>`;
            tc.innerHTML = tableHTML;
        } else {
            tc.innerHTML = '<p class="error-msg">No trophy brackets found. Add data to your sheet!</p>';
        }
    } catch(e) { document.getElementById('trophies-container').innerHTML = '<p class="error-msg">Error loading Trophies.</p>'; }
}

// 4. Fetch League History 
async function fetchHistory() {
    try {
        const res = await fetch(historyUrl + cacheBuster);
        const rows = (await res.text()).split(/\r?\n/);
        const hc = document.getElementById('history-container');
        hc.innerHTML = '';

        let currentSeason = '';
        let tableHTML = '';

        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            const cols = parseCSVRow(rows[i]);
            
            if (cols.length >= 3 && cols[0] !== "") {
                const season = cols[0];

                if (season !== currentSeason) {
                    if (currentSeason !== '') tableHTML += `</tbody></table></div>`; 
                    currentSeason = season;
                    tableHTML += `
                        <div class="season-block">
                            <h3 class="season-title">Season ${season}</h3>
                            <table>
                                <thead>
                                    <tr><th>Pos</th><th>Team</th><th>P</th><th>W-D-L</th><th>GD</th><th>Points</th></tr>
                                </thead>
                                <tbody>
                    `;
                }

                tableHTML += `
                    <tr>
                        <td><span style="color: var(--text-muted);">${cols[1]}</span></td>
                        <td><strong>${cols[2]}</strong></td>
                        <td>${cols[3]||0}</td>
                        <td>${cols[4]||0}-${cols[5]||0}-${cols[6]||0}</td>
                        <td>${cols[7]||0}</td>
                        <td><strong style="color: var(--accent-color);">${cols[8]||0}</strong></td>
                    </tr>`;
            }
        }
        
        if (tableHTML !== '') {
            tableHTML += `</tbody></table></div>`;
            hc.innerHTML = tableHTML;
        } else {
            hc.innerHTML = '<p class="error-msg">No historical data found. Add some to your sheet!</p>';
        }
    } catch(e) { document.getElementById('history-container').innerHTML = '<p class="error-msg">Error loading League History.</p>'; }
}

// Give CodePen a tiny delay so the DOM builds before fetching data
setTimeout(() => {
    fetchStandings();
    fetchResults();
    fetchTrophies();
    fetchHistory();
}, 100);