import React from 'react';
import { View, Text } from 'react-native';
import { getAverageCycleLength } from './cycleUtils';

const StatsTab = ({ cycles, symptoms, symptomCategories, t }) => {
  return (
    <View style={{ flex: 1, padding: 16, minHeight: 400 }}>
      <View style={{ backgroundColor: '#FDF2F8', borderWidth: 1, borderColor: '#FBCFE8', borderRadius: 8, padding: 16, marginBottom: 16, minHeight: 120 }}>
        <Text style={{ fontWeight: '600', color: '#9D174D', marginBottom: 12, fontSize: 16 }}>{t.yourStats}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#DB2777' }}>{getAverageCycleLength(cycles)}</Text>
            <Text style={{ fontSize: 14, color: '#EC4899', textAlign: 'center' }}>{t.cycleDays}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#9333EA' }}>{cycles.length}</Text>
            <Text style={{ fontSize: 14, color: '#A855F7', textAlign: 'center' }}>{t.cyclesTracked}</Text>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 8, padding: 16, flex: 1 }}>
        <Text style={{ fontWeight: '600', color: '#9A3412', marginBottom: 12, fontSize: 16 }}>{t.frequentSymptoms}</Text>
        <View style={{ flex: 1 }}>
          {Object.entries(symptomCategories).map(([categoryKey, category]) => {
            const categorySymptoms = symptoms.filter(s => s.category === categoryKey);
            if (categorySymptoms.length === 0) return null;
            return (
              <View key={categoryKey} style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: '500', color: '#374151', marginBottom: 8, fontSize: 15 }}>{category.name}</Text>
                {category.symptoms.map(symptomType => {
                  const count = categorySymptoms.filter(s => s.symptom === symptomType.id).length;
                  if (count === 0) return null;
                  return (
                    <View key={symptomType.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 16, marginBottom: 4, paddingVertical: 2 }}>
                      <Text style={{ color: '#374151', fontSize: 14, flex: 1 }}>{symptomType.name}</Text>
                      <Text style={{ color: '#EA580C', fontWeight: '500', fontSize: 14 }}>{count}x</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default StatsTab;