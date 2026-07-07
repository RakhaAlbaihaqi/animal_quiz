# 🌿 Tebak Suara Hewan! - Animal Sound Quiz Game

## Cara Menjalankan

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Jalankan server:
   ```
   python app.py
   ```

3. Buka browser di: http://localhost:5000

## Struktur Folder
```
animal_quiz/
├── app.py                    # Flask backend
├── requirements.txt
├── templates/
│   └── index.html            # Markup halaman (markup saja, ramping)
└── static/
    ├── css/
    │   └── style.css          # Semua styling (tema buku terbuka)
    ├── js/
    │   └── app.js             # Semua logic game + animasi
    ├── audio/
    │   ├── animals/           # Suara hewan (.mp3)
    │   ├── elements/          # BGM, correct, wrong, win, click
    │   ├── quiz/              # Audio quis dimulai/selesai, bintang 1-5
    │   └── feedback/          # Audio benar1-3, salah1-3
    └── images/
        ├── forest-bg.webp     # Background hutan
        └── animals/           # Gambar hewan (.jpg)
```

## Fitur
- Audio suara hewan asli
- 4 pilihan per soal (2 mode: tebak gambar / tebak suara)
- Sistem bintang 1-5 di akhir permainan
- BGM + efek suara interaktif
- Tema buku cerita terbuka, animasi buku kebuka & balik halaman
- 10 soal per sesi, diacak setiap bermain

## Desain
- Konsep: game kuis hewan untuk anak 4-7 tahun, dioptimalkan untuk **tablet (landscape ~4:3)**.
- Halaman utama & gameplay berbentuk **buku terbuka** (kiri = soal, kanan = jawaban).

## Dependency (via CDN, gratis)
- [Tailwind CSS](https://tailwindcss.com) — utility layout
- [GSAP](https://gsap.com) — animasi buku & transisi
- [Lucide](https://lucide.dev) — ikon UI
