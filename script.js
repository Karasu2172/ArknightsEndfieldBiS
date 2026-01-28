let db;

// 1. 初始化資料庫
async function init() {
    try {
        const config = { 
            locateFile: file => `https://sql.js.org/dist/${file}` 
        };
        const SQL = await initSqlJs(config);
        
        let buf;

        // 判斷是在瀏覽器還是 Node/Electron 環境
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            
            let dbPath = path.join(__dirname, 'data.db');
            if (!fs.existsSync(dbPath)) {
                dbPath = path.join(process.resourcesPath, 'data.db');
            }
            const data = fs.readFileSync(dbPath);
            buf = data.buffer;
        } else {
            const response = await fetch('./data.db');
            buf = await response.arrayBuffer();
        }

        db = new SQL.Database(new Uint8Array(buf));
        loadTags();
        console.log("Database initialized successfully.");
        
    } catch (err) {
        console.error("初始化出錯:", err);
        const resultEl = document.getElementById('result-count');
        if (resultEl) resultEl.innerText = "連線失敗: " + err.message;
    }
}

// 2. 載入下拉選單標籤
function loadTags() {
    try {
        const res = db.exec("SELECT category, tag_name FROM tags");
        if (!res || res.length === 0) throw new Error("Tags data is missing.");

        const allTags = res[0].values;

        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`tag${i}`);
            if (!select) continue;

            select.innerHTML = '<option value="">-- 全部屬性 --</option>';
            
            const filtered = allTags.filter(tag => tag[0] === i);
            filtered.forEach(tag => {
                const opt = document.createElement('option');
                opt.value = tag[1];
                opt.innerText = tag[1];
                select.appendChild(opt);
            });

            select.onchange = search;
        }
    } catch (err) {
        console.error("載入屬性失敗:", err);
    }
}

// 3. 執行搜尋並渲染美化卡片
function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';

    // 注意：這裡對應我給你的 HTML 結構中的 equipment-grid
    const container = document.getElementById('equipment-grid');
    const countDisplay = document.getElementById('result-count');

    if (!db || !container) return;

    try {
        const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
        const res = db.exec(query, [t1, t2, t3]);

        container.innerHTML = ""; 

        if (res.length > 0) {
            const rows = res[0].values;
            countDisplay.innerText = `// 掃描完成: 發現 ${rows.length} 個匹配項目`;

            rows.forEach((row, index) => {
                const name = row[0];
                const card = document.createElement('div');
                
                // Tailwind 樣式：深色背景、黃色 hover 邊框、進場動畫
                card.className = "bg-zinc-900 border border-zinc-800 p-4 relative group hover:border-yellow-500 transition-all duration-300 opacity-0 transform translate-y-4";
                
                // 使用 JS 觸發 CSS 動畫延遲，產生一個接一個出現的效果
                card.style.animation = `fadeUp 0.4s ease forwards ${index * 0.05}s`;

                const imgPath = `./images/${name}.png`;

                card.innerHTML = `
                    <div class="relative w-full h-40 bg-black/40 mb-4 flex items-center justify-center overflow-hidden border border-zinc-800 group-hover:border-yellow-500/30">
                        <img src="${imgPath}" alt="${name}" 
                             class="w-28 h-28 object-contain group-hover:scale-110 transition-transform duration-500 relative z-10"
                             onerror="this.src='./images/default.png'; this.style.opacity='0.2'">
                        <div class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" 
                             style="background-image: radial-gradient(#fff 1px, transparent 0); background-size: 10px 10px;"></div>
                    </div>
                    
                    <h3 class="text-white font-bold text-lg mb-3 truncate border-l-2 border-yellow-500 pl-2">${name}</h3>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-zinc-500 uppercase tracking-tighter">基礎</span>
                            <span class="text-xs text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">${row[1]}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-zinc-500 uppercase tracking-tighter">附加</span>
                            <span class="text-xs text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">${row[2]}</span>
                        </div>
                        <div class="flex justify-between items-center border-t border-zinc-800 pt-2 mt-2">
                            <span class="text-[10px] text-yellow-600 uppercase font-bold">技能屬性</span>
                            <span class="text-xs text-yellow-500 font-bold">${row[3]}</span>
                        </div>
                    </div>
                    
                    <div class="absolute top-0 right-0 w-2 h-2 bg-zinc-800 group-hover:bg-yellow-500 transition-colors" style="clip-path: polygon(100% 0, 0 0, 100% 100%);"></div>
                `;
                container.appendChild(card);
            });
        } else {
            countDisplay.innerText = "// 無相符數據";
            container.innerHTML = `
                <div class="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-lg">
                    <p class="text-zinc-600 uppercase tracking-widest text-sm italic text-zinc-500">No data detected in sector</p>
                </div>`;
        }
    } catch (err) {
        console.error("搜尋過程出錯:", err);
        countDisplay.innerText = "搜尋發生錯誤。";
    }
}

// 4. 重置選擇
function clearSelection() {
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag1`); // 這裡原代碼可能有誤，修正為 tag${i}
        const currentSelect = document.getElementById(`tag${i}`);
        if (currentSelect) currentSelect.value = "";
    }
    search();
}

// 啟動程式
init();
