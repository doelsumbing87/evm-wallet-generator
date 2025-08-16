const ethers = require("ethers");     // v5.x (CommonJS)
const ExcelJS = require("exceljs");
const bip39 = require("bip39");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

/** ===== Util ===== */

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

function sanitizeBaseName(input) {
  let base = (input || "").trim();
  if (!base) base = `wallets_${Date.now()}`;
  base = base.replace(/\.(xlsx|csv|tsv)$/i, "");           // buang ekstensi bila ada
  base = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");      // karakter ilegal
  return base.slice(0, 200);
}

async function confirmOverwrite(filePath) {
  try { await fs.access(filePath); } catch { return true; }
  const ans = (await askQuestion("File sudah ada. Ganti file yang ada? (y/N): ")).trim().toLowerCase();
  return ans === "y" || ans === "yes";
}


function computeColumnWidths(headers, rows) {
  const min = 12, pad = 2, max = 80;
  const widths = headers.map(h => String(h).length);
  for (const row of rows) {
    headers.forEach((h, i) => {
      const val = String(row[h] ?? "");
      if (val.length > widths[i]) widths[i] = val.length;
    });
  }
  return widths.map(w => Math.min(Math.max(w + pad, min), max));
}


function applyBorders(ws, colCount) {
  for (let r = 1; r <= ws.rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }
}

/** ===== Main ===== */

async function main() {
  console.log("Wallet Generator XLSX");
  console.log("Dibuat oleh: GitHub @Doelsumbing87 | Twitter @Bey_id");
  console.log("Catatan: Please Support Me Give Stars or Follow");

  const amountStr = await askQuestion("Berapa banyak wallet yang ingin dibuat? , how much wallet want to create? ");
  const amount = parseInt(amountStr, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error("Input jumlah tidak valid. Masukkan angka lebih besar dari 0.");
    process.exit(1);
  }

  const baseInput = await askQuestion("Masukkan nama file dasar (tanpa ekstensi, contoh: my_wallets): ");
  const baseName = sanitizeBaseName(baseInput);
  const outXlsx = path.resolve(process.cwd(), `${baseName}.xlsx`);

  const ok = await confirmOverwrite(outXlsx);
  if (!ok) {
    console.log("Dibatalkan oleh pengguna.");
    process.exit(0);
  }

  console.log(`Membuat ${amount} wallet...`);

  // Kumpulkan data baris
  const rows = []; // { wallet, "private keys", pharse }
  // Derivasi default: m/44'/60'/0'/0/0
  const PATH = "m/44'/60'/0'/0/0";

  for (let i = 0; i < amount; i++) {
    // 24 kata (256-bit) menggunakan bip39
    const phrase = await bip39.generateMnemonic(256);
    // Wallet EVM pertama dari mnemonic
    const wallet = ethers.Wallet.fromMnemonic(phrase, PATH);

    rows.push({
      "wallet": wallet.address,
      "private keys": wallet.privateKey,
      "pharse": phrase,          
    });

    if ((i + 1) % 50 === 0 || i + 1 === amount) {
      process.stdout.write(`Progres: ${i + 1}/${amount}\r`);
    }
  }
  process.stdout.write("\n");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("wallets"); 

  const headers = ["wallet", "private keys", "pharse"];
  const widths = computeColumnWidths(headers, rows);
  ws.columns = headers.map((h, i) => ({ header: h, key: h, width: widths[i] }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { vertical: "middle" };

  for (const row of rows) ws.addRow(row);
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell((cell) => {
      cell.font = rowNumber === 1 ? { bold: true, size: 12 } : { size: 11 };
      cell.alignment = { vertical: "middle" };
    });
  });


  applyBorders(ws, headers.length);

  await wb.xlsx.writeFile(outXlsx);

  console.log("Selesai.");
  console.log(`File XLSX: ${outXlsx}`);
  console.log("Keamanan:");
  console.log("- Simpan file di media yang aman dan terenkripsi.");
  console.log("- Jangan mengunggah ke layanan publik.");
  console.log("- Pertimbangkan pemindahan ke penyimpanan offline.");
}

main().catch((err) => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});
