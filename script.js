let db;

async function init() {
    const safetyTimer = setTimeout(hidePreloader, 3000); 

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        clearTimeout(safetyTimer);
        hidePreloader();
    } catch (err) {
        console.error("Load Error:", err);
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
        select.innerHTML = '<option value="">-- ALL_UNITS --</option>';
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
        document.getElementById('result-count').innerText = `// DATABASE_ENTRY: ${rows.length} MATCHED`;

        rows.forEach((row, idx) => {
            const card = document.createElement('div');
            card.className = "group bg-white border border-zinc-200 transition-all hover:border-black relative flex flex-col shadow-sm";
            
            card.innerHTML = `
                <div class="bg-[#F6F6F6] aspect-square flex items-center justify-center p-8 relative scan-effect overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                         onerror="this.src='https://placehold.co/400x400/F6F6F6/A1A1AA?text=ENDFIELD'; this.style.opacity=0.3">
                    <div class="absolute top-2 left-2 text-[8px] font-mono text-zinc-300">ID: ${row[0].substring(0,4)}</div>
                </div>

                <div class="p-6 flex-grow flex flex-col">
                    <h3 class="font-black italic text-2xl mb-5 tracking-tighter uppercase border-b-2 border-black pb-2 inline-block">${row[0]}</h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="border-l-2 border-zinc-100 pl-3">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Base</p>
                            <p class="text-base font-black text-black leading-none">${row[1]}</p>
                        </div>
                        <div class="border-l-2 border-zinc-100 pl-3">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Sub</p>
                            <p class="text-base font-black text-black leading-none">${row[2]}</p>
                        </div>
                    </div>

                    <div class="bg-zinc-50 p-4 border-l-4 border-yellow-500 mt-auto group-hover:bg-yellow-50 transition-colors">
                        <p class="text-[9px] text-yellow-600 font-black mb-1 tracking-widest uppercase">// SKILL_LOG</p>
                        <p class="text-[13px] text-zinc-700 italic font-medium leading-relaxed">${row[3]}</p>
                    </div>
                </div>
                <div class="h-1 w-0 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
            `;
            container.appendChild(card);
        });
    }
}

init();
