let db;
let currentFilters = ["", "", ""];

async function init() {
    const progress = document.getElementById('loader-progress');
    try {
        progress.style.width = '40%';
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        progress.style.width = '100%';
        setTimeout(() => {
            document.getElementById('loader').classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
            renderCustomTags();
            search();
        }, 600);
    } catch (err) { console.error(err); }
}

// 徹底解決藍色選單：自定義下拉清單渲染
function renderCustomTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res.length) return;
    const allTags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const optionsContainer = document.getElementById(`options${i}`);
        optionsContainer.innerHTML = `<div class="ef-option font-bold text-zinc-400" onclick="selectOption(${i}, '', '-- SELECT --')">ALL</div>`;
        
        allTags.filter(tag => tag[0] === i).forEach(tag => {
            const div = document.createElement('div');
            div.className = "ef-option";
            div.innerText = tag[1];
            div.onclick = (e) => {
                e.stopPropagation();
                selectOption(i, tag[1], tag[1]);
            };
            optionsContainer.appendChild(div);
        });
    }
}

function toggleOptions(id) {
    const opt = document.getElementById(`options${id}`);
    const isOpen = opt.style.display === 'block';
    // 關閉所有其他選單
    document.querySelectorAll('.ef-options').forEach(el => el.style.display = 'none');
    opt.style.display = isOpen ? 'none' : 'block';
}

function selectOption(category, value, text) {
    currentFilters[category-1] = value;
    document.getElementById(`selected${category}`).innerText = text;
    document.getElementById(`options${category}`).style.display = 'none';
    search();
}

// 點擊外部關閉選單
window.onclick = function(e) {
    if (!e.target.closest('.ef-select-container')) {
        document.querySelectorAll('.ef-options').forEach(el => el.style.display = 'none');
    }
};

function search() {
    const grid = document.getElementById('result-grid');
    const t = currentFilters.map(v => v || '%');

    try {
        const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", t);
        grid.innerHTML = "";
        if (res.length > 0) {
            const rows = res[0].values;
            document.getElementById('result-status').innerText = `// DATABASE_FOUND: ${rows.length}_OBJECTS`;
            rows.forEach((row, index) => {
                const card = document.createElement('div');
                card.className = "gear-card animate__animated animate__fadeInUp";
                card.style.animationDelay = `${index * 0.03}s`;
                card.innerHTML = `
                    <div class="aspect-square bg-[#f9f9f9] p-4 md:p-8 flex items-center justify-center overflow-hidden relative group">
                        <img src="./images/${row[0]}.png" class="gear-img w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out" onerror="this.src='./images/default.png';">
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-zinc-100 group-hover:bg-yellow-400 transition-colors"></div>
                    </div>
                    <div class="p-3 md:p-5">
                        <h3 class="gear-name font-black italic text-sm md:text-base tracking-tighter uppercase mb-4 truncate border-l-2 border-black pl-2">${row[0]}</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-baseline border-b border-zinc-50 pb-1">
                                <span class="text-[8px] font-black text-zinc-300 uppercase italic">Main</span>
                                <span class="text-[11px] md:text-xs font-bold text-zinc-700">${row[1]}</span>
                            </div>
                            <div class="flex justify-between items-baseline border-b border-zinc-50 pb-1">
                                <span class="text-[8px] font-black text-zinc-300 uppercase italic">Sub</span>
                                <span class="text-[11px] md:text-xs font-bold text-zinc-700">${row[2]}</span>
                            </div>
                            <div class="mt-4">
                                <span class="text-[7px] font-black text-yellow-500 uppercase tracking-widest leading-none">// EFFECT</span>
                                <p class="text-[10px] md:text-[11px] text-zinc-500 font-medium leading-snug mt-1 line-clamp-2 h-8 italic">${row[3]}</p>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (e) { console.error(e); }
}

function clearSelection() {
    currentFilters = ["", "", ""];
    for(let i=1; i<=3; i++) document.getElementById(`selected${i}`).innerText = '-- SELECT --';
    search();
}

init();
