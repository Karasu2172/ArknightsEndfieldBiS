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
        //document.getElementById('result').innerText = "連線成功！";
        
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

            select.innerHTML = '<option value="">-- 請選擇屬性 --</option>';
            
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
            display.innerText = `找到 ${rows.length} 筆資料`;

            rows.forEach(row => {
                const name = row[0];
                const tr = document.createElement('tr');

                const imgPath = `./images/${name}.png`;

                tr.innerHTML = `
                    <td align="center">
                        <img src="${imgPath}" alt="${name}" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.src='./images/default.png';">
                    </td>
                    <td>${name}</td>
                    <td>${row[1]}</td>
                    <td>${row[2]}</td>
                    <td>${row[3]}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            display.innerText = "無相符資料";
            tbody.innerHTML = '<tr><td colspan="4" align="center" style="color: gray;">查無結果</td></tr>';
        }
    } catch (err) {
        console.error("搜尋過程出錯:", err);
        display.innerText = "搜尋發生錯誤。";
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
