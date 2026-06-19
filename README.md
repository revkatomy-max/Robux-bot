# 🎮 Robux Discord Bot (SQLite)

Bot Discord untuk penjualan Robux via sistem tiket otomatis.  
Stack: **Discord.js v14 + SQLite (better-sqlite3)** — tanpa MongoDB, tanpa setup database eksternal.

---

## 📁 Struktur Folder

```
robux-bot/
├── src/
│   ├── commands/           # Slash commands
│   ├── database/
│   │   └── db.js           # SQLite setup + semua query
│   ├── events/
│   ├── handlers/
│   ├── interactions/
│   │   ├── buttons/
│   │   └── modals/
│   └── utils/
├── data/                   # Folder otomatis dibuat, berisi database.db
├── .env.example
├── package.json
├── railway.json
└── README.md
```

---

## 🛠️ Setup Lokal

### 1. Install dependencies

```bash
npm install
```

### 2. Buat file `.env`

```bash
cp .env.example .env
```

Isi:
```
DISCORD_TOKEN=token_bot_discord_kamu
CLIENT_ID=application_id_bot_kamu
```

> `DB_PATH` opsional — defaultnya `./data/database.db` (otomatis dibuat)

### 3. Daftarkan Slash Commands

```bash
npm run deploy
```

### 4. Jalankan Bot

```bash
npm start
```

---

## 🚂 Deploy ke Railway

### Langkah 1 — Persiapan Discord Bot

1. Buka [discord.com/developers](https://discord.com/developers/applications)
2. Buat Application baru → masuk tab **Bot**
3. Enable: `SERVER MEMBERS INTENT` + `MESSAGE CONTENT INTENT`
4. Copy **Token** dan **Application ID**
5. Invite bot ke server:
   ```
   https://discord.com/oauth2/authorize?client_id=APP_ID&permissions=8&scope=bot%20applications.commands
   ```

### Langkah 2 — Deploy ke Railway

1. Push project ke GitHub
2. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Pilih repo kamu

### Langkah 3 — Set Environment Variables

Di Railway, tab **Variables**:
```
DISCORD_TOKEN = token_bot_kamu
CLIENT_ID     = application_id_kamu
```

> **⚠️ Catatan penting untuk Railway:**  
> SQLite menyimpan data di filesystem. Di Railway, filesystem bersifat **ephemeral** (reset saat redeploy).  
> Untuk data permanen, tambahkan **Railway Volume**:  
> - Di Railway project → **Add Volume** → mount path: `/app/data`  
> - Set `DB_PATH=/app/data/database.db` di Variables

### Langkah 4 — Register Commands (sekali saja)

Jalankan dari lokal setelah bot online:
```bash
npm run deploy
```

---

## ⚙️ Setup Discord Server

```
/setroles admin:@Admin seller:@Seller
/setcategories open_ticket:#open-ticket transaction_log:#log-transaksi transcript:#transcripts
/setprice harga:120
/setqr           ← upload gambar QR QRIS/transfer
/setup-shop      ← jalankan di channel toko
```

---

## 📋 Commands

| Command | Role | Deskripsi |
|---|---|---|
| `/setup-shop` | Admin | Kirim panel beli Robux |
| `/setprice <harga>` | Admin | Set harga per Robux |
| `/setqr` | Admin | Upload QR pembayaran |
| `/setroles` | Admin | Set role admin/seller/member |
| `/setcategories` | Admin | Set kategori & channel log |
| `/stats` | Admin | Lihat statistik penjualan |

---

## 🔄 Flow Pembelian

```
User klik tombol beli
  → Modal: isi Roblox username
  → Channel tiket dibuat otomatis
  → Embed order + QR tampil
  → User klik "Saya Sudah Bayar"
  → Notifikasi ke log channel
  → Seller claim tiket
  → Seller verify payment
  → Seller kirim Robux di Roblox
  → Seller complete order
  → DM otomatis ke buyer
  → Seller close ticket
  → Transcript HTML dikirim ke log
  → Channel dihapus (10 detik)
```
