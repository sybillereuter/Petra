export const getAverageCycleLength = (cycles) => {
  if (cycles.length < 2) return 28;
  const lengths = [];
  for (let i = 1; i < cycles.length; i++) {
    const prev = new Date(cycles[i-1].date);
    const curr = new Date(cycles[i].date);
    lengths.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
  }
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
};

export const getNextCycleStart = (startDate, cycles) => {
  const cycleLength = getAverageCycleLength(cycles);
  const next = new Date(startDate);
  next.setDate(startDate.getDate() + cycleLength);
  return next;
};

export const predictNextPeriod = (cycles) => {
  if (cycles.length === 0) return null;
  const lastPeriod = new Date(cycles[cycles.length - 1].date);
  const avgCycle = getAverageCycleLength(cycles);
  const nextPeriod = new Date(lastPeriod);
  // todo: gewichtete durchschnittliche laenge der letzten zyklen?
  // todo: symptome haben bedeutung (z.b. brustspannen -> in den naechsten tagen)
  nextPeriod.setDate(lastPeriod.getDate() + avgCycle);
  // Todo: wirklich null wenn überfällig? vielleicht doch die vorhergesagten?
  return nextPeriod > new Date() ? nextPeriod : null;
};

export const getOverdueDays = (cycles) => {
  if (!cycles || cycles.length === 0) return [];
  const lastPeriod = new Date(cycles[cycles.length - 1].date);
  const expectedNext = new Date(lastPeriod);
  expectedNext.setDate(lastPeriod.getDate() + getAverageCycleLength(cycles));

  if (expectedNext > new Date()) return []; // Nicht überfällig

  const overdue = [];
  let current = new Date(expectedNext);
  while (current <= new Date()) {
    overdue.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return overdue;
};

export const predictOvulation = (cycles) => {
  const nextPeriod = predictNextPeriod(cycles);
  if (!nextPeriod) return null;
  const ovulation = new Date(nextPeriod);
  ovulation.setDate(nextPeriod.getDate() - 14);
  return ovulation;
};

export const getAllOvulations = (cycles) => {
  const ovulations = [];
  let currentPeriod = predictNextPeriod(cycles);
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  while (currentPeriod && currentPeriod < endDate) {
    const ovulation = new Date(currentPeriod);
    ovulation.setDate(currentPeriod.getDate() - 14);
    ovulations.push(ovulation);
    currentPeriod = getNextCycleStart(currentPeriod, cycles);
  }
  return ovulations;
};

export const getFertileDays = (cycles) => {
  const fertileDays = [];
  const ovulations = getAllOvulations(cycles);
  ovulations.forEach(ovulation => {
    for (let i = -2; i <= 2; i++) {
      const day = new Date(ovulation);
      day.setDate(ovulation.getDate() + i);
      fertileDays.push(day);
    }
  });
  return fertileDays;
};

export const getPredictedPeriodDays = (cycles) => {
  const predictions = [];
  let current = predictNextPeriod(cycles);
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  while (current && current < endDate) {
    const avgLength = 5;
    for (let i = 0; i < avgLength; i++) {
      const day = new Date(current);
      day.setDate(current.getDate() + i);
      predictions.push(day);
    }
    current = getNextCycleStart(current, cycles);
  }
  return predictions;
};