let db;

async function init() {
    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        console.log("Terminal Online.");
    } catch (err) {
        document.getElementById('result-count').innerText = "SYSTEM ERROR: " + err.message;
    }
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    const allTags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        select.innerHTML = `<option value="">-- NO SELECT --</option>`;
        allTags.filter(tag => tag[0] === i).forEach(tag => {
            select.innerHTML += `<option value="${tag[1]}">${tag[1]}</option>`;
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
        document.getElementById('result-count').innerText = `// SCAN RESULTS: ${rows.length} UNITS IDENTIFIED`;

        rows.forEach((row, index) => {
            const card = document.createElement('div');
            // 官網卡片風格：深灰色邊框與懸停黃色發光
            card.className = "group relative bg-zinc-900 border border-zinc-800 p-1 hover:border-yellow-500 transition-all duration-500";
            card.style.animation = `fadeUp 0.6s ease-out forwards ${index * 0.05}s`;
            card.style.opacity = 0;

            card.innerHTML = `
                <div class="bg-black p-4 h-full relative overflow-hidden">
                    <div class="scan-overlay opacity-0 group-hover:opacity-100"></div>
                    
                    <div class="relative w-full h-48 mb-6 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                        <img src="./images/${row[0]}.png" class="w-32 h-32 object-contain z-10 filter brightness-90 group-hover:brightness-110 group-hover:scale-110 transition-all duration-700" onerror="this.src='./images/default.png'; this.style.opacity=0.2">
                        <div class="absolute top-2 left-2 text-[8px] text-zinc-700 font-mono tracking-tighter">IMG_DATA_REF_${index}</div>
                    </div>

                    <div class="mb-4">
                        <div class="text-xs text-yellow-500 font-mono mb-1 tracking-widest font-bold">DEVICE_NAME</div>
                        <h3 class="text-white text-xl font-black italic uppercase tracking-tighter truncate">${row[0]}</h3>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-4 border-y border-zinc-800 py-3">
                        <div>
                            <p class="text-[8px] text-zinc-500 font-mono mb-1 uppercase tracking-widest">Base</p>
                            <p class="text-xs text-zinc-300 font-bold">${row[1]}</p>
                        </div>
                        <div>
                            <p class="text-[8px] text-zinc-500 font-mono mb-1 uppercase tracking-widest">Sub</p>
                            <p class="text-xs text-zinc-300 font-bold">${row[2]}</p>
                        </div>
                    </div>

                    <div>
                        <p class="text-[8px] text-yellow-500 font-mono mb-1 uppercase tracking-widest">Core Function</p>
                        <p class="text-[11px] text-zinc-400 leading-tight">${row[3]}</p>
                    </div>

                    <div class="absolute bottom-1 right-1 flex space-x-0.5">
                        <div class="w-1 h-1 bg-yellow-500"></div>
                        <div class="w-1 h-1 bg-zinc-700"></div>
                        <div class="w-1 h-1 bg-zinc-700"></div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        document.getElementById('result-count').innerText = "// NO DATA DETECTED IN SECTOR";
    }
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

init();

// CSS Animation (Inject via JS or keep in HTML)
const style = document.createElement('style');
style.innerHTML = `@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);
