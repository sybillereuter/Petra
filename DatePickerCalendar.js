import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const DatePickerCalendar = ({ selectedDate, onSelectDate, initialDate, weekDays, localeISO }) => {
  const [modalMonth, setModalMonth] = useState(() => {
    const base = initialDate ? new Date(initialDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const generateCalendar = () => {
    const year = modalMonth.getFullYear();
    const month = modalMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  };

  const dateToStr = (day) => {
    const y = modalMonth.getFullYear();
    const m = modalMonth.getMonth();
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() - 1, 1))} style={{ padding: 8 }}>
          <Text style={{ color: '#6B7280', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '500', fontSize: 15 }}>
          {modalMonth.toLocaleDateString(localeISO, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() + 1, 1))} style={{ padding: 8 }}>
          <Text style={{ color: '#6B7280', fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {weekDays.map(day => (
          <View key={day} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {generateCalendar().map((day, index) => {
          if (!day) return <View key={`e-${index}`} style={{ width: `${100/7}%`, height: 40 }} />;
          const dateStr = dateToStr(day);
          const isSelected = selectedDate === dateStr;
          return (
            <TouchableOpacity
              key={`d-${day}`}
              onPress={() => onSelectDate(dateStr)}
              style={{
                width: `${100/7}%`,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isSelected ? '#EF4444' : '#F9FAFB',
                borderRadius: 6,
                borderWidth: isSelected ? 0 : 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ color: isSelected ? '#fff' : '#374151', fontSize: 14, fontWeight: isSelected ? 'bold' : 'normal' }}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default DatePickerCalendar;