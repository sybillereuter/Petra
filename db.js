import * as SQLite from 'expo-sqlite';

const openDatabase = async () => {
  return await SQLite.openDatabaseAsync('periodtracker.db');
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

      // Todo: Sample Data, cleanup für apk!
      const sampleCycles = [
        { date: '2025-03-30', type: 'period', length: 5 },
        { date: '2025-04-28', type: 'period', length: 4 },
        { date: '2025-05-25', type: 'period', length: 5 },
        { date: '2025-06-23', type: 'period', length: 5 },
        { date: '2025-07-21', type: 'period', length: 5 },
        { date: '2025-08-19', type: 'period', length: 5 },
        { date: '2025-09-17', type: 'period', length: 5 },
        { date: '2025-10-15', type: 'period', length: 5 },
        { date: '2025-11-12', type: 'period', length: 5 }
      ];

      const sampleSymptoms = [
        { date: '2025-10-12', symptom: 'cravings', category: 'symptoms' },
        { date: '2025-10-13', symptom: 'headache', category: 'symptoms' },
        { date: '2025-10-14', symptom: 'sad', category: 'mood' },
        { date: '2025-11-09', symptom: 'tired', category: 'mood' },
        { date: '2025-11-10', symptom: 'cramps', category: 'symptoms' },
        { date: '2025-11-11', symptom: 'bloated', category: 'symptoms' },
      ];

      const cycleCount = await db.getFirstAsync('SELECT COUNT(*) AS count FROM cycles');

      if (cycleCount.count === 0) {
        // Todo: Sample data, cleanup vor apk!
        for (const cycle of sampleCycles) {
          await db.runAsync(
            'INSERT INTO cycles (date, type, length) VALUES (?, ?, ?)',
            [cycle.date, cycle.type, cycle.length]
          );
        }
        setCycles(sampleCycles);
      } else {
        const existingCycles = await db.getAllAsync('SELECT * FROM cycles ORDER BY date');
        setCycles(existingCycles);
      }

      const symptomCount = await db.getFirstAsync('SELECT COUNT(*) AS count FROM symptoms');

      if (symptomCount.count === 0) {
        // Todo: Sample data, cleanup vor apk!
        for (const symptom of sampleSymptoms) {
          await db.runAsync(
            'INSERT INTO symptoms (date, symptom, category) VALUES (?, ?, ?)',
            [symptom.date, symptom.symptom, symptom.category]
          );
        }
        setSymptoms(sampleSymptoms);
      } else {
        const existingSymptoms = await db.getAllAsync('SELECT * FROM symptoms ORDER BY date');
        setSymptoms(existingSymptoms);
      }
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