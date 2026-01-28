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

        // 在資料庫和標籤載入完畢後觸發頁面顯示
        document.body.classList.add('loaded');
        document.getElementById('preloader').classList.add('hidden');
        document.getElementById('main-content').classList.remove('opacity-0', 'translate-y-8');

    } catch (err) {
        console.error("Initialization Failed:", err);
        document.getElementById('result-count').innerText = "// SYSTEM_ERROR: DATA_LOAD_FAILURE";
        document.body.classList.add('loaded'); // 即使失敗也顯示頁面
        document.getElementById('preloader').classList.add('hidden');
        document.getElementById('main-content').classList.remove('opacity-0', 'translate-y-8');
    }
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    const allTags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        select.innerHTML = '<option value="">// ALL_UNITS</option>'; // 官網風格選項
        allTags.filter(t => t[0] === i).forEach(t => {
            select.innerHTML += `<option value="${t[1]}">${t[1]}</option>`;
        });
        select.onchange = search;
    }
    search(); // 初始載入時顯示所有結果
}

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';
    const container = document.getElementById('equipment-grid');
    
    const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
    const res = db.exec(query, [t1, t2, t3]);

    container.innerHTML = ""; // 清空舊的卡片
    if (res.length > 0) {
        const rows = res[0].values;
        document.getElementById('result-count').innerText = `// DATABASE_ENTRY: ${rows.length} MATCHES FOUND`;

        rows.forEach((row, index) => {
            const card = document.createElement('div');
            // 官網卡片風格：純白背景、極細邊框、底部黃色進度條裝飾
            card.className = "bg-white border border-zinc-200 group hover:border-black transition-all duration-300 flex flex-col relative overflow-hidden";
            card.style.animation = `cardFadeIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards ${index * 0.08}s`; // staggered reveal
            card.style.opacity = 0; // Initial state for animation

            card.innerHTML = `
                <div class="bg-zinc-50 aspect-square flex items-center justify-center p-8 relative overflow-hidden">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" onerror="this.src='./images/default.png'; this.style.opacity=0.1;">
                    <div class="absolute top-2 left-2 text-[8px] font-mono italic text-zinc-300 uppercase">DATA_REF: ${index + 1}</div>
                </div>

                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-black text-2xl font-black italic uppercase tracking-tighter mb-4 border-b-2 border-transparent group-hover:border-yellow-500 transition-all inline-block leading-none">
                        ${row[0]}
                    </h3>

                    <div class="space-y-3 mb-6 flex-grow">
                        <div class="flex justify-between items-center text-[11px] font-bold uppercase border-b border-zinc-100 pb-2">
                            <span class="text-zinc-400 font-mono tracking-wide">// MAIN_PROP</span>
                            <span class="text-black">${row[1]}</span>
                        </div>
                        <div class="flex justify-between items-center text-[11px] font-bold uppercase border-b border-zinc-100 pb-2">
                            <span class="text-zinc-400 font-mono tracking-wide">// SUB_PROP</span>
                            <span class="text-black">${row[2]}</span>
                        </div>
                    </div>

                    <div class="bg-zinc-50 p-4 border-l-4 border-black group-hover:bg-yellow-500/10 transition-colors">
                        <p class="text-[10px] text-yellow-600 font-bold uppercase mb-1 tracking-widest">// EFFECT_DETAIL</p>
                        <p class="text-[11px] text-zinc-700 italic leading-relaxed tracking-tight">${row[3]}</p>
                    </div>
                </div>
                
                <div class="h-1.5 w-0 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
            `;
            container.appendChild(card);
        });
    } else {
        document.getElementById('result-count').innerText = "// WARNING: NO_DATA_MATCHES_FOUND";
    }
}

function clearSelection() {
    document.querySelectorAll('select').forEach(s => s.value = "");
    search();
}

// 注入卡片進場動畫 CSS
const style = document.createElement('style');
style.innerHTML = `@keyframes cardFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

init();
