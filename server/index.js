import express from 'express';
import cors from 'cors';
import { initExcelDB, getAllSlips, saveOrUpdateBatchSlips, deleteSlipById } from './db-manager.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize DB
initExcelDB().catch(console.error);

// GET all
app.get('/api/slip', async (req, res) => {
  try {
    const data = await getAllSlips();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST (Sync batch)
app.post('/api/slip', async (req, res) => {
  try {
    const { slips } = req.body;
    const result = await saveOrUpdateBatchSlips(slips);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.message.includes('terkunci') || err.message.includes('dikunci') ? 423 : 500)
       .json({ success: false, message: err.message });
  }
});

// DELETE
app.delete('/api/slip/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSlipById(id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
