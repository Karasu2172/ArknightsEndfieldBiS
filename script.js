let db;

async function init() {
    const safetyTimer = setTimeout(hidePreloader, 3000); // 防卡死

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db'); // 確保路徑正確
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        clearTimeout(safetyTimer);
        hidePreloader();
    } catch (err) {
        console.error("Initialization failed:", err);
        hidePreloader();
    }
}

function hidePreloader() {
    document.getElementById('preloader').classList.add('exit');
    document.getElementById('main-content').classList.replace('opacity-0', 'opacity-100');
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res[0]) return;
    const allTags = res[0].values;
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        select.innerHTML = '<option value="">-- NO_FILTER --</option>';
        allTags.filter(t => t[0] === i).forEach(t => {
            select.innerHTML += `<option value="${t[1]}">${t[1]}</option>`;
        });
        select.onchange = search;
    }
    search();
}

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';
    const container = document.getElementById('equipment-grid');
    
    // 從 products 資料表抓取數據
    const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", [t1, t2, t3]);

    container.innerHTML = "";
    if (res[0]) {
        const rows = res[0].values;
        document.getElementById('result-count').innerText = `// DATABASE_SYNCED: ${rows.length} UNITS_DETECTED`;

        rows.forEach((row, idx) => {
            const card = document.createElement('div');
            // 特大化卡片設計
            card.className = "group bg-white border-2 border-zinc-200 transition-all hover:border-black relative flex flex-col shadow-lg hover:shadow-2xl overflow-hidden";
            
            card.innerHTML = `
                <div class="bg-[#F8F8F8] aspect-square flex items-center justify-center p-12 relative scan-effect overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-110 transition-all duration-700" 
                         onerror="this.src='https://placehold.co/800x800/F8F8F8/CCC?text=ENDFIELD';">
                    <div class="absolute top-4 left-4 text-xs font-mono text-zinc-400 font-bold uppercase tracking-widest">REF_ARC: ${row[0].substring(0,4)}</div>
                </div>

                <div class="p-10 flex-grow flex flex-col">
                    <h3 class="font-black italic text-5xl mb-10 tracking-tighter uppercase border-b-[8px] border-black pb-4 inline-block leading-none">${row[0]}</h3>
                    
                    <div class="grid grid-cols-2 gap-10 mb-12">
                        <div class="border-l-[10px] border-zinc-200 pl-6">
                            <p class="text-xs text-zinc-400 font-black uppercase mb-3 tracking-[0.4em]">Main_Prop</p>
                            <p class="text-3xl font-black text-black leading-none">${row[1]}</p>
                        </div>
                        <div class="border-l-[10px] border-zinc-200 pl-6">
                            <p class="text-xs text-zinc-400 font-black uppercase mb-3 tracking-[0.4em]">Sub_Prop</p>
                            <p class="text-3xl font-black text-black leading-none">${row[2]}</p>
                        </div>
                    </div>

                    <div class="bg-black p-8 border-l-[20px] border-yellow-500 mt-auto">
                        <div class="flex items-center mb-4">
                            <span class="w-3 h-3 bg-yellow-500 mr-3 animate-pulse"></span>
                            <p class="text-xs text-yellow-500 font-black tracking-[0.5em] uppercase font-mono">// SYSTEM_SKILL_LOG</p>
                        </div>
                        <p class="text-[22px] text-white italic font-bold leading-relaxed tracking-tight">
                            ${row[3]}
                        </p>
                    </div>
                </div>
                
                <div class="h-4 w-0 bg-yellow-500 group-hover:w-full transition-all duration-1000"></div>
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
