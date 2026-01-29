let db;

async function init() {
    const safetyTimer = setTimeout(hidePreloader, 2500); 

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        // 從根目錄載入 data.db
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        clearTimeout(safetyTimer);
        hidePreloader();
    } catch (err) {
        console.error("Init Error:", err);
        hidePreloader();
    }
}

function hidePreloader() {
    const pre = document.getElementById('preloader');
    const main = document.getElementById('main-content');
    if (pre) pre.classList.add('exit');
    if (main) main.classList.replace('opacity-0', 'opacity-100');
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res[0]) return;
    const allTags = res[0].values;
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag` + i);
        // 設定初始選項，使用全大寫增加工業感
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
    const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", [t1, t2, t3]);

    container.innerHTML = "";
    if (res[0]) {
        const rows = res[0].values;
        document.getElementById('result-count').innerText = `// DATA_LOG: ${rows.length} UNITS_SYNCED`;

        rows.forEach((row) => {
            const card = document.createElement('div');
            card.className = "group bg-white border border-zinc-100 transition-all hover:border-zinc-400 relative flex flex-col shadow-sm";
            
            card.innerHTML = `
                <div class="bg-[#F9F9F9] aspect-square flex items-center justify-center p-6 relative scan-effect overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                         onerror="this.src='https://placehold.co/400x400/F9F9F9/DDD?text=ENDFIELD'; this.style.opacity=0.2">
                    <div class="absolute top-1.5 left-1.5 text-[7px] font-mono text-zinc-300 tracking-tighter">ARC_${row[0].substring(0,3)}</div>
                </div>

                <div class="p-5 flex-grow flex flex-col">
                    <h3 class="font-black italic text-xl mb-4 tracking-tighter uppercase border-b border-black pb-1 inline-block leading-none">${row[0]}</h3>
                    
                    <div class="grid grid-cols-2 gap-3 mb-5">
                        <div class="border-l border-zinc-200 pl-2">
                            <p class="text-[8px] text-zinc-400 font-bold uppercase mb-0.5 tracking-tighter">Base</p>
                            <p class="text-[13px] font-bold text-black leading-tight">${row[1]}</p>
                        </div>
                        <div class="border-l border-zinc-200 pl-2">
                            <p class="text-[8px] text-zinc-400 font-bold uppercase mb-0.5 tracking-tighter">Sub</p>
                            <p class="text-[13px] font-bold text-black leading-tight">${row[2]}</p>
                        </div>
                    </div>

                    <div class="bg-[#FAFAFA] p-3 border-l-2 border-yellow-500 mt-auto group-hover:bg-yellow-50/50 transition-colors">
                        <p class="text-[8px] text-yellow-600 font-black mb-1 tracking-widest uppercase">// SKILL_EFFECT</p>
                        <p class="text-[12px] text-zinc-600 italic font-medium leading-snug">${row[3]}</p>
                    </div>
                </div>
                <div class="h-[2px] w-0 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
            `;
            container.appendChild(card);
        });
    }
}

function clearSelection() {
    document.getElementById('tag1').value = "";
    document.getElementById('tag2').value = "";
    document.getElementById('tag3').value = "";
    search();
}

init();
