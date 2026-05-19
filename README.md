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
│   └── index.html            # Halaman utama (Tailwind + JS)
└── static/
    ├── audio/
    │   ├── animals/           # Suara hewan (.mp3)
    │   ├── elements/          # BGM, correct, wrong, win, click
    │   ├── quiz/              # Audio quis dimulai/selesai, bintang 1-5
    │   └── feedback/          # Audio benar1-3, salah1-3
    └── images/
        └── animals/           # Gambar hewan (.jpg)
```

## Fitur
- 🔊 Audio suara hewan asli
- 🖼️ 4 pilihan gambar hewan per soal
- ⭐ Sistem bintang 1-5 di akhir permainan
- 🎵 BGM + efek suara interaktif
- 🌿 Tema hutan animatif (daun, kunang-kunang)
- 🎯 10 soal per sesi, diacak setiap bermain
