let db;

async function init() {
    // 設定一個超時強制跳脫，如果 5 秒內沒載入完也強行顯示頁面，避免死屏
    const safetyTimer = setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('exit')) {
            console.warn("Loading took too long, forcing display...");
            hidePreloader();
        }
    }, 5000);

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        // 1. 檢查資料庫是否存在
        const response = await fetch('./data.db');
        if (!response.ok) throw new Error("Database not found");
        
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        
        // 2. 載入成功，清除安全計時器並隱藏 Preloader
        clearTimeout(safetyTimer);
        hidePreloader();

    } catch (err) {
        console.error("Critical Error:", err);
        clearTimeout(safetyTimer);
        hidePreloader(); // 報錯也要顯示頁面，方便除錯
        document.getElementById('result-count').innerText = "// SYSTEM_ERROR: DATA_LOAD_FAILURE";
    }
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('main-content');
    if (preloader) preloader.classList.add('exit');
    if (mainContent) {
        mainContent.classList.replace('opacity-0', 'opacity-100');
        mainContent.classList.remove('translate-y-8');
    }
}

function loadTags() {
    try {
        const res = db.exec("SELECT category, tag_name FROM tags");
        if (!res || res.length === 0) return;
        
        const allTags = res[0].values;
        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`tag${i}`);
            if (!select) continue;
            select.innerHTML = '<option value="">-- NO_FILTER --</option>';
            allTags.filter(t => t[0] === i).forEach(t => {
                select.innerHTML += `<option value="${t[1]}">${t[1]}</option>`;
            });
            select.onchange = search;
        }
        search();
    } catch (e) {
        console.error("Tag loading failed:", e);
    }
}

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';
    const container = document.getElementById('equipment-grid');
    
    try {
        const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
        const res = db.exec(query, [t1, t2, t3]);

        container.innerHTML = "";
        if (res && res.length > 0) {
            const rows = res[0].values;
            document.getElementById('result-count').innerText = `// DATABASE_SYNC_COMPLETE: ${rows.length} UNITS_LOADED`;

            rows.forEach((row, idx) => {
                const card = document.createElement('div');
                card.className = "group bg-white border border-zinc-200 transition-all hover:border-black relative overflow-hidden flex flex-col animate-in";
                card.style.animationDelay = `${idx * 0.03}s`; // 縮短延遲時間，讓出現更流暢

                card.innerHTML = `
                    <div class="bg-[#F6F6F6] aspect-square flex items-center justify-center p-6 relative scan-effect overflow-hidden">
                        <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                             onerror="this.src='https://placehold.co/400x400/F6F6F6/A1A1AA?text=ENDFIELD'; this.style.opacity=0.3">
                    </div>
                    <div class="p-5 flex-grow">
                        <h3 class="font-black italic text-xl mb-3 tracking-tighter uppercase">${row[0]}</h3>
                        <div class="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                            <div class="border-l-2 border-zinc-100 pl-2">
                                <p class="text-[8px] text-zinc-400 font-bold uppercase">Base</p>
                                <p class="font-black">${row[1]}</p>
                            </div>
                            <div class="border-l-2 border-zinc-100 pl-2">
                                <p class="text-[8px] text-zinc-400 font-bold uppercase">Sub</p>
                                <p class="font-black">${row[2]}</p>
                            </div>
                        </div>
                        <div class="bg-zinc-50 p-3 border-l-4 border-yellow-500 group-hover:bg-yellow-50 transition-colors">
                            <p class="text-[10px] text-zinc-600 italic leading-tight">${row[3]}</p>
                        </div>
                    </div>
                    <div class="h-1 w-0 bg-yellow-500 group-hover:w-full transition-all duration-700"></div>
                `;
                container.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Search failed:", e);
    }
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

init();
init();
