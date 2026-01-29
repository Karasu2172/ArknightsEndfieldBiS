let db;
let activeFilters = ["", "", ""];

async function init() {
    const prog = document.getElementById('boot-progress');
    try {
        prog.style.width = '30%';
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        
        const res = await fetch('./data.db');
        const buf = await res.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        
        prog.style.width = '100%';
        setTimeout(() => {
            document.getElementById('boot-screen').classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => document.getElementById('boot-screen').style.display = 'none', 500);
            setupCustomDrops();
            search();
        }, 600);
    } catch (err) { console.error(err); }
}

function setupCustomDrops() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res.length) return;
    const tags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const box = document.getElementById(`s-box-${i}`);
        box.innerHTML = `<div class="ef-opt font-black text-zinc-300" onclick="pick(event, ${i}, '', '-- SELECT --')">RESET</div>`;
        
        tags.filter(t => t[0] === i).forEach(t => {
            const d = document.createElement('div');
            d.className = "ef-opt";
            d.innerText = t[1];
            d.onclick = (e) => pick(e, i, t[1], t[1]);
            box.appendChild(d);
        });
    }
}

function toggleDrop(id) {
    const box = document.getElementById(`s-box-${id}`);
    const isShow = box.style.display === 'block';
    document.querySelectorAll('.ef-options-box').forEach(b => b.style.display = 'none');
    box.style.display = isShow ? 'none' : 'block';
}

function pick(e, cat, val, txt) {
    e.stopPropagation();
    activeFilters[cat-1] = val;
    document.getElementById(`s-val-${cat}`).innerText = txt;
    document.getElementById(`s-box-${cat}`).style.display = 'none';
    search();
}

window.onclick = () => document.querySelectorAll('.ef-options-box').forEach(b => b.style.display = 'none');

function search() {
    const grid = document.getElementById('result-grid');
    const params = activeFilters.map(f => f || '%');

    try {
        const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", params);
        grid.innerHTML = "";
        if (res.length > 0) {
            res[0].values.forEach((row, i) => {
                const card = document.createElement('div');
                card.className = "gear-card animate__animated animate__fadeInUp";
                card.style.animationDelay = `${i * 0.03}s`;
                card.innerHTML = `
                    <div class="aspect-square bg-[#fcfcfc] flex items-center justify-center p-6 relative group overflow-hidden">
                        <img src="./images/${row[0]}.png" class="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" onerror="this.src='./images/default.png';">
                        <div class="absolute bottom-0 left-0 w-0 h-1 bg-yellow-400 group-hover:w-full transition-all duration-500"></div>
                    </div>
                    <div class="p-4 border-t border-zinc-50">
                        <h3 class="font-black italic text-sm tracking-tighter uppercase mb-4 truncate border-l-4 border-black pl-2 leading-none">${row[0]}</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="stat-label text-[8px] font-black text-zinc-300 uppercase tracking-widest italic">Main</span>
                                <span class="stat-val text-[11px] font-bold text-zinc-800">${row[1]}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="stat-label text-[8px] font-black text-zinc-300 uppercase tracking-widest italic">Sub</span>
                                <span class="stat-val text-[11px] font-bold text-zinc-800">${row[2]}</span>
                            </div>
                            <div class="mt-4 pt-3 border-t border-zinc-100 relative">
                                <span class="text-[7px] font-black text-yellow-500 uppercase tracking-tighter italic">// EFFECT_PROTO</span>
                                <p class="text-[10px] text-zinc-500 font-medium leading-tight mt-1 line-clamp-2 h-7 italic">${row[3]}</p>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (e) { console.error(e); }
}

function clearAll() {
    activeFilters = ["", "", ""];
    [1,2,3].forEach(i => document.getElementById(`s-val-${i}`).innerText = '-- SELECT --');
    search();
}

init();
