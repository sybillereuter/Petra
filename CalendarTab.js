
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
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
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
    <View className="p-4">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 rounded">
          <Text className="text-gray-600">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{currentDate.toLocaleDateString(t.localeISO, { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 rounded">
          <Text className="text-gray-600">→</Text>
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

        {/* Calendar Days */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {generateCalendar().map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={{ width: `${100/7}%`, height: 48 }} />;

            const dayInfo = getDayInfo(day);
            const isPeriod = dayInfo.cycle?.type === 'period';
            const isOverdue = dayInfo.isOverdue;
            const hasSymptoms = dayInfo.symptoms.length > 0;

            let baseStyle = {
              width: `${100/7}%`, height: 48, borderRadius: 6, fontSize: 14,
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
                            : dayInfo.isOverdue ? '#FFFFFF'
                            : dayInfo.isPredictedPeriod ? '#B91C1C'
                            : dayInfo.isOvulation ? '#1E3A8A'
                            : dayInfo.isFertile ? '#1E40AF'
                            : hasSymptoms ? '#92400E'
                            : '#374151';

            return (
              <TouchableOpacity key={`day-${day}`} onPress={() => onDayPress(day, dayInfo)} style={baseStyle}>
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
      </View>

      {/* Legende */}
      <View className="text-xs text-gray-600 mb-4 space-y-1">
        <View className="flex-row items-center space-x-2">
          <View className="w-3 h-3 bg-red-500 rounded" />
          <Text>{t.period}</Text>
          <View className="w-3 h-3 bg-red-100 border border-red-300 border-dashed rounded ml-4" />
          <Text>{t.predictedPeriod}</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <View className="w-3 h-3 bg-blue-200 rounded" />
          <Text>{t.ovulation}</Text>
          <View className="w-3 h-3 bg-blue-100 rounded ml-4" />
          <Text>{t.fertileDays}</Text>
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
      <View className="flex-row space-x-2">
        <TouchableOpacity onPress={() => openPeriodModal(null)} className="flex-1 bg-red-500 py-2 px-4 rounded-lg items-center justify-center flex-row">
          <Plus size={16} color="#fff" />
          <Text className="text-white ml-2">{t.period}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openSymptomModal(null)} className="flex-1 bg-orange-500 py-2 px-4 rounded-lg items-center justify-center flex-row">
          <Plus size={16} color="#fff" />
          <Text className="text-white ml-2">{t.symptom}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CalendarTab;