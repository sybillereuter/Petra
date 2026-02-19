import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import DatePickerCalendar from './DatePickerCalendar';

const CATEGORY_COLORS = [
  { bg: '#FEE2E2', border: '#F87171', selected: '#EF4444', text: '#991B1B', header: '#DC2626' },
  { bg: '#FEF3C7', border: '#FCD34D', selected: '#F59E0B', text: '#92400E', header: '#D97706' },
  { bg: '#D1FAE5', border: '#6EE7B7', selected: '#10B981', text: '#065F46', header: '#059669' },
  { bg: '#DBEAFE', border: '#93C5FD', selected: '#3B82F6', text: '#1E3A8A', header: '#2563EB' },
  { bg: '#EDE9FE', border: '#C4B5FD', selected: '#8B5CF6', text: '#4C1D95', header: '#7C3AED' },
  { bg: '#FCE7F3', border: '#F9A8D4', selected: '#EC4899', text: '#831843', header: '#DB2777' },
];

const SymptomModal = ({ visible, symptomDate, setSymptomDate, symptomModalInitialDate, selectedSymptoms, toggleSymptom, symptomCategories, t, onClose, onSave }) => {
  const categoryKeys = Object.keys(symptomCategories);
  const getCategoryColor = (categoryKey) => {
    const idx = categoryKeys.indexOf(categoryKey);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '100%', maxWidth: 380, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{t.addSymptom}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#6B7280', fontSize: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{t.date}</Text>
            <DatePickerCalendar
              selectedDate={symptomDate}
              onSelectDate={setSymptomDate}
              initialDate={symptomModalInitialDate}
              weekDays={t.weekDays}
              localeISO={t.localeISO}
            />

            <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 16, marginBottom: 16 }} />

            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{t.pickSymptom}</Text>
            {Object.entries(symptomCategories).map(([categoryKey, category]) => {
              const colors = getCategoryColor(categoryKey);
              return (
                <View key={categoryKey} style={{ marginBottom: 12 }}>
                  <View style={{ backgroundColor: colors.header, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6, alignSelf: 'flex-start' }}>
                    <Text style={{ fontWeight: '500', color: '#fff', marginBottom: 0 }}>{category.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {category.symptoms.map(symptom => {
                      const isSelected = selectedSymptoms.has(symptom.id);
                      return (
                        <TouchableOpacity
                          key={symptom.id}
                          onPress={() => toggleSymptom(symptom.id)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.selected : colors.border,
                            backgroundColor: isSelected ? colors.selected : colors.bg,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? '#fff' : colors.text }}>
                            {isSelected ? '✓ ' : ''}{symptom.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, backgroundColor: '#E5E7EB', padding: 10, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#374151' }}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              style={{ flex: 1, backgroundColor: '#F97316', padding: 10, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff' }}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SymptomModal;