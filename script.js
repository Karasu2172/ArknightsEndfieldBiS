let db;

async function init() {
    const safetyTimer = setTimeout(hidePreloader, 3000); // 3秒保險絲

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db'); //
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
        select.innerHTML = '<option value="">-- ALL_DATA --</option>';
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
        document.getElementById('result-count').innerText = `// DATABASE_SYNCED: ${rows.length} UNITS_DETECTED`;

        rows.forEach((row, idx) => {
            const card = document.createElement('div');
            card.className = "group bg-white border-2 border-zinc-100 transition-all hover:border-black relative flex flex-col shadow-sm hover:shadow-2xl";
            card.innerHTML = `
                <div class="bg-[#F8F8F8] aspect-square flex items-center justify-center p-10 relative scan-effect overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-110 transition-all duration-700" 
                         onerror="this.src='https://placehold.co/600x600/F8F8F8/CCC?text=ENDFIELD';">
                </div>
                <div class="p-10 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 class="font-black italic text-4xl mb-8 tracking-tighter uppercase border-b-[6px] border-black pb-3 inline-block leading-none">${row[0]}</h3>
                        <div class="grid grid-cols-2 gap-8 mb-10">
                            <div class="border-l-[6px] border-zinc-200 pl-4">
                                <p class="text-xs text-zinc-400 font-black uppercase mb-2">Main_Prop</p>
                                <p class="text-2xl font-black text-black leading-none">${row[1]}</p>
                            </div>
                            <div class="border-l-[6px] border-zinc-200 pl-4">
                                <p class="text-xs text-zinc-400 font-black uppercase mb-2">Sub_Prop</p>
                                <p class="text-2xl font-black text-black leading-none">${row[2]}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-zinc-950 p-6 border-l-[16px] border-yellow-500">
                        <p class="text-xs text-yellow-500 font-black mb-3 tracking-[0.4em]">// SYSTEM_SKILL</p>
                        <p class="text-lg text-white italic font-bold leading-relaxed">${row[3]}</p>
                    </div>
                </div>
                <div class="h-3 w-0 bg-yellow-500 group-hover:w-full transition-all duration-700"></div>
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
