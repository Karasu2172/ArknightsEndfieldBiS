let db;

async function init() {
    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        // 增加時間戳防緩存
        const response = await fetch(`./data.db?t=${Date.now()}`);
        if (!response.ok) throw new Error("Database file not found");
        
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        loadTags();
        
        // 確保 Preloader 至少運行 1.5 秒以展示動畫
        setTimeout(() => {
            document.getElementById('preloader').classList.add('exit');
            document.getElementById('main-content').classList.replace('opacity-0', 'opacity-100');
        }, 1500);

    } catch (err) {
        console.error("Critical Error:", err);
        // 如果報錯，強行隱藏 Preloader 以免死屏
        document.getElementById('preloader').style.display = 'none';
        document.body.innerHTML += `<div style="color:red; text-align:center; padding-top:100px;">Initialization Error: ${err.message}</div>`;
    }
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
    
    const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
    const res = db.exec(query, [t1, t2, t3]);

    container.innerHTML = "";
    if (res[0]) {
        const rows = res[0].values;
        document.getElementById('result-count').innerText = `// DATABASE_SYNC_COMPLETE: ${rows.length} UNITS_LOADED`;

        rows.forEach((row, idx) => {
            const card = document.createElement('div');
            // 復刻官網卡片：圖片灰底、懸停掃描、底部黃條
            card.className = "group bg-white border border-zinc-200 transition-all hover:border-black relative overflow-hidden flex flex-col";
            card.style.animation = `cardIn 0.6s ease-out forwards ${idx * 0.05}s`;
            card.style.opacity = 0;

            card.innerHTML = `
                <div class="bg-[#F6F6F6] aspect-square flex items-center justify-center p-6 relative scan-effect overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                         onerror="this.src='https://placehold.co/400x400/F6F6F6/A1A1AA?text=ENDFIELD'; this.style.opacity=0.3">
                    <div class="absolute top-2 left-2 text-[8px] font-mono text-zinc-300">ID: ${row[0].substring(0,4)}_ARC</div>
                </div>
                <div class="p-5 flex-grow border-t border-zinc-50">
                    <h3 class="font-black italic text-xl mb-3 tracking-tighter uppercase">${row[0]}</h3>
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <div class="border-l-2 border-zinc-100 pl-2">
                            <p class="text-[8px] text-zinc-400 font-bold uppercase">Main</p>
                            <p class="text-[11px] font-black">${row[1]}</p>
                        </div>
                        <div class="border-l-2 border-zinc-100 pl-2">
                            <p class="text-[8px] text-zinc-400 font-bold uppercase">Sub</p>
                            <p class="text-[11px] font-black">${row[2]}</p>
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
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

// 注入進場動畫
const css = document.createElement('style');
css.innerHTML = `@keyframes cardIn { from { opacity:0; transform:translateY(15px) } to { opacity:1; transform:translateY(0) } }`;
document.head.appendChild(css);

init();
