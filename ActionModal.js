import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';

// todo "periode bearbeiten" macht "+ periode" und eigentlich auch "+ symptom" obsolet, oder?
const ActionModal = ({ visible, selectedDayInfo, t, symptomCategories, onClose, onEditPeriod, onOpenPeriodModal, onOpenSymptomModal }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '100%', maxWidth: 380 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '600' }}>{selectedDayInfo?.dateStr}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#6B7280', fontSize: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          {selectedDayInfo?.cycle?.type === 'period' && (
            <TouchableOpacity
              onPress={() => onEditPeriod(selectedDayInfo.dateStr)}
              style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 8 }}
            >
              <Text style={{ color: '#DC2626' }}>✏️ {t.period} bearbeiten</Text>
            </TouchableOpacity>
          )}

          {/* Hinzufügen-Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => { onClose(); onOpenPeriodModal(selectedDayInfo?.dateStr); }}
              style={{ flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff' }}>{t.period}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { onClose(); onOpenSymptomModal(selectedDayInfo?.dateStr); }}
              style={{ flex: 1, backgroundColor: '#F97316', padding: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff' }}>{t.symptom}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ActionModal;