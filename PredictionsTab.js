import React from 'react';
import { View, Text } from 'react-native';
import { Heart, Moon } from 'lucide-react-native';
import { predictNextPeriod, predictOvulation, getAverageCycleLength } from './cycleUtils';

const PredictionsTab = ({ cycles, t }) => {
  const nextPeriod = predictNextPeriod(cycles);
  const nextOvulation = predictOvulation(cycles);
  const formatDate = (date) => date.toLocaleDateString(t.localeISO, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View style={{ flex: 1, padding: 16, minHeight: 400 }}>
      <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 16, marginBottom: 16, minHeight: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Heart size={18} color="#DC2626" />
          <Text style={{ fontWeight: '600', color: '#991B1B', marginLeft: 8, fontSize: 16 }}>{t.nextPeriod}</Text>
        </View>
        <Text style={{ color: '#B91C1C', fontSize: 16, marginBottom: 4 }}>{nextPeriod ? formatDate(nextPeriod) : t.noData}</Text>
        <Text style={{ fontSize: 14, color: '#DC2626', marginTop: 4 }}>{t.cycleLength.replace('{days}', getAverageCycleLength(cycles))}</Text>
      </View>
      <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 16, minHeight: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Moon size={18} color="#2563EB" />
          <Text style={{ fontWeight: '600', color: '#1E40AF', marginLeft: 8, fontSize: 16 }}>{t.ovulation}</Text>
        </View>
        <Text style={{ color: '#1D4ED8', fontSize: 16, marginBottom: 4 }}>{nextOvulation ? formatDate(nextOvulation) : t.noData}</Text>
        <Text style={{ fontSize: 14, color: '#2563EB', marginTop: 4 }}>
          {t.fertileDays}: {nextOvulation ? `${formatDate(new Date(nextOvulation.getTime() - 2*24*60*60*1000))} - ${formatDate(new Date(nextOvulation.getTime() + 2*24*60*60*1000))}` : t.unknown}
        </Text>
      </View>
    </View>
  );
};

export default PredictionsTab;