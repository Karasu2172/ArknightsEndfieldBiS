let db;

async function init() {
    try {
        const config = { 
            locateFile: file => `https://sql.js.org/dist/${file}` 
        };
        const SQL = await initSqlJs(config);
        
        let buf;

        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            
            let dbPath = path.join(__dirname, 'data.db');
            if (!fs.existsSync(dbPath)) {
                dbPath = path.join(process.resourcesPath, 'data.db');
            }

            console.log("正在讀取資料庫：", dbPath);
            const data = fs.readFileSync(dbPath);
            buf = data.buffer;
        } else {
            const response = await fetch('./data.db');
            buf = await response.arrayBuffer();
        }

        db = new SQL.Database(new Uint8Array(buf));
        loadTags();
        
    } catch (err) {
        console.error("初始化出錯:", err);
        document.getElementById('result').innerText = "連線失敗: " + err.message;
    }
}

function loadTags() {
    try {
        const res = db.exec("SELECT category, tag_name FROM tags");
        if (!res || res.length === 0) {
            throw new Error("tags is null");
        }

        const allTags = res[0].values;

        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`tag${i}`);
            if (!select) continue;

            select.innerHTML = '<option value="">-- 全部 --</option>';
            
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

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';

    const display = document.getElementById('result');
    const tbody = document.getElementById('result-body');

    if (!db) return;

    try {
        const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
        const res = db.exec(query, [t1, t2, t3]);

        tbody.innerHTML = ""; 

        if (res.length > 0) {
            const rows = res[0].values;
            display.innerText = `DATABASE QUERY: FOUND ${rows.length} MATCHES`;

            rows.forEach(row => {
                const name = row[0];
                const tr = document.createElement('tr');
                
                // 這裡套用了 Tailwind 樣式，讓每一列更具現代感
                tr.className = "group hover:bg-yellow-500/5 transition-all duration-200 border-b border-zinc-800/50";

                const imgPath = `./images/${name}.png`;

                tr.innerHTML = `
                    <td class="p-4 flex justify-center">
                        <div class="relative w-14 h-14 bg-zinc-800 rounded border border-zinc-700 overflow-hidden group-hover:border-yellow-500/50 transition-colors">
                            <img src="${imgPath}" alt="${name}" 
                                 class="w-full h-full object-contain p-1 relative z-10" 
                                 onerror="this.src='./images/default.png';">
                            <div class="absolute top-0 right-0 w-2 h-2 bg-zinc-700 rotate-45 translate-x-1 -translate-y-1"></div>
                        </div>
                    </td>
                    <td class="p-4">
                        <div class="text-white font-bold tracking-tight">${name}</div>
                        <div class="text-[10px] text-zinc-600 uppercase mt-1">Equipment Unit</div>
                    </td>
                    <td class="p-4 text-sm font-medium text-zinc-400">
                        <span class="px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700 group-hover:border-yellow-500/30">${row[1]}</span>
                    </td>
                    <td class="p-4 text-sm font-medium text-zinc-400">
                        <span class="px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700 group-hover:border-yellow-500/30">${row[2]}</span>
                    </td>
                    <td class="p-4 text-sm font-medium text-yellow-600 group-hover:text-yellow-500">
                        ${row[3]}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            display.innerText = "NO MATCHING DATA";
            tbody.innerHTML = '<tr><td colspan="5" class="p-20 text-center text-zinc-700 uppercase tracking-widest text-xs">Access Denied: No Results Found</td></tr>';
        }
    } catch (err) {
        console.error("搜尋過程出錯:", err);
        display.innerText = "ERROR IN DATA RETRIEVAL";
    }
}

function clearSelection() {
    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`tag${i}`);
        if (select) select.value = "";
    }
    search();
}

init();
