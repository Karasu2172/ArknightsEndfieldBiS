let db;

async function init() {
    const loaderBar = document.getElementById('loader-bar');
    try {
        loaderBar.style.width = '30%';
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        loaderBar.style.width = '60%';
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();

        db = new SQL.Database(new Uint8Array(buf));
        loaderBar.style.width = '100%';
        
        // 模擬延遲增加儀式感
        setTimeout(() => {
            document.getElementById('loader').classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
            loadTags();
            search(); // 初始加載全部
        }, 800);
        
    } catch (err) {
        console.error(err);
        document.getElementById('result').innerText = "SYSTEM_ERROR_SYNC_FAILED";
    }
}

function loadTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (res.length > 0) {
        const allTags = res[0].values;
        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`tag${i}`);
            select.innerHTML = `<option value="">-- ${['SELECT', 'SELECT', 'SELECT'][i-1]} --</option>`;
            allTags.filter(tag => tag[0] === i).forEach(tag => {
                let opt = document.createElement('option');
                opt.value = tag[1]; opt.innerText = tag[1];
                select.appendChild(opt);
            });
            select.onchange = search;
        }
    }
}

function search() {
    const t = [1,2,3].map(i => document.getElementById(`tag${i}`).value || '%');
    const grid = document.getElementById('result-grid');
    const display = document.getElementById('result');

    try {
        const query = "SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?";
        const res = db.exec(query, t);

        grid.innerHTML = ""; 
        if (res.length > 0) {
            const rows = res[0].values;
            display.innerText = `// ACCESS_GRANTED: ${rows.length}_OBJECTS_FOUND`;

            rows.forEach((row, index) => {
                const name = row[0];
                const card = document.createElement('div');
                // 交錯進場動畫
                card.className = "gear-card animate__animated animate__fadeInUp";
                card.style.animationDelay = `${index * 0.05}s`;

                card.innerHTML = `
                    <div class="aspect-square bg-gray-50 flex items-center justify-center p-6 group">
                        <img src="./images/${name}.png" class="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" onerror="this.src='./images/default.png';">
                    </div>
                    <div class="p-4 bg-white border-t border-gray-100">
                        <h3 class="gear-name font-black italic text-sm tracking-tighter uppercase border-l-2 border-yellow-400 pl-2 mb-4">${name}</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-[8px] font-bold text-zinc-400 uppercase">Base</span>
                                <span class="stat-text text-[12px] font-medium text-zinc-800">${row[1]}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[8px] font-bold text-zinc-400 uppercase">Sub</span>
                                <span class="stat-text text-[12px] font-medium text-zinc-800">${row[2]}</span>
                            </div>
                            <div class="mt-4 pt-3 border-t border-dotted border-gray-200">
                                <span class="text-[7px] font-black text-yellow-600 uppercase tracking-tighter italic">// Skill_Protocol</span>
                                <p class="stat-text text-[11px] text-zinc-500 font-medium leading-tight mt-1 h-8 line-clamp-2 italic">${row[3]}</p>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) { console.error(err); }
}

function clearSelection() {
    [1,2,3].forEach(i => document.getElementById(`tag${i}`).value = "");
    search();
}

init();
