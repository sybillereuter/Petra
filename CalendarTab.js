import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import {
  getAllOvulations, getFertileDays, getPredictedPeriodDays, getOverdueDays
} from './cycleUtils';

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

  const getDayInfo = (day) => {
    if (!day) return {};
    const dateStr = dateToStr(currentDate.getFullYear(), currentDate.getMonth(), day);
    const currentDayDate = new Date(dateStr);

    const hasPeriod = cycles.some(cycle => {
      if (cycle.type !== 'period') return false;
      const startDate = new Date(cycle.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + cycle.length - 1);
      return currentDayDate >= startDate && currentDayDate <= endDate;
    });

    const daySymptoms = symptoms.filter(s => s.date === dateStr);
    const fertileDays = getFertileDays(cycles);
    const predictedPeriodDays = getPredictedPeriodDays(cycles);

    const isFertile = fertileDays.some(fd => fd.toDateString() === currentDayDate.toDateString());
    const isPredictedPeriod = predictedPeriodDays.some(pd => pd.toDateString() === currentDayDate.toDateString());
    const isOvulation = getAllOvulations(cycles).some(ov => ov.toDateString() === currentDayDate.toDateString());
    const isOverdue = getOverdueDays(cycles).some(od => od.toDateString() === currentDayDate.toDateString());
    const isToday = dateStr === todayStr;

    return { cycle: hasPeriod ? { type: 'period' } : null, symptoms: daySymptoms, isOverdue, isFertile, isPredictedPeriod, isOvulation, isToday, dateStr };
  };

  const overdueDays = getOverdueDays(cycles);

  return (
    <View style={{ padding: 16 }}>
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
              const isOverdue = dayInfo.isOverdue;
              const hasSymptoms = dayInfo.symptoms.length > 0;

              let baseStyle = {
                flex: 1, height: 48, borderRadius: 6,
                position: 'relative', borderWidth: 2, justifyContent: 'center',
                alignItems: 'center', paddingHorizontal: 1
              };
              if (isPeriod) {
                baseStyle = { ...baseStyle, backgroundColor: '#EF4444', borderColor: '#EF4444' };
              } else if (isOverdue) {
                baseStyle = { ...baseStyle, backgroundColor: '#506896', borderColor: '#394a6b' };
              } else if (dayInfo.isPredictedPeriod) {
                baseStyle = { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderStyle: 'dashed' };
              } else if (dayInfo.isOvulation) {
                baseStyle = { ...baseStyle, backgroundColor: '#BFDBFE', borderColor: '#3B82F6' };
              } else if (dayInfo.isFertile) {
                baseStyle = { ...baseStyle, backgroundColor: '#DBEAFE', borderColor: '#93C5FD' };
              } else if (hasSymptoms) {
                baseStyle = { ...baseStyle, backgroundColor: '#FEF3C7', borderColor: 'transparent' };
              } else {
                baseStyle = { ...baseStyle, backgroundColor: '#F9FAFB', borderColor: 'transparent' };
              }

              const textColor = isPeriod ? '#FFFFFF'
                              : isOverdue ? '#FFFFFF'
                              : dayInfo.isPredictedPeriod ? '#B91C1C'
                              : dayInfo.isOvulation ? '#1E3A8A'
                              : dayInfo.isFertile ? '#1E40AF'
                              : hasSymptoms ? '#92400E'
                              : '#374151';

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

      {/* Überfällig Warnung */}
      {overdueDays.length > 0 && (
        <View className="bg-blue-100 border border-blue-300 rounded p-3 mb-4">
          <Text className="text-blue-800 font-bold text-center">
            {t.overdueWarning.replace('{days}', overdueDays.length)}
          </Text>
        </View>
      )}

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