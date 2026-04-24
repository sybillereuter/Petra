import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import {
  getAllOvulations, getFertileDays, getPredictedPeriodDays, getOverdueDays
} from './cycleUtils';

const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getCycleDay = (dateStr, cycles) => {
  const date = parseLocalDate(dateStr);
  const periodCycles = cycles
    .filter(c => c.type === 'period')
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  const lastPeriod = periodCycles.find(c => parseLocalDate(c.date) <= date);
  if (!lastPeriod) return null;
  const start = parseLocalDate(lastPeriod.date);
  const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

const CalendarTab = ({ currentDate, setCurrentDate, cycles, symptoms, todayStr, t, openPeriodModal, openSymptomModal, onDayPress }) => {

  const dateToStr = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startOffset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const getWeeks = () => {
    const days = generateCalendar();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  };

  const today = useMemo(() => parseLocalDate(todayStr), [todayStr]);

  const { fertileDays, allOvulations, nextOvulation, nextFertileStart, nextFertileEnd, lastPeriodCycle, overdueDays } = useMemo(() => {
    const fertileDays = getFertileDays(cycles);
    const allOvulations = getAllOvulations(cycles);
    const overdueDays = getOverdueDays(cycles);

    const sortedPeriods = cycles
      .filter(c => c.type === 'period')
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    const lastPeriodCycle = sortedPeriods[sortedPeriods.length - 1] || null;

    const todayTime = parseLocalDate(todayStr).getTime();
    const futureOvulations = allOvulations
      .filter(ov => ov.getTime() >= todayTime)
      .sort((a, b) => a - b);
    const nextOvulation = futureOvulations[0] || null;

    const nextFertileStart = nextOvulation ? (() => { const d = new Date(nextOvulation); d.setDate(d.getDate() - 2); return d; })() : null;
    const nextFertileEnd = nextOvulation ? (() => { const d = new Date(nextOvulation); d.setDate(d.getDate() + 2); return d; })() : null;

    return { fertileDays, allOvulations, nextOvulation, nextFertileStart, nextFertileEnd, lastPeriodCycle, overdueDays };
  }, [cycles, todayStr]);

  const getDayInfo = (day) => {
    if (!day) return {};
    const dateStr = dateToStr(currentDate.getFullYear(), currentDate.getMonth(), day);
    const currentDayDate = parseLocalDate(dateStr);
    const currentTime = currentDayDate.getTime();
    const todayTime = today.getTime();

    const periodCycle = cycles.find(cycle => {
      if (cycle.type !== 'period') return false;
      const startDate = parseLocalDate(cycle.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + cycle.length - 1);
      return currentDayDate >= startDate && currentDayDate <= endDate;
    });
    const hasPeriod = !!periodCycle;
    const isLastPeriod = hasPeriod && lastPeriodCycle && periodCycle.date === lastPeriodCycle.date;
    const isPastPeriod = hasPeriod && !isLastPeriod;

    const daySymptoms = symptoms.filter(s => s.date === dateStr);
    const predictedPeriodDays = getPredictedPeriodDays(cycles);

    const isFertile = fertileDays.some(fd => fd.getTime() === currentTime);
    const isPredictedPeriod = predictedPeriodDays.some(pd => { const n = new Date(pd); n.setHours(0,0,0,0); return n.getTime() === currentTime; });
    const isOvulation = allOvulations.some(ov => ov.getTime() === currentTime);
    const isOverdue = overdueDays.some(od => { const n = new Date(od); n.setHours(0,0,0,0); return n.getTime() === currentTime; });
    const isToday = currentTime === todayTime;
    const isPast = currentTime < todayTime;

    const isNextOvulation = nextOvulation && currentTime === nextOvulation.getTime();
    const isPartOfNextFertilePhase = !!(nextFertileStart && nextFertileEnd &&
      currentDayDate >= nextFertileStart && currentDayDate <= nextFertileEnd);

    const isNextFertile = isPartOfNextFertilePhase && !isNextOvulation;
    const isPastFertile = (isFertile || isOvulation) && isPast && !isPartOfNextFertilePhase;
    const isFarFutureFertile = (isFertile || isOvulation) && !isPast && !isPartOfNextFertilePhase && !isNextOvulation;

    return {
      cycle: hasPeriod ? { type: 'period' } : null,
      isPastPeriod,
      isLastPeriod,
      symptoms: daySymptoms,
      isOverdue,
      isFertile,
      isOvulation,
      isPastFertile,
      isNextFertile,
      isNextOvulation,
      isFarFutureFertile,
      isPredictedPeriod,
      isToday,
      dateStr
    };
  };

  const todayCycleDay = useMemo(() => getCycleDay(todayStr, cycles), [todayStr, cycles]);

  const todayTime = today.getTime();
  const todayIsPeriod = cycles.some(cycle => {
    if (cycle.type !== 'period') return false;
    const startDate = parseLocalDate(cycle.date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + cycle.length - 1);
    return today >= startDate && today <= endDate;
  });
  const todayIsOverdue = overdueDays.length > 0 && !todayIsPeriod;
  const todayIsOvulation = allOvulations.some(ov => ov.getTime() === todayTime);
  const todayIsFertile = fertileDays.some(fd => fd.getTime() === todayTime);

  const cycleDayBoxStyle = (() => {
    if (todayIsPeriod) return {
      bg: '#FDF2F8', border: '#DC2626',
      labelColor: '#DC2626', valueColor: '#DC2626'
    };
    if (todayIsOverdue) return {
      bg: '#506896', border: '#394a6b',
      labelColor: '#BFDBFE', valueColor: '#FFFFFF'
    };
    if (todayIsOvulation || todayIsFertile) return {
      bg: '#DBEAFE', border: '#93C5FD',
      labelColor: '#1E40AF', valueColor: '#1E3A8A'
    };
    return {
      bg: '#FFFFFF', border: '#E5E7EB',
      labelColor: '#6B7280', valueColor: '#111827'
    };
  })();

  return (
    <View style={{ padding: 16 }}>

      {/* Zyklustag-Anzeige */}
      {(todayCycleDay !== null || todayIsOverdue) && (
        <View style={{ backgroundColor: cycleDayBoxStyle.bg, borderWidth: 1, borderColor: cycleDayBoxStyle.border, borderRadius: 10, padding: 14, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: cycleDayBoxStyle.labelColor, marginBottom: 2 }}>{t.today}</Text>
          {todayCycleDay !== null && (
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: cycleDayBoxStyle.valueColor }}>
              {t.cycleDay.replace('{day}', todayCycleDay)}
            </Text>
          )}
          {todayIsOverdue && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: cycleDayBoxStyle.valueColor, marginTop: todayCycleDay !== null ? 4 : 0 }}>
              ⚠️ {t.overdueWarning.replace('{days}', overdueDays.length)}
            </Text>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} style={{ padding: 8 }}>
          <Text style={{ color: '#4B5563' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>
          {currentDate.toLocaleDateString(t.localeISO, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} style={{ padding: 8 }}>
          <Text style={{ color: '#4B5563' }}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {t.weekDays.map(day => (
            <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#6B7280' }}>{day}</Text>
            </View>
          ))}
        </View>

        {getWeeks().map((week, wi) => (
          <View key={`w-${wi}`} style={{ flexDirection: 'row' }}>
            {week.map((day, di) => {
              if (!day) return <View key={`e-${wi}-${di}`} style={{ flex: 1, height: 48 }} />;

              const dayInfo = getDayInfo(day);
              const isPeriod = dayInfo.cycle?.type === 'period';
              const hasSymptoms = dayInfo.symptoms.length > 0;

              let baseStyle = {
                flex: 1, height: 48, borderRadius: 6,
                position: 'relative', borderWidth: 2, justifyContent: 'center',
                alignItems: 'center', paddingHorizontal: 1, borderStyle: 'solid'
              };
              let textColor = '#374151';

              if (isPeriod && dayInfo.isPastPeriod) {
                baseStyle = { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: 'transparent', borderStyle: 'solid', opacity: 0.6 };
                textColor = '#EF4444';
              } else if (isPeriod) {
                baseStyle = { ...baseStyle, backgroundColor: '#EF4444', borderColor: '#EF4444', borderStyle: 'solid' };
                textColor = '#FFFFFF';
              } else if (dayInfo.isOverdue) {
                baseStyle = { ...baseStyle, backgroundColor: '#506896', borderColor: '#394a6b', borderStyle: 'solid' };
                textColor = '#FFFFFF';
              } else if (dayInfo.isPastFertile) {
                baseStyle = { ...baseStyle, backgroundColor: dayInfo.isOvulation ? '#BFDBFE' : '#DBEAFE', borderColor: 'transparent', borderStyle: 'solid', opacity: 0.5 };
                textColor = '#3B82F6';
              } else if (dayInfo.isNextOvulation) {
                baseStyle = { ...baseStyle, backgroundColor: '#BFDBFE', borderColor: '#3B82F6', borderStyle: 'solid' };
                textColor = '#1E3A8A';
              } else if (dayInfo.isNextFertile) {
                baseStyle = { ...baseStyle, backgroundColor: '#DBEAFE', borderColor: '#93C5FD', borderStyle: 'solid' };
                textColor = '#1E40AF';
              } else if (dayInfo.isPredictedPeriod) {
                baseStyle = { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderStyle: 'dashed' };
                textColor = '#B91C1C';
              } else if (dayInfo.isFarFutureFertile) {
                baseStyle = { ...baseStyle, backgroundColor: dayInfo.isOvulation ? '#BFDBFE' : '#DBEAFE', borderColor: '#93C5FD', borderStyle: 'dashed', opacity: 0.7 };
                textColor = dayInfo.isOvulation ? '#1E3A8A' : '#1E40AF';
              } else if (hasSymptoms) {
                baseStyle = { ...baseStyle, backgroundColor: '#FEF3C7', borderColor: 'transparent', borderStyle: 'solid' };
                textColor = '#92400E';
              } else {
                baseStyle = { ...baseStyle, backgroundColor: '#F9FAFB', borderColor: 'transparent', borderStyle: 'solid' };
                textColor = '#374151';
              }

              return (
                <TouchableOpacity key={`d-${wi}-${di}`} onPress={() => onDayPress(day, dayInfo)} style={baseStyle}>
                  <Text style={{ color: textColor, fontWeight: dayInfo.isToday ? 'bold' : 'normal' }}>{day}</Text>
                  {hasSymptoms && (
                    <View style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, backgroundColor: '#FB923C', borderRadius: 4 }} />
                  )}
                  {dayInfo.isPredictedPeriod && !isPeriod && (
                    <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#F87171', borderRadius: 4, opacity: 0.6 }} />
                  )}
                  {dayInfo.isToday && (
                    <View style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderWidth: 2, borderColor: '#A855F7', borderRadius: 8 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legende */}
      <View style={{ marginBottom: 16, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: 3 }} />
          <Text style={{ fontSize: 12, color: '#4B5563' }}>{t.period}</Text>
          <View style={{ width: 12, height: 12, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 3, marginLeft: 12 }} />
          <Text style={{ fontSize: 12, color: '#4B5563' }}>{t.predictedPeriod}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#BFDBFE', borderRadius: 3 }} />
          <Text style={{ fontSize: 12, color: '#4B5563' }}>{t.ovulation}</Text>
          <View style={{ width: 12, height: 12, backgroundColor: '#DBEAFE', borderRadius: 3, marginLeft: 12 }} />
          <Text style={{ fontSize: 12, color: '#4B5563' }}>{t.fertileDays}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => openPeriodModal(null)}
          style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#ffffff', marginLeft: 8 }}>{t.period}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openSymptomModal(null)}
          style={{ flex: 1, backgroundColor: '#F97316', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#ffffff', marginLeft: 8 }}>{t.symptom}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CalendarTab;