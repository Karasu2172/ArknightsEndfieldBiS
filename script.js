let db;
let selectedValues = { tag1: '', tag2: '', tag3: '' };

async function init() {
    // 確保 preloader 動畫有足夠時間播放
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('exit');
        document.getElementById('main-content').classList.replace('opacity-0', 'opacity-100');
    }, 1500); // 1.5秒，與打字動畫同步

    try {
        const config = { locateFile: file => `https://sql.js.org/dist/${file}` };
        const SQL = await initSqlJs(config);
        const response = await fetch('./data.db');
        const buf = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buf));
        loadCustomTags();
    } catch (err) { console.error("Database Init Error:", err); }
}

function loadCustomTags() {
    const res = db.exec("SELECT category, tag_name FROM tags");
    if (!res[0]) return;
    const allTags = res[0].values;

    for (let i = 1; i <= 3; i++) {
        const container = document.getElementById(`select-tag${i}`);
        const optionsDiv = container.querySelector('.custom-options');
        const trigger = container.querySelector('.custom-select-trigger');

        optionsDiv.innerHTML = `<div class="custom-option" data-value="">-- NO_FILTER --</div>`;
        allTags.filter(t => t[0] === i).forEach(t => {
            optionsDiv.innerHTML += `<div class="custom-option" data-value="${t[1]}">${t[1]}</div>`;
        });

        trigger.onclick = (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            optionsDiv.classList.toggle('show');
            trigger.classList.toggle('active');
        };

        optionsDiv.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = () => {
                const val = opt.getAttribute('data-value');
                selectedValues[`tag${i}`] = val;
                trigger.innerHTML = `${val || '-- NO_FILTER --'} <span>▼</span>`;
                optionsDiv.classList.remove('show');
                trigger.classList.remove('active');
                search();
            };
        });
    }
}

function search() {
    const t1 = selectedValues.tag1 || '%';
    const t2 = selectedValues.tag2 || '%';
    const t3 = selectedValues.tag3 || '%';
    const container = document.getElementById('equipment-grid');
    const res = db.exec("SELECT product_name, tag1, tag2, tag3 FROM products WHERE tag1 LIKE ? AND tag2 LIKE ? AND tag3 LIKE ?", [t1, t2, t3]);

    container.innerHTML = "";
    if (res[0]) {
        res[0].values.forEach(row => {
            const card = document.createElement('div');
            card.className = "group bg-white border border-zinc-200 hover:border-black relative flex flex-col shadow-sm transition-all overflow-hidden"; /* 添加 overflow-hidden */
            card.innerHTML = `
                <div class="bg-[#F9F9F9] aspect-square flex items-center justify-center p-6 relative scan-effect">
                    <img src="./images/${row[0]}.png" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                         onerror="this.src='https://placehold.co/400x400/F9F9F9/DDD?text=ENDFIELD'; this.style.opacity=0.2">
                </div>
                <div class="p-6 flex-grow flex flex-col">
                    <h3 class="font-black italic text-2xl mb-5 uppercase border-b-2 border-black pb-2 inline-block tracking-tighter">${row[0]}</h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="border-l-2 border-zinc-200 pl-3">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase mb-1 tracking-widest">Base</p>
                            <p class="text-lg font-black text-black leading-none">${row[1]}</p>
                        </div>
                        <div class="border-l-2 border-zinc-200 pl-3">
                            <p class="text-[9px] text-zinc-400 font-bold uppercase mb-1 tracking-widest">Sub</p>
                            <p class="text-lg font-black text-black leading-none">${row[2]}</p>
                        </div>
                    </div>

                    <div class="bg-[#FAFAFA] p-4 border-l-[6px] border-yellow-500 mt-auto group-hover:bg-yellow-50/50 transition-colors">
                        <p class="text-[10px] text-yellow-600 font-black mb-1.5 tracking-widest uppercase">// SKILL_EFFECT</p>
                        <p class="text-[15px] text-zinc-800 italic font-bold leading-relaxed">${row[3]}</p>
                    </div>
                </div>
                <div class="h-[3px] w-0 bg-yellow-500 group-hover:w-full transition-all duration-500"></div>
            `;
            container.appendChild(card);
        });
        document.getElementById('result-count').innerText = `// DATA_LOG: ${res[0].values.length} UNITS_SYNCED`;
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.custom-options').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('.custom-select-trigger').forEach(t => t.classList.remove('active'));
}

function clearAllFilters() {
    selectedValues = { tag1: '', tag2: '', tag3: '' };
    document.querySelectorAll('.custom-select-trigger').forEach(t => t.innerHTML = '-- NO_FILTER -- <span>▼</span>');
    search();
}

window.onclick = closeAllDropdowns;
init();
