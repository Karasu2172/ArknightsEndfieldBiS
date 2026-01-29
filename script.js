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
            const data = fs.readFileSync(dbPath);
            buf = data.buffer;
        } else {
            const response = await fetch('./data.db');
            buf = await response.arrayBuffer();
        }

        db = new SQL.Database(new Uint8Array(buf));
        loadTags();
        
    } catch (err) {
        console.error("Init Error:", err);
        document.getElementById('result').innerText = "CONNECTION_FAILED: " + err.message;
    }
}

function loadTags() {
    try {
        const res = db.exec("SELECT category, tag_name FROM tags");
        if (!res || res.length === 0) throw new Error("tags is null");

        const allTags = res[0].values;
        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`tag${i}`);
            if (!select) continue;

            select.innerHTML = '<option value="">ALL</option>';
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
        console.error("Load Tags Error:", err);
    }
}

function search() {
    const t1 = document.getElementById('tag1').value || '%';
    const t2 = document.getElementById('tag2').value || '%';
    const t3 = document.getElementById('tag3').value || '%';

    const display = document.getElementById('result');
    const grid = document.getElementById('result-grid');

    if (!db) return;

    try {
        const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
        const res = db.exec(query, [t1, t2, t3]);

        grid.innerHTML = ""; 

        if (res.length > 0) {
            const rows = res[0].values;
            display.innerText = `// DATA_LOG: ${rows.length} UNITS_SYNCED`;

            rows.forEach(row => {
                const name = row[0];
                const imgPath = `./images/${name}.png`;
                
                const card = document.createElement('div');
                card.className = "bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex flex-col group hover:border-yellow-500 transition-all duration-300 shadow-lg";

                card.innerHTML = `
                    <div class="aspect-square bg-white flex items-center justify-center p-3 relative overflow-hidden">
                        <img src="${imgPath}" alt="${name}" 
                             class="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500" 
                             onerror="this.src='./images/default.png';">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-200 to-transparent opacity-50"></div>
                    </div>
                    
                    <div class="p-3 bg-zinc-900 flex-grow border-t border-zinc-800">
                        <div class="text-white font-black text-xs truncate mb-2 italic tracking-tighter uppercase border-b border-zinc-800 pb-1">
                            ${name}
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2 mb-3">
                            <div>
                                <span class="text-[8px] text-zinc-600 block leading-none mb-1 font-bold">BASE</span>
                                <span class="text-[10px] text-zinc-400 block truncate font-medium">${row[1]}</span>
                            </div>
                            <div>
                                <span class="text-[8px] text-zinc-600 block leading-none mb-1 font-bold">SUB</span>
                                <span class="text-[10px] text-zinc-400 block truncate font-medium">${row[2]}</span>
                            </div>
                        </div>

                        <div class="bg-zinc-800/40 p-2 rounded-sm border-l-2 border-yellow-600 shadow-inner">
                            <span class="text-[7px] text-yellow-600 block font-mono mb-1 tracking-tighter">// SKILL_EFFECT</span>
                            <span class="text-[10px] text-yellow-500 font-bold leading-tight block">${row[3]}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            display.innerText = "// NO_MATCHING_UNITS_FOUND";
            grid.innerHTML = '<div class="col-span-full py-20 text-center text-zinc-700 text-xs tracking-[0.3em] uppercase">Search_Denied: 0_Matches</div>';
        }
    } catch (err) {
        console.error("Search Error:", err);
        display.innerText = "// PROTOCOL_ERROR";
    }
}

function clearSelection() {
    ['tag1', 'tag2', 'tag3'].forEach(id => document.getElementById(id).value = "");
    search();
}

init();
