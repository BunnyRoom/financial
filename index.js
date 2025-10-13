const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const app = express();
const PORT = 3000;

const DB_FILE = 'financial.db';
let db = null;

// Initialize SQLite Database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  try {
    // Try to load existing database
    if (fs.existsSync(DB_FILE)) {
      const buffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(buffer);
      console.log('✅ Loaded existing database');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('✅ Created new database');
    }
    
    // Create tables if they don't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('investment', 'received')),
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
    
    // Save database to file
    saveDatabase();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helper function to calculate daily profits
function calculateDailyProfits() {
  const result = db.exec('SELECT * FROM transactions ORDER BY date ASC');
  
  if (!result || result.length === 0 || !result[0].values) {
    return {};
  }
  
  const columns = result[0].columns;
  const rows = result[0].values;
  const dailyData = {};
  
  rows.forEach(row => {
    const transaction = {};
    columns.forEach((col, idx) => {
      transaction[col] = row[idx];
    });
    
    const date = new Date(transaction.date).toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { investment: 0, received: 0, profit: 0 };
    }
    
    if (transaction.type === 'investment') {
      dailyData[date].investment += transaction.amount;
    } else if (transaction.type === 'received') {
      dailyData[date].received += transaction.amount;
    }
  });
  
  // Calculate profit for each day
  Object.keys(dailyData).forEach(date => {
    dailyData[date].profit = dailyData[date].received - dailyData[date].investment;
  });
  
  return dailyData;
}

// Helper function to parse SQL result
function parseResult(result) {
  if (!result || result.length === 0 || !result[0].values) {
    return [];
  }
  
  const columns = result[0].columns;
  const rows = result[0].values;
  
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Helper function to calculate summary
function calculateSummary() {
  const result = db.exec(`
    SELECT 
      SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as totalInvestment,
      SUM(CASE WHEN type = 'received' THEN amount ELSE 0 END) as totalReceived,
      COUNT(*) as transactionCount
    FROM transactions
  `);
  
  const data = parseResult(result)[0] || {
    totalInvestment: 0,
    totalReceived: 0,
    transactionCount: 0
  };
  
  const summary = {
    totalInvestment: data.totalInvestment || 0,
    totalReceived: data.totalReceived || 0,
    totalProfit: 0,
    profitPercentage: 0,
    transactionCount: data.transactionCount || 0
  };
  
  summary.totalProfit = summary.totalReceived - summary.totalInvestment;
  summary.profitPercentage = summary.totalInvestment > 0 
    ? ((summary.totalProfit / summary.totalInvestment) * 100).toFixed(2)
    : 0;
  
  return summary;
}

// API Routes

// Get all transactions
app.get('/api/transactions', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM transactions ORDER BY date DESC, id DESC');
    const transactions = parseResult(result);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
  const { type, amount, description, date } = req.body;
  
  if (!type || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction data' });
  }
  
  if (!['investment', 'received'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }
  
  try {
    db.run(
      'INSERT INTO transactions (type, amount, description, date) VALUES (?, ?, ?, ?)',
      [type, parseFloat(amount), description || '', date || new Date().toISOString()]
    );
    
    saveDatabase();
    
    // Get the last inserted transaction
    const result = db.exec('SELECT * FROM transactions WHERE id = last_insert_rowid()');
    const transaction = parseResult(result)[0];
    
    res.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }
  
  try {
    db.run('DELETE FROM transactions WHERE id = ?', [id]);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get summary
app.get('/api/summary', (req, res) => {
  try {
    const summary = calculateSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error calculating summary:', error);
    res.status(500).json({ error: 'Failed to calculate summary' });
  }
});

// Get daily profits for graph
app.get('/api/daily-profits', (req, res) => {
  try {
    const dailyProfits = calculateDailyProfits();
    
    // Convert to array format for chart
    const data = Object.keys(dailyProfits)
      .sort()
      .slice(-90) // Last 90 days
      .map(date => ({
        date,
        investment: dailyProfits[date].investment,
        received: dailyProfits[date].received,
        profit: dailyProfits[date].profit
      }));
    
    res.json(data);
  } catch (error) {
    console.error('Error calculating daily profits:', error);
    res.status(500).json({ error: 'Failed to calculate daily profits' });
  }
});

// Get monthly summary
app.get('/api/monthly-summary', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM transactions ORDER BY date ASC');
    const transactions = parseResult(result);
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { investment: 0, received: 0, profit: 0 };
      }
      
      if (transaction.type === 'investment') {
        monthlyData[monthKey].investment += transaction.amount;
      } else if (transaction.type === 'received') {
        monthlyData[monthKey].received += transaction.amount;
      }
    });
    
    // Calculate profit
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].profit = monthlyData[month].received - monthlyData[month].investment;
    });
    
    const data = Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        ...monthlyData[month]
      }));
    
    res.json(data);
  } catch (error) {
    console.error('Error calculating monthly summary:', error);
    res.status(500).json({ error: 'Failed to calculate monthly summary' });
  }
});

// Clear all data
app.delete('/api/clear-all', (req, res) => {
  try {
    db.run('DELETE FROM transactions');
    saveDatabase();
    res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// Export data
app.get('/api/export', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM transactions ORDER BY date DESC, id DESC');
    const transactions = parseResult(result);
    
    const exportData = {
      transactions,
      summary: calculateSummary(),
      exportDate: new Date().toISOString(),
      totalRecords: transactions.length
    };
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Backup database
app.get('/api/backup', (req, res) => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const backupFile = `financial-backup-${Date.now()}.db`;
    fs.writeFileSync(backupFile, buffer);
    res.json({ success: true, message: `Database backup created: ${backupFile}` });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get database statistics
app.get('/api/stats', (req, res) => {
  try {
    const statsResult = db.exec(`
      SELECT 
        COUNT(*) as total_transactions,
        MIN(date) as first_transaction_date,
        MAX(date) as last_transaction_date,
        AVG(amount) as average_amount,
        MAX(amount) as max_amount,
        MIN(amount) as min_amount
      FROM transactions
    `);
    const stats = parseResult(statsResult)[0] || {};
    
    const typeStatsResult = db.exec(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM transactions
      GROUP BY type
    `);
    const typeStats = parseResult(typeStatsResult);
    
    // Count unique days
    const uniqueDaysResult = db.exec(`
      SELECT COUNT(DISTINCT date(date)) as unique_days
      FROM transactions
    `);
    const uniqueDays = parseResult(uniqueDaysResult)[0]?.unique_days || 0;
    
    res.json({
      overall: { ...stats, unique_days: uniqueDays },
      byType: typeStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Import data
app.post('/api/import', (req, res) => {
  const { transactions } = req.body;
  
  if (!Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Invalid import data' });
  }
  
  try {
    let imported = 0;
    transactions.forEach(item => {
      if (item.type && item.amount && item.amount > 0) {
        db.run(
          'INSERT INTO transactions (type, amount, description, date) VALUES (?, ?, ?, ?)',
          [item.type, parseFloat(item.amount), item.description || '', item.date || new Date().toISOString()]
        );
        imported++;
      }
    });
    
    saveDatabase();
    res.json({ success: true, imported });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nSaving database and shutting down...');
  saveDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nSaving database and shutting down...');
  saveDatabase();
  process.exit(0);
});

// Start server after database initialization
initDatabase().then(() => {
  app.listen(3001, () => {
    console.log(`💰 Financial System running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_FILE}`);
    console.log(`🔗 API Endpoints: http://localhost:${PORT}/api/`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
