import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import DatePickerCalendar from './DatePickerCalendar';

const PeriodModal = ({ visible, periodStartDate, setPeriodStartDate, periodLength, setPeriodLength, periodModalInitialDate, t, onClose, onSave }) => {
  return (
    // Perioden-Modal
    // Todo: revamp weiter testen
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '100%', maxWidth: 380 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{t.addPeriod}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#6B7280', fontSize: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{t.startDate}</Text>
          <DatePickerCalendar
            selectedDate={periodStartDate}
            onSelectDate={setPeriodStartDate}
            initialDate={periodModalInitialDate}
            weekDays={t.weekDays}
            localeISO={t.localeISO}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 16, gap: 16 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>{t.length}:</Text>
            <TouchableOpacity
              onPress={() => setPeriodLength(l => Math.max(1, l - 1))}
              style={{ width: 36, height: 36, backgroundColor: '#F3F4F6', borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 20, color: '#374151' }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#EF4444', minWidth: 30, textAlign: 'center' }}>{periodLength}</Text>
            <TouchableOpacity
              onPress={() => setPeriodLength(l => Math.min(14, l + 1))}
              style={{ width: 36, height: 36, backgroundColor: '#F3F4F6', borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 20, color: '#374151' }}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, backgroundColor: '#E5E7EB', padding: 10, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#374151' }}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={{ flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#fff' }}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PeriodModal;