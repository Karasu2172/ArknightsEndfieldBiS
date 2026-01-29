let db;
let selectedTags = ["", "", ""];

// 初始化系統
async function init() {
    const bar = document.getElementById('boot-progress');
    try {
        bar.style.width = '30%';
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        const res = await fetch('./data.db');
        const buf = await res.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        bar.style.width = '100%';
        setTimeout(() => {
            const screen = document.getElementById('boot-screen');
            screen.classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => screen.style.display = 'none', 500);
            renderDrops();
            search();
        }, 800);
    } catch (e) { console.error(e); }
}

// 鼠標交互光暈邏輯
document.addEventListener('mousemove', (e) => {
    const glow = document.getElementById('cursor-glow');
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
});

// 構建自定義選單
function renderDrops() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res.length) return;
    const tags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const menu = document.getElementById(`menu-${i}`);
        menu.innerHTML = `<div class="ef-drop-item italic text-zinc-300" onclick="selectTag(${i}, '', '-- SELECT --')">ALL_UNITS</div>`;
        
        tags.filter(t => t[0] === i).forEach(t => {
            const item = document.createElement('div');
            item.className = "ef-drop-item";
            item.innerText = t[1];
            item.onclick = (e) => {
                e.stopPropagation();
                selectTag(i, t[1], t[1]);
            };
            menu.appendChild(item);
        });
    }
}

function toggleDrop(id) {
    const menu = document.getElementById(`menu-${id}`);
    const container = menu.parentElement;
    const isOpen = menu.style.display === 'block';
    
    document.querySelectorAll('.ef-drop-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.ef-drop-container').forEach(c => c.classList.remove('active'));
    
    if (!isOpen) {
        menu.style.display = 'block';
        container.classList.add('active');
        menu.classList.add('animate__animated', 'animate__fadeIn');
    }
}

function selectTag(cat, val, txt) {
    selectedTags[cat-1] = val;
    document.getElementById(`val-${cat}`).innerText = txt;
    document.getElementById(`menu-${cat}`).style.display = 'none';
    document.getElementById(`menu-${cat}`).parentElement.classList.remove('active');
    search();
}

// 點擊空白處關閉選單
window.onclick = (e) => {
    if (!e.target.closest('.ef-drop-container')) {
        document.querySelectorAll('.ef-drop-menu').forEach(m => m.style.display = 'none');
        document.querySelectorAll('.ef-drop-container').forEach(c => c.classList.remove('active'));
    }
};

function search() {
    const grid = document.getElementById('result-grid');
    const params = selectedTags.map(s => s || '%');

    try {
        const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", params);
        grid.innerHTML = "";
        
        if (res.length > 0) {
            const rows = res[0].values;
            document.getElementById('data-count').innerText = `// SYNC_COMPLETE: ${rows.length}_UNITS_IDENTIFIED`;
            
            rows.forEach((row, i) => {
                const card = document.createElement('div');
                card.className = "gear-card animate__animated animate__fadeInUp";
                card.style.animationDelay = `${i * 0.04}s`;
                
                card.innerHTML = `
                    <div class="aspect-square bg-[#fcfcfc] flex items-center justify-center p-8 relative group overflow-hidden border-b border-zinc-50">
                        <img src="./images/${row[0]}.png" class="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110" onerror="this.src='./images/default.png';">
                        <div class="absolute top-2 right-2 text-[8px] font-black text-zinc-200 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity uppercase italic italic">E-ID: ${Math.random().toString(36).substr(2, 5)}</div>
                    </div>
                    <div class="p-5">
                        <h3 class="gear-name font-black italic italic text-base tracking-tighter uppercase mb-5 border-l-4 border-black pl-3 leading-none truncate">${row[0]}</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-end border-b border-zinc-100 pb-1">
                                <span class="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic">Base_Stat</span>
                                <span class="stat-val text-sm font-bold text-zinc-800">${row[1]}</span>
                            </div>
                            <div class="flex justify-between items-end border-b border-zinc-100 pb-1">
                                <span class="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic">Sub_Stat</span>
                                <span class="stat-val text-sm font-bold text-zinc-800">${row[2]}</span>
                            </div>
                            <div class="mt-6 pt-4 relative bg-zinc-50/50 p-2 border-r-4 border-yellow-400">
                                <span class="text-[8px] font-black text-yellow-500 uppercase tracking-widest italic leading-none">// Skill_Logic</span>
                                <p class="text-[11px] text-zinc-500 font-bold leading-tight mt-2 line-clamp-2 h-8 italic italic">${row[3]}</p>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (e) { console.error(e); }
}

function clearUI() {
    selectedTags = ["", "", ""];
    [1,2,3].forEach(i => document.getElementById(`val-${i}`).innerText = '-- SELECT --');
    search();
}

init();
