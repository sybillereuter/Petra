import * as SQLite from 'expo-sqlite';

const openDatabase = async () => {
  return await SQLite.openDatabaseAsync('periodtracker-v3.db');
};

const initDatabase = async (setCycles, setSymptoms) => {
  const db = await openDatabase();

  try {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cycles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          length INTEGER NOT NULL
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS symptoms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          symptom TEXT NOT NULL,
          category TEXT NOT NULL
        );
      `);

      const existingCycles = await db.getAllAsync('SELECT * FROM cycles ORDER BY date');
      setCycles(existingCycles);

      const existingSymptoms = await db.getAllAsync('SELECT * FROM symptoms ORDER BY date');
      setSymptoms(existingSymptoms);
    });
  } catch (error) {
    console.error('Database initialization error:', error);
  }

  return db;
};

const addCycle = async (startDate, type, length) => {
  const db = await openDatabase();
  try {
    for (let i = 0; i < length; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      await db.runAsync(
        'INSERT INTO cycles (date, type, length) VALUES (?, ?, ?)',
        [dateStr, type, length]
      );
    }
  } catch (error) {
    console.error('Error adding cycle:', error);
    throw error;
  }
};

const addSymptom = async (date, symptom, category) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'INSERT INTO symptoms (date, symptom, category) VALUES (?, ?, ?)',
      [date, symptom, category]
    );
    return result;
  } catch (error) {
    console.error('Error adding symptom:', error);
    throw error;
  }
};

const getCycles = async () => {
  const db = await openDatabase();
  try {
    return await db.getAllAsync('SELECT * FROM cycles ORDER BY date');
  } catch (error) {
    console.error('Error getting cycles:', error);
    throw error;
  }
};

const getSymptoms = async () => {
  const db = await openDatabase();
  try {
    return await db.getAllAsync('SELECT * FROM symptoms ORDER BY date');
  } catch (error) {
    console.error('Error getting symptoms:', error);
    throw error;
  }
};

export { openDatabase, initDatabase, addCycle, addSymptom, getCycles, getSymptoms };