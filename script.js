let db;

async function init() {
    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        loadTags();
    } catch (err) {
        console.error(err);
    }
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    const allTags = res[0].values;
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        select.innerHTML = '<option value="">ALL_UNITS</option>';
        allTags.filter(t => t[0] === i).forEach(t => {
            select.innerHTML += `<option value="${t[1]}">${t[1]}</option>`;
        });
        select.onchange = search;
    }
}

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';
    const container = document.getElementById('equipment-grid');
    
    const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
    const res = db.exec(query, [t1, t2, t3]);

    container.innerHTML = "";
    if (res.length > 0) {
        const rows = res[0].values;
        document.getElementById('result-count').innerText = `Search Result: ${rows.length} Units Detected`;

        rows.forEach((row) => {
            const card = document.createElement('div');
            // 官網風格：卡片背景為深灰，懸停時圖片背景變黃
            card.className = "bg-[#111] p-6 relative group transition-all duration-300 hover:bg-[#161616] cursor-pointer overflow-hidden";
            
            card.innerHTML = `
                <div class="scan-line group-hover:block hidden"></div>
                
                <div class="w-full aspect-square bg-[#0a0a0a] border border-[#222] flex items-center justify-center mb-6 group-hover:border-yellow-500/50 transition-colors relative">
                    <img src="./images/${row[0]}.png" class="w-4/5 h-4/5 object-contain filter group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0" onerror="this.src='./images/default.png'; this.style.opacity=0.1">
                    <div class="absolute bottom-2 right-2 text-[8px] text-zinc-800 font-mono tracking-tighter uppercase opacity-0 group-hover:opacity-100 transition-opacity">Visual_Feed_OK</div>
                </div>

                <div class="mb-4">
                    <h3 class="text-white text-2xl font-black italic uppercase tracking-tighter mb-1">${row[0]}</h3>
                    <div class="w-8 h-1 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
                </div>

                <div class="space-y-3 mb-6">
                    <div class="flex justify-between items-end">
                        <span class="text-[9px] text-zinc-600 font-mono italic">// Base</span>
                        <span class="text-xs text-zinc-300 font-bold tracking-tighter">${row[1]}</span>
                    </div>
                    <div class="flex justify-between items-end">
                        <span class="text-[9px] text-zinc-600 font-mono italic">// Sub</span>
                        <span class="text-xs text-zinc-300 font-bold tracking-tighter">${row[2]}</span>
                    </div>
                </div>

                <div class="bg-black/50 p-3 border-l-2 border-yellow-500">
                    <p class="text-[10px] text-yellow-500 font-bold mb-1 uppercase tracking-widest">Skill Performance</p>
                    <p class="text-[11px] text-zinc-400 leading-tight italic tracking-tight">${row[3]}</p>
                </div>

                <div class="absolute top-4 right-4 flex flex-col space-y-1">
                    <div class="w-1 h-1 bg-yellow-500"></div>
                    <div class="w-1 h-4 bg-zinc-800"></div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

init();
