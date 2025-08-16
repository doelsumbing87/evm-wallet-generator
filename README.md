# EVM WALLET GENERATOR

Script Node.js untuk membuat wallet Ethereum secara otomatis (berbasis BIP-39, 24 kata) dan menyimpannya dalam format **.xlsx** yang sudah rapi:
- Kolom: `wallet | private keys | pharse`
- Header tebal (bold)
- Font konsisten
- Border tipis di seluruh sel
- Lebar kolom otomatis menyesuaikan konten
- `Mnemonic dibuat 24 kata menggunakan bip39.generateMnemonic(256), lalu wallet pertama diturunkan pada path m/44'/60'/0'/0/0.`

---

## Persyaratan
- Node.js >= 16
- npm

---

## Instalasi
```bash
# Buat folder proyek dan masuk ke dalamnya
mkdir evm-wallet-generator && cd evm-wallet-generator

# Inisialisasi project
npm init -y

# Install dependencies
npm install ethers@5.7.2 exceljs bip39

#run
node index.js
