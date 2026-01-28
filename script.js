let db;

async function init() {
    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        console.log("Terminal Sync Complete.");
    } catch (err) {
        console.error("Initialization Failed:", err);
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
        document.getElementById('result-count').innerText = `// DATABASE_ENTRY: ${rows.length} MATCHES FOUND`;

        rows.forEach((row, index) => {
            const card = document.createElement('div');
            card.className = "bg-white border border-zinc-200 p-0 hover:border-black transition-all duration-500 group relative flex flex-col";
            card.style.animation = `cardFadeIn 0.5s ease forwards ${index * 0.05}s`;
            card.style.opacity = 0;

            card.innerHTML = `
                <div class="bg-[#F8F8F8] aspect-square flex items-center justify-center p-8 relative overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" onerror="this.src='./images/default.png'; this.style.opacity=0.2">
                    <div class="absolute top-2 left-2 text-[8px] text-zinc-300 font-mono italic tracking-tighter uppercase font-bold">Data_Ref: 0${index}</div>
                </div>

                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-black text-2xl font-black italic uppercase tracking-tighter mb-4 border-b-2 border-transparent group-hover:border-yellow-500 transition-all inline-block">
                        ${row[0]}
                    </h3>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="border-l border-zinc-200 pl-2">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Main</p>
                            <p class="text-xs text-black font-black uppercase tracking-tight">${row[1]}</p>
                        </div>
                        <div class="border-l border-zinc-200 pl-2">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Sub</p>
                            <p class="text-xs text-black font-black uppercase tracking-tight">${row[2]}</p>
                        </div>
                    </div>

                    <div class="bg-zinc-50 p-3 mt-auto border border-zinc-100 group-hover:bg-yellow-500/5 transition-colors">
                        <p class="text-[10px] text-yellow-600 font-black uppercase mb-1 tracking-widest">Skill Performance</p>
                        <p class="text-[11px] text-zinc-500 italic leading-relaxed tracking-tight">${row[3]}</p>
                    </div>
                </div>
                
                <div class="h-1.5 w-0 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
            `;
            container.appendChild(card);
        });
    }
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

const style = document.createElement('style');
style.innerHTML = `@keyframes cardFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

init();
