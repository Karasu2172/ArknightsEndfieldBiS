let db;

async function init() {
    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        loadTags();
    } catch (err) { console.error(err); }
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    const allTags = res[0].values;
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        select.innerHTML = '<option value="">-- SELECT --</option>';
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
        document.getElementById('result-count').innerText = `// DATA_LOG: ${rows.length} UNITS SYNCED`;

        rows.forEach((row) => {
            const card = document.createElement('div');
            // 官網卡片風格：純白背景、細邊框、懸停黃色底影
            card.className = "bg-white border border-zinc-200 p-6 group hover:border-black transition-all duration-300 relative overflow-hidden flex flex-col";
            
            card.innerHTML = `
                <div class="w-full aspect-square bg-[#F9F9F9] flex items-center justify-center mb-8 relative group-hover:bg-white transition-colors">
                    <img src="./images/${row[0]}.png" class="w-3/4 h-3/4 object-contain transition-transform duration-700 group-hover:scale-105" onerror="this.src='./images/default.png'; this.style.opacity=0.1">
                    <div class="absolute top-0 left-0 w-full h-full border-2 border-transparent group-hover:border-yellow-500/10 pointer-events-none"></div>
                </div>

                <div class="mb-6">
                    <h3 class="text-black text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">${row[0]}</h3>
                    <div class="w-12 h-1 bg-yellow-500"></div>
                </div>

                <div class="space-y-4 mb-8 flex-grow">
                    <div class="flex flex-col border-b border-zinc-100 pb-2">
                        <span class="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-widest leading-none mb-1">Main Property</span>
                        <span class="text-sm text-black font-black uppercase tracking-tighter">${row[1]}</span>
                    </div>
                    <div class="flex flex-col border-b border-zinc-100 pb-2">
                        <span class="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-widest leading-none mb-1">Sub Property</span>
                        <span class="text-sm text-black font-black uppercase tracking-tighter">${row[2]}</span>
                    </div>
                </div>

                <div class="bg-zinc-50 p-4 border-l-4 border-black group-hover:bg-yellow-500/5 transition-colors">
                    <p class="text-[10px] text-zinc-500 font-black uppercase mb-1 tracking-widest">Effect Description</p>
                    <p class="text-[11px] text-zinc-700 leading-relaxed italic">${row[3]}</p>
                </div>

                <div class="absolute top-2 right-2 flex space-x-1 opacity-20">
                    <div class="w-1.5 h-1.5 bg-black"></div>
                    <div class="w-1.5 h-1.5 bg-yellow-500"></div>
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
