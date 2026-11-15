import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { Mutex } from 'async-mutex';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mutex = new Mutex();
const DB_FILE_PATH = path.join(__dirname, '..', 'database_gaji.xlsx');
const BACKUP_DIR = path.join(__dirname, 'backup');

const HEADERS = [
  { header: 'ID Slip', key: 'id', width: 25 },
  { header: 'Bulan', key: 'periode_bulan', width: 15 },
  { header: 'Tahun', key: 'periode_tahun', width: 10 },
  { header: 'ID Karyawan', key: 'karyawan_id', width: 15 },
  { header: 'Nama Karyawan', key: 'nama_karyawan', width: 20 },
  { header: 'Jabatan', key: 'jabatan', width: 20 },
  { header: 'Tarif Harian', key: 'tarif_harian', width: 15 },
  { header: 'Hari Hadir', key: 'hari_hadir', width: 12 },
  { header: 'Hari Absen', key: 'hari_absen', width: 12 },
  { header: 'Gaji Dasar', key: 'gaji_dasar', width: 18 },
  { header: 'Bonus (%)', key: 'bonus_persen', width: 12 },
  { header: 'Bonus (Rp)', key: 'bonus_nominal', width: 18 },
  { header: 'Total Gaji', key: 'total_gaji', width: 20 },
  { header: 'Tanggal Input', key: 'created_at', width: 22 }
];

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Auto Backup Function (Max 20 latest files)
function createBackup() {
  if (!fs.existsSync(DB_FILE_PATH)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `database_gaji_backup_${timestamp}.xlsx`);

  try {
    fs.copyFileSync(DB_FILE_PATH, backupPath);

    // Maintain max 20 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('database_gaji_backup_') && file.endsWith('.xlsx'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 20) {
      files.slice(20).forEach(file => {
        try { fs.unlinkSync(file.path); } catch { /* ignore unlink error */ }
      });
    }
  } catch (err) {
    console.error('Failed to create backup:', err.message);
  }
}

// Initialize Excel File if missing
export async function initExcelDB() {
  return mutex.runExclusive(async () => {
    if (fs.existsSync(DB_FILE_PATH)) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SlipGaji');
    sheet.columns = HEADERS;

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' }
    };

    try {
      await workbook.xlsx.writeFile(DB_FILE_PATH);
      console.log('✅ Database Excel initialized:', DB_FILE_PATH);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        throw new Error('File database_gaji.xlsx sedang dibuka di aplikasi Excel lain. Harap tutup file tersebut terlebih dahulu.');
      }
      throw err;
    }
  });
}

// Get all slips
export async function getAllSlips() {
  return mutex.runExclusive(async () => {
    if (!fs.existsSync(DB_FILE_PATH)) {
      return [];
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(DB_FILE_PATH);
      const sheet = workbook.getWorksheet('SlipGaji');
      if (!sheet) return [];

      const rows = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values;
        rows.push({
          id: values[1],
          periode_bulan: values[2],
          periode_tahun: values[3],
          karyawan_id: values[4],
          nama_karyawan: values[5],
          jabatan: values[6],
          tarif_harian: Number(values[7]) || 0,
          hari_hadir: Number(values[8]) || 0,
          hari_absen: Number(values[9]) || 0,
          gaji_dasar: Number(values[10]) || 0,
          bonus_persen: values[11],
          bonus_nominal: Number(values[12]) || 0,
          total_gaji: Number(values[13]) || 0,
          created_at: values[14]
        });
      });

      return rows;
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        throw new Error('File database_gaji.xlsx sedang dibuka di aplikasi lain. Harap tutup file tersebut.');
      }
      throw err;
    }
  });
}

// Add or update batch of slips (Syncing month)
export async function saveOrUpdateBatchSlips(slips) {
  return mutex.runExclusive(async () => {
    createBackup();

    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        await workbook.xlsx.readFile(DB_FILE_PATH);
      } catch (err) {
        if (err.code === 'EBUSY' || err.code === 'EACCES') {
          throw new Error('File database_gaji.xlsx sedang dikunci/dibuka di Excel. Harap tutup file terlebih dahulu.');
        }
        throw err;
      }
    }

    let sheet = workbook.getWorksheet('SlipGaji');
    if (!sheet) {
      sheet = workbook.addWorksheet('SlipGaji');
      sheet.columns = HEADERS;
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    }

    for (const slipData of slips) {
      let targetRowNumber = null;

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowId = row.getCell(1).value;
        if (rowId === slipData.id) {
          targetRowNumber = rowNumber;
        }
      });

      const rowValues = [
        slipData.id,
        slipData.periode_bulan,
        slipData.periode_tahun,
        slipData.karyawan_id,
        slipData.nama_karyawan,
        slipData.jabatan,
        slipData.tarif_harian,
        slipData.hari_hadir,
        slipData.hari_absen,
        slipData.gaji_dasar,
        slipData.bonus_persen,
        slipData.bonus_nominal,
        slipData.total_gaji,
        slipData.created_at || new Date().toLocaleString('id-ID')
      ];

      if (targetRowNumber) {
        const row = sheet.getRow(targetRowNumber);
        row.values = rowValues;
        row.commit();
      } else {
        sheet.addRow(rowValues);
      }
    }

    try {
      await workbook.xlsx.writeFile(DB_FILE_PATH);
      return { success: true, count: slips.length };
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        throw new Error('Gagal menyimpan. File database_gaji.xlsx sedang dibuka di aplikasi Excel lain.');
      }
      throw err;
    }
  });
}

// Add single slip
export async function addSingleSlip(slipData) {
  return saveOrUpdateBatchSlips([slipData]);
}

// Delete single slip by ID
export async function deleteSlipById(id) {
  return mutex.runExclusive(async () => {
    createBackup();

    if (!fs.existsSync(DB_FILE_PATH)) {
      throw new Error('Database file not found.');
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(DB_FILE_PATH);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        throw new Error('File database_gaji.xlsx sedang dibaca/dikunci aplikasi lain.');
      }
      throw err;
    }

    const sheet = workbook.getWorksheet('SlipGaji');
    if (!sheet) throw new Error('Sheet SlipGaji not found.');

    let deletedRowIndex = null;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (row.getCell(1).value === id) {
        deletedRowIndex = rowNumber;
      }
    });

    if (!deletedRowIndex) {
      throw new Error(`Slip gaji dengan ID ${id} tidak ditemukan.`);
    }

    sheet.spliceRows(deletedRowIndex, 1);

    try {
      await workbook.xlsx.writeFile(DB_FILE_PATH);
      return { success: true, deletedId: id };
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        throw new Error('File database_gaji.xlsx sedang dibuka di aplikasi Excel lain.');
      }
      throw err;
    }
  });
}
