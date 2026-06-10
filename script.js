window.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById("load-status-text");
    
    setTimeout(() => { statusText.innerText = "Mengalokasikan PCB (Process Control Block)..."; }, 700);
    setTimeout(() => { statusText.innerText = "Menyinkronkan gerbang interupsi pencatatan log detik..."; }, 1400);
    setTimeout(() => { statusText.innerText = "Inisialisasi subsistem GUI berhasil disiapkan."; }, 2200);

    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        const dashboard = document.getElementById('main-dashboard');
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        dashboard.classList.add('dashboard-ready');
    }, 2800);
});

/**
 * 2. REPOSITORI SOURCE DATA MASTER PROSES (ENCAPSULATED DATA OBJECTS)
 */
const kumpulanProsesMaster = [
    { id: "P1", at: 0, bt: 6, kelasWarna: "gantt-p1" },
    { id: "P2", at: 2, bt: 3, kelasWarna: "gantt-p2" },
    { id: "P3", at: 4, bt: 1, kelasWarna: "gantt-p3" }
];

/**
 * 3. FUNGSI MODULAR: KALKULASI METRIK EVALUASI MATEMATIKA (WT & TAT)
 */
function kalkulasiMetrikSistem(listHasilProses) {
    let totalWT = 0;
    let totalTAT = 0;
    
    listHasilProses.forEach(p => {
        totalWT += p.wt;
        totalTAT += p.tat;
    });

    return {
        awt: (totalWT / listHasilProses.length).toFixed(2),
        att: (totalTAT / listHasilProses.length).toFixed(2)
    };
}

/**
 * 4. FUNGSI MODULAR: RENDER GUI DAN INJEKSI ANIMASI
 */
function renderAplikasiDasbor(namaAlgoritma, susunanGantt, listHasilProses, arrayLogTerminal) {
    const panel = document.getElementById("panel-output");
    panel.style.display = "none";
    void panel.offsetWidth; // Rekalkulasi layout paksa untuk memicu ulang animasi CSS
    panel.style.display = "block";
    
    document.getElementById("judul-algoritma").innerText = "Hasil Analisis Komputasi: " + namaAlgoritma;

    // A. Konstruksi Balok Gantt Chart Dinamis Berbasis Skala Durasi Waktu
    const timeline = document.getElementById("gantt-timeline-render");
    timeline.innerHTML = "";
    const totalWaktuEksekusi = susunanGantt[susunanGantt.length - 1].waktuSelesai;

    susunanGantt.forEach((blok, indeks) => {
        const durasiKomputasiBlok = blok.waktuSelesai - blok.waktuMulai;
        const persentaseLebarFlex = (durasiKomputasiBlok / totalWaktuEksekusi) * 100;
        
        const elemenBlok = document.createElement("div");
        elemenBlok.className = `gantt-block ${blok.warna}`;
        elemenBlok.style.flexGrow = persentaseLebarFlex;
        elemenBlok.style.animationDelay = `${indeks * 0.15}s`; // Efek Staggered Delay
        elemenBlok.innerText = blok.idProses;

        if (indeks === 0) {
            const labelAwal = document.createElement("span");
            labelAwal.className = "time-label-start";
            labelAwal.innerText = blok.waktuMulai;
            elemenBlok.appendChild(labelAwal);
        }

        const labelAkhir = document.createElement("span");
        labelAkhir.className = "time-label";
        labelAkhir.innerText = blok.waktuSelesai;
        elemenBlok.appendChild(labelAkhir);
        
        timeline.appendChild(elemenBlok);
    });

    // B. Penyusunan Baris Data Kuantitatif ke Tabel HTML
    const tbody = document.getElementById("tabel-hasil-render").querySelector("tbody");
    tbody.innerHTML = "";
    listHasilProses.forEach(p => {
        const penandaWarnaBadge = p.id === 'P1' ? 'badge-p1' : p.id === 'P2' ? 'badge-p2' : 'badge-p3';
        const templateBaris = `<tr>
            <td><span class="badge ${penandaWarnaBadge}">${p.id}</span></td>
            <td>${p.at} ms</td><td>${p.bt} ms</td><td>${p.ct} ms</td><td>${p.tat} ms</td><td>${p.wt} ms</td>
        </tr>`;
        tbody.innerHTML += templateBaris;
    });

    // C. Penuangan Koleksi String Log Kronologi CPU ke Kotak Terminal Console
    const terminal = document.getElementById("system-logger-terminal");
    terminal.innerHTML = "";
    arrayLogTerminal.forEach(teksLog => {
        const elemenLog = document.createElement("div");
        elemenLog.className = "log-line";
        if(teksLog.includes("SELESAI") || teksLog.includes("Berhasil")) elemenLog.className += " log-success";
        if(teksLog.includes("INTERUPSI") || teksLog.includes("dialihkan")) elemenLog.className += " log-alert";
        elemenLog.innerText = teksLog;
        terminal.appendChild(elemenLog);
    });

    // D. Injeksi Hasil Akhir Skor Rata-rata Statistika
    const skorMetrik = kalkulasiMetrikSistem(listHasilProses);
    document.getElementById("nilai-awt").innerText = skorMetrik.awt + " ms";
    document.getElementById("nilai-att").innerText = skorMetrik.att + " ms";
}

/**
 * 5. CORE LOGIC ENGINE: ALGORITMA SHORTEST JOB FIRST (NON-PREEMPTIVE)
 */
function eksekusiPenjadwalanSJF() {
    let procs = kumpulanProsesMaster.map(p => ({ ...p, statusRampung: false }));
    let waktuSistem = 0, totalRampung = 0, jumlahProses = procs.length;
    let urutanGantt = [], listHasilProses = [], logSistem = [];

    logSistem.push("[SISTEM] Memulai Algoritma Shortest Job First (Non-Preemptive)...");

    while (totalRampung < jumlahProses) {
        let indeksPilihan = -1;
        let burstTerpendek = Infinity;

        for (let i = 0; i < jumlahProses; i++) {
            if (procs[i].at <= waktuSistem && !procs[i].statusRampung) {
                if (procs[i].bt < burstTerpendek) {
                    burstTerpendek = procs[i].bt;
                    indeksPilihan = i;
                }
            }
        }

        if (indeksPilihan === -1) {
            logSistem.push(`[Detik ${waktuSistem}] CPU Idle: Tidak ada antrean proses yang masuk.`);
            waktuSistem++;
            continue;
        }

        let penandaWaktuMulai = waktuSistem;
        logSistem.push(`[Detik ${waktuSistem}] CPU Mengunci Proses ${procs[indeksPilihan].id} (BT: ${procs[indeksPilihan].bt}ms) - Bersifat Non-Preemptive.`);
        
        waktuSistem += procs[indeksPilihan].bt;
        procs[indeksPilihan].ct = waktuSistem;
        procs[indeksPilihan].tat = procs[indeksPilihan].ct - procs[indeksPilihan].at;
        procs[indeksPilihan].wt = procs[indeksPilihan].tat - procs[indeksPilihan].bt;
        procs[indeksPilihan].statusRampung = true;
        totalRampung++;

        logSistem.push(`[Detik ${waktuSistem}] Proses ${procs[indeksPilihan].id} SELESAI diproses.`);

        urutanGantt.push({
            idProses: procs[indeksPilihan].id,
            waktuMulai: penandaWaktuMulai,
            waktuSelesai: waktuSistem,
            warna: procs[indeksPilihan].kelasWarna
        });
        
        listHasilProses.push(procs[indeksPilihan]);
    }

    listHasilProses.sort((x, y) => x.id.localeCompare(y.id));
    logSistem.push("[SISTEM] Seluruh kalkulasi SJF Berhasil Dituntaskan.");
    renderAplikasiDasbor("Shortest Job First (Non-Preemptive)", urutanGantt, listHasilProses, logSistem);
}

/**
 * 6. CORE LOGIC ENGINE: ALGORITMA SHORTEST REMAINING TIME FIRST (PREEMPTIVE)
 */
function eksekusiPenjadwalanSRTF() {
    let procs = kumpulanProsesMaster.map(p => ({ ...p, sisaWaktuEksekusi: p.bt, ct: 0, tat: 0, wt: 0 }));
    let waktuSistem = 0, totalRampung = 0, jumlahProses = procs.length;
    let urutanGantt = [], logSistem = [];
    
    let pointerProsesAktif = null;
    let penandaWaktuMulaiSegmen = 0;

    logSistem.push("[SISTEM] Memulai Algoritma Shortest Remaining Time First (Preemptive)...");

    while (totalRampung < jumlahProses) {
        let indeksPilihan = -1;
        let sisaWaktuTerpendek = Infinity;

        for (let i = 0; i < jumlahProses; i++) {
            if (procs[i].at <= waktuSistem && procs[i].sisaWaktuEksekusi > 0) {
                if (procs[i].sisaWaktuEksekusi < sisaWaktuTerpendek) {
                    sisaWaktuTerpendek = procs[i].sisaWaktuEksekusi;
                    indeksPilihan = i;
                }
            }
        }

        if (indeksPilihan === -1) {
            if (pointerProsesAktif !== null) {
                urutanGantt.push({
                    idProses: pointerProsesAktif.id, waktuMulai: penandaWaktuMulaiSegmen, waktuSelesai: waktuSistem, warna: pointerProsesAktif.kelasWarna
                });
                pointerProsesAktif = null;
            }
            logSistem.push(`[Detik ${waktuSistem}] CPU Status Idle.`);
            waktuSistem++;
            continue;
        }

        // Algoritma Deteksi Context Switching (Preemption Interupsi)
        if (pointerProsesAktif === null || pointerProsesAktif.id !== procs[indeksPilihan].id) {
            if (pointerProsesAktif !== null) {
                logSistem.push(`[Detik ${waktuSistem}] INTERUPSI! Proses ${pointerProsesAktif.id} di-preempt. Sisa waktu eksekusinya: ${pointerProsesAktif.sisaWaktuEksekusi}ms.`);
                urutanGantt.push({
                    idProses: pointerProsesAktif.id,
                    waktuMulai: penandaWaktuMulaiSegmen,
                    waktuSelesai: waktuSistem,
                    warna: pointerProsesAktif.kelasWarna
                });
            }
            pointerProsesAktif = procs[indeksPilihan];
            penandaWaktuMulaiSegmen = waktuSistem;
            logSistem.push(`[Detik ${waktuSistem}] CPU dialihkan untuk memproses ${pointerProsesAktif.id} (Sisa Waktu Terpendek: ${pointerProsesAktif.sisaWaktuEksekusi}ms).`);
        }

        // Jalankan siklus waktu mikro tunggal
        procs[indeksPilihan].sisaWaktuEksekusi--;
        waktuSistem++;

        // Kondisi jika durasi sisa burst proses tuntas habis
        if (procs[indeksPilihan].sisaWaktuEksekusi === 0) {
            procs[indeksPilihan].ct = waktuSistem;
            procs[indeksPilihan].tat = procs[indeksPilihan].ct - procs[indeksPilihan].at;
            procs[indeksPilihan].wt = procs[indeksPilihan].tat - procs[indeksPilihan].bt;
            totalRampung++;
            logSistem.push(`[Detik ${waktuSistem}] Proses ${procs[indeksPilihan].id} tuntas dieksekusi SELESAI.`);
        }
    }

    if (pointerProsesAktif !== null) {
        urutanGantt.push({
            idProses: pointerProsesAktif.id,
            waktuMulai: penandaWaktuMulaiSegmen,
            waktuSelesai: waktuSistem,
            warna: pointerProsesAktif.kelasWarna
        });
    }

    logSistem.push("[SISTEM] Seluruh kalkulasi preemptive SRTF Berhasil Dituntaskan.");
    renderAplikasiDasbor("Shortest Remaining Time First (Preemptive)", urutanGantt, procs, logSistem);
}