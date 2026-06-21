let modeAktif = 'statis'; 

function updateNavIndicator(element) {
    const indicator = document.getElementById('nav-indicator');
    indicator.style.width = `${element.offsetWidth}px`;
    indicator.style.left = `${element.offsetLeft}px`;
}

window.addEventListener('load', () => {
    const activeItem = document.querySelector('.nav-item.active');
    updateNavIndicator(activeItem);
    renderTabelInput(kumpulanProsesMaster);
});

function switchMode(mode, element) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    updateNavIndicator(element);
    
    modeAktif = mode;
    const panel = document.getElementById("panel-output");
    panel.classList.remove("reveal-active");

    if (mode === 'statis') {
        document.getElementById("sub-header-text").innerText = "Arsitektur Simulator Perbandingan Algoritma SJF vs SRTF (Mode Statis Master)";
        document.getElementById("judul-antrean").innerText = "Tabel Antrean Register Proses Master (Statis)";
        document.getElementById("form-dinamis-wrapper").style.display = "none";
        kumpulanProsesDinamis = []; 
        renderTabelInput(kumpulanProsesMaster);
    } else {
        document.getElementById("sub-header-text").innerText = "Arsitektur Simulator Perbandingan Algoritma SJF vs SRTF (Mode Dinamis Kustom)";
        document.getElementById("judul-antrean").innerText = "Tabel Antrean Register Kustom (Dinamis)";
        document.getElementById("form-dinamis-wrapper").style.display = "block";
        renderTabelInput(kumpulanProsesDinamis);
    }
}

const kumpulanProsesMaster = [
    { id: "P1", at: 0, bt: 6, kelasWarna: "gantt-p1" },
    { id: "P2", at: 2, bt: 3, kelasWarna: "gantt-p2" },
    { id: "P3", at: 4, bt: 1, kelasWarna: "gantt-p3" }
];
let kumpulanProsesDinamis = [];
const arraiWarnaGantt = ["gantt-p1", "gantt-p2", "gantt-p3"];

function renderTabelInput(arrayProses) {
    const tbody = document.getElementById("body-tabel-input");
    tbody.innerHTML = "";
    if(arrayProses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:var(--text-muted); font-style:italic;">Belum ada data antrean. Silakan input di atas.</td></tr>`;
        return;
    }
    arrayProses.forEach(p => {
        tbody.innerHTML += `<tr><td><span class="badge badge-p-gen">${p.id}</span></td><td>${p.at}</td><td>${p.bt} ms</td></tr>`;
    });
}

function tambahProsesDinamis() {
    const id = document.getElementById("input-id").value.trim();
    const at = parseInt(document.getElementById("input-at").value);
    const bt = parseInt(document.getElementById("input-bt").value);

    if(!id || isNaN(at) || isNaN(bt) || at < 0 || bt <= 0) {
        alert("Mohon isi semua data konfigurasi proses dengan valid!");
        return;
    }
    if(kumpulanProsesDinamis.some(p => p.id.toUpperCase() === id.toUpperCase())) {
        alert("ID Proses sudah terdaftar!"); return;
    }

    const warnaAcak = arraiWarnaGantt[kumpulanProsesDinamis.length % arraiWarnaGantt.length];
    kumpulanProsesDinamis.push({ id: id.toUpperCase(), at: at, bt: bt, kelasWarna: warnaAcak });
    
    document.getElementById("input-id").value = "";
    document.getElementById("input-at").value = "";
    document.getElementById("input-bt").value = "";
    
    renderTabelInput(kumpulanProsesDinamis);
}

function kalkulasiMetrikSistem(listHasilProses) {
    let totalWT = 0; let totalTAT = 0;
    listHasilProses.forEach(p => { totalWT += p.wt; totalTAT += p.tat; });
    return { awt: (totalWT / listHasilProses.length).toFixed(2), att: (totalTAT / listHasilProses.length).toFixed(2) };
}

function renderAplikasiDasbor(namaAlgoritma, susunanGantt, listHasilProses, arrayLogTerminal) {
    const panel = document.getElementById("panel-output");
    panel.classList.add("reveal-active");
    
    document.getElementById("judul-algoritma").innerText = "Hasil Analisis Komputasi: " + namaAlgoritma;

    const timeline = document.getElementById("gantt-timeline-render");
    timeline.innerHTML = "";
    const totalWaktuEksekusi = susunanGantt[susunanGantt.length - 1].waktuSelesai;

    susunanGantt.forEach((blok, indeks) => {
        const durasiKomputasiBlok = blok.waktuSelesai - blok.waktuMulai;
        const persentaseLebarFlex = (durasiKomputasiBlok / totalWaktuEksekusi) * 100;
        const elemenBlok = document.createElement("div");
        elemenBlok.className = `gantt-block ${blok.warna}`;
        elemenBlok.style.flexGrow = persentaseLebarFlex;
        elemenBlok.style.animationDelay = `${indeks * 0.15}s`;
        elemenBlok.innerText = blok.idProses;

        if (indeks === 0) {
            const labelAwal = document.createElement("span");
            labelAwal.className = "time-label-start"; labelAwal.innerText = blok.waktuMulai;
            elemenBlok.appendChild(labelAwal);
        }
        const labelAkhir = document.createElement("span");
        labelAkhir.className = "time-label"; labelAkhir.innerText = blok.waktuSelesai;
        elemenBlok.appendChild(labelAkhir);
        timeline.appendChild(elemenBlok);
    });

    const tbody = document.getElementById("tabel-hasil-render").querySelector("tbody");
    tbody.innerHTML = "";
    listHasilProses.forEach(p => {
        tbody.innerHTML += `<tr><td><span class="badge badge-p-gen">${p.id}</span></td><td>${p.at} ms</td><td>${p.bt} ms</td><td>${p.ct} ms</td><td>${p.tat} ms</td><td>${p.wt} ms</td></tr>`;
    });

    const terminal = document.getElementById("system-logger-terminal");
    terminal.innerHTML = "";
    arrayLogTerminal.forEach(teksLog => {
        const elemenLog = document.createElement("div");
        elemenLog.className = "log-line";
        if(teksLog.includes("SELESAI")) elemenLog.className += " log-success";
        if(teksLog.includes("INTERUPSI")) elemenLog.className += " log-alert";
        elemenLog.innerText = teksLog;
        terminal.appendChild(elemenLog);
    });

    const skorMetrik = kalkulasiMetrikSistem(listHasilProses);
    document.getElementById("nilai-awt").innerText = skorMetrik.awt + " ms";
    document.getElementById("nilai-att").innerText = skorMetrik.att + " ms";

    setTimeout(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function dapatkanDataAktif() {
    return modeAktif === 'statis' ? kumpulanProsesMaster : kumpulanProsesDinamis;
}

function eksekusiPenjadwalanSJF() {
    let dataSumber = dapatkanDataAktif();
    if(dataSumber.length === 0) { alert("Tidak ada data antrean proses untuk dieksekusi!"); return; }
    
    let procs = dataSumber.map(p => ({ ...p, statusRampung: false }));
    let waktuSistem = 0, totalRampung = 0, jumlahProses = procs.length;
    let urutanGantt = [], listHasilProses = [], logSistem = [];

    logSistem.push("[SISTEM] Memulai Algoritma Shortest Job First (Non-Preemptive)...");

    while (totalRampung < jumlahProses) {
        let indeksPilihan = -1; let burstTerpendek = Infinity;
        for (let i = 0; i < jumlahProses; i++) {
            if (procs[i].at <= waktuSistem && !procs[i].statusRampung && procs[i].bt < burstTerpendek) {
                burstTerpendek = procs[i].bt; indeksPilihan = i;
            }
        }
        if (indeksPilihan === -1) { waktuSistem++; continue; }

        let penandaWaktuMulai = waktuSistem;
        logSistem.push(`[Detik ${waktuSistem}] CPU Mengunci Proses ${procs[indeksPilihan].id} (BT: ${procs[indeksPilihan].bt}ms).`);
        waktuSistem += procs[indeksPilihan].bt;
        procs[indeksPilihan].ct = waktuSistem;
        procs[indeksPilihan].tat = procs[indeksPilihan].ct - procs[indeksPilihan].at;
        procs[indeksPilihan].wt = procs[indeksPilihan].tat - procs[indeksPilihan].bt;
        procs[indeksPilihan].statusRampung = true;
        totalRampung++;

        logSistem.push(`[Detik ${waktuSistem}] Proses ${procs[indeksPilihan].id} SELESAI.`);
        urutanGantt.push({ idProses: procs[indeksPilihan].id, waktuMulai: penandaWaktuMulai, waktuSelesai: waktuSistem, warna: procs[indeksPilihan].kelasWarna });
        listHasilProses.push(procs[indeksPilihan]);
    }
    listHasilProses.sort((x, y) => x.id.localeCompare(y.id));
    renderAplikasiDasbor("Shortest Job First (SJF)", urutanGantt, listHasilProses, logSistem);
}

function eksekusiPenjadwalanSRTF() {
    let dataSumber = dapatkanDataAktif();
    if(dataSumber.length === 0) { alert("Tidak ada data antrean proses untuk dieksekusi!"); return; }

    let procs = dataSumber.map(p => ({ ...p, sisaWaktuEksekusi: p.bt, ct: 0, tat: 0, wt: 0 }));
    let waktuSistem = 0, totalRampung = 0, jumlahProses = procs.length;
    let urutanGantt = [], logSistem = [];
    let pointerProsesAktif = null; let penandaWaktuMulaiSegmen = 0;

    logSistem.push("[SISTEM] Memulai Algoritma Shortest Remaining Time First (Preemptive)...");

    while (totalRampung < jumlahProses) {
        let indeksPilihan = -1; let sisaWaktuTerpendek = Infinity;
        for (let i = 0; i < jumlahProses; i++) {
            if (procs[i].at <= waktuSistem && procs[i].sisaWaktuEksekusi > 0 && procs[i].sisaWaktuEksekusi < sisaWaktuTerpendek) {
                sisaWaktuTerpendek = procs[i].sisaWaktuEksekusi; indeksPilihan = i;
            }
        }

        if (indeksPilihan === -1) {
            if (pointerProsesAktif !== null) {
                urutanGantt.push({ idProses: pointerProsesAktif.id, waktuMulai: penandaWaktuMulaiSegmen, waktuSelesai: waktuSistem, warna: pointerProsesAktif.kelasWarna });
                pointerProsesAktif = null;
            }
            waktuSistem++; continue;
        }

        if (pointerProsesAktif === null || pointerProsesAktif.id !== procs[indeksPilihan].id) {
            if (pointerProsesAktif !== null) {
                logSistem.push(`[Detik ${waktuSistem}] INTERUPSI! Proses ${pointerProsesAktif.id} di-preempt.`);
                urutanGantt.push({ idProses: pointerProsesAktif.id, waktuMulai: penandaWaktuMulaiSegmen, waktuSelesai: waktuSistem, warna: pointerProsesAktif.kelasWarna });
            }
            pointerProsesAktif = procs[indeksPilihan]; penandaWaktuMulaiSegmen = waktuSistem;
            logSistem.push(`[Detik ${waktuSistem}] CPU beralih ke ${pointerProsesAktif.id}.`);
        }

        procs[indeksPilihan].sisaWaktuEksekusi--; waktuSistem++;

        if (procs[indeksPilihan].sisaWaktuEksekusi === 0) {
            procs[indeksPilihan].ct = waktuSistem;
            procs[indeksPilihan].tat = procs[indeksPilihan].ct - procs[indeksPilihan].at;
            procs[indeksPilihan].wt = procs[indeksPilihan].tat - procs[indeksPilihan].bt;
            totalRampung++;
            logSistem.push(`[Detik ${waktuSistem}] Proses ${procs[indeksPilihan].id} SELESAI.`);
        }
    }
    if (pointerProsesAktif !== null) {
        urutanGantt.push({ idProses: pointerProsesAktif.id, waktuMulai: penandaWaktuMulaiSegmen, waktuSelesai: waktuSistem, warna: pointerProsesAktif.kelasWarna });
    }
    renderAplikasiDasbor("Shortest Remaining Time First (SRTF)", urutanGantt, procs, logSistem);
}