const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysDiff = (a, b) => Math.round((a - b) / (1000 * 60 * 60 * 24));

export const getCurrentPhase = (cycles) => {
  if (!cycles || cycles.length === 0) return null;

  const today = todayMidnight();

  const sortedPeriods = cycles
    .filter(c => c.type === 'period')
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  if (!lastPeriod) return null;

  const periodStart = parseLocalDate(lastPeriod.date);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + lastPeriod.length - 1);

  const dayOfPeriod = daysDiff(today, periodStart);

  if (today >= periodStart && today <= periodEnd) {
    if (dayOfPeriod === 0) return { phase: 'period_day1' };
    return { phase: 'period', day: dayOfPeriod + 1 };
  }

  // TODO berechne nächsten eisprung nicht mehrmals
  const avgCycle = cycles.length >= 2 ? (() => {
    const lengths = [];
    for (let i = 1; i < sortedPeriods.length; i++) {
      const prev = parseLocalDate(sortedPeriods[i-1].date);
      const curr = parseLocalDate(sortedPeriods[i].date);
      lengths.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
    }
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  })() : 28;

  const nextPeriodDate = new Date(periodStart);
  nextPeriodDate.setDate(periodStart.getDate() + avgCycle);
  const ovulationDate = new Date(nextPeriodDate);
  ovulationDate.setDate(nextPeriodDate.getDate() - 14);

  const daysToOvulation = daysDiff(ovulationDate, today);
  const daysAfterOvulation = daysDiff(today, ovulationDate);

  if (daysToOvulation === 0) return { phase: 'ovulation' };
  if (daysToOvulation === 1 || daysToOvulation === 2) return { phase: 'pre_ovulation', daysToOvulation };
  if (daysAfterOvulation >= 1 && daysAfterOvulation <= 2) return { phase: 'post_ovulation', daysAfterOvulation };
  if (daysAfterOvulation > 2 && daysAfterOvulation <= 9) return { phase: 'early_luteal', day: daysAfterOvulation };
  if (daysAfterOvulation > 9) return { phase: 'late_luteal', day: daysAfterOvulation };

  return { phase: 'follicular' };
};

const PHASE_SYMPTOMS = {
  period_day1: ['cramps', 'back_pain', 'bloated', 'tired', 'headache', 'diarrhea', 'sick'],
  period: ['cramps', 'back_pain', 'tired', 'low_energy', 'bloated', 'headache'],
  follicular: ['happy', 'dynamic', 'high_libido', 'watery', 'creamy'],
  pre_ovulation: ['egg_white', 'high_libido', 'dynamic', 'happy', 'bloated'],
  ovulation: ['egg_white', 'high_libido', 'dynamic', 'bloated', 'back_pain'],
  post_ovulation: ['creamy', 'sticky', 'tired', 'bloated'],
  early_luteal: ['sore_breast', 'tired', 'bloated', 'creamy', 'acne'],
  late_luteal: ['sore_breast', 'cravings', 'tired', 'brain_fog', 'sad', 'angry', 'bloated', 'weight', 'sleeplessness', 'night_sweats', 'acne', 'headache'],
};

export const getPhasePrediction = (cycles, symptoms, symptomCategories, t) => {
  const phaseInfo = getCurrentPhase(cycles);
  if (!phaseInfo) return null;

  const { phase } = phaseInfo;
  const typicalSymptomIds = PHASE_SYMPTOMS[phase] || [];
  const phaseLabel = t.phaseLabels?.[phase] || phase;

  // TODO zähle wie oft das historisch aufgetreten ist, testen mit mehr daten (irgendwann trimmen?)
  const sortedPeriods = cycles
    .filter(c => c.type === 'period')
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  const trackedCounts = {};
  const cycleCount = sortedPeriods.length;

  if (cycleCount >= 2) {
    symptoms.forEach(s => {
      const symptomDate = parseLocalDate(s.date);
      const symptomPhaseInfo = getCurrentPhaseForDate(symptomDate, cycles);
      if (symptomPhaseInfo?.phase === phase) {
        trackedCounts[s.symptom] = (trackedCounts[s.symptom] || 0) + 1;
      }
    });
  }

  const hasTrackedData = Object.keys(trackedCounts).length > 0;

  let displaySymptomIds;
  if (hasTrackedData && cycleCount >= 2) {
    const tracked = Object.entries(trackedCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    const additional = typicalSymptomIds.filter(id => !tracked.includes(id));
    displaySymptomIds = [...tracked, ...additional].slice(0, 6);
  } else {
    displaySymptomIds = typicalSymptomIds.slice(0, 6);
  }

  const allSymptoms = Object.values(symptomCategories).flatMap(cat => cat.symptoms);
  const displaySymptoms = displaySymptomIds
    .map(id => allSymptoms.find(s => s.id === id))
    .filter(Boolean);

  let intro;
  if (!hasTrackedData || cycleCount < 2) {
    intro = t.phaseIntroTypical.replace('{phase}', phaseLabel);
  } else if (cycleCount >= 5 && phaseInfo.day) {
    intro = t.phaseIntroByDay.replace('{day}', phaseInfo.day);
  } else {
    intro = t.phaseIntroTracked.replace('{phase}', phaseLabel);
  }

  return { intro, symptoms: displaySymptoms, phaseLabel };
};

const getCurrentPhaseForDate = (date, cycles) => {
  const sortedPeriods = cycles
    .filter(c => c.type === 'period')
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  for (let i = 0; i < sortedPeriods.length; i++) {
    const periodStart = parseLocalDate(sortedPeriods[i].date);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + sortedPeriods[i].length - 1);

    if (date >= periodStart && date <= periodEnd) {
      const day = daysDiff(date, periodStart);
      return day === 0 ? { phase: 'period_day1' } : { phase: 'period', day: day + 1 };
    }

    if (i < sortedPeriods.length - 1) {
      const nextPeriodStart = parseLocalDate(sortedPeriods[i + 1].date);
      const ovulation = new Date(nextPeriodStart);
      ovulation.setDate(nextPeriodStart.getDate() - 14);

      if (date > periodEnd && date < nextPeriodStart) {
        const daysToOv = daysDiff(ovulation, date);
        const daysAfterOv = daysDiff(date, ovulation);
        if (daysToOv === 0) return { phase: 'ovulation' };
        if (daysToOv === 1 || daysToOv === 2) return { phase: 'pre_ovulation', daysToOvulation: daysToOv };
        if (daysAfterOv >= 1 && daysAfterOv <= 2) return { phase: 'post_ovulation' };
        if (daysAfterOv > 2 && daysAfterOv <= 9) return { phase: 'early_luteal', day: daysAfterOv };
        if (daysAfterOv > 9) return { phase: 'late_luteal', day: daysAfterOv };
        return { phase: 'follicular' };
      }
    }
  }
  return null;
};