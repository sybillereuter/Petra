import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Modal, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { db, initDatabase } from './db';
import { Calendar, Plus, TrendingUp, Heart, Moon, Brain } from 'lucide-react-native';
import strings from './strings';
import symptomStrings from './symptomStrings';

const PetraTracker = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycles, setCycles] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [newPeriodDate, setNewPeriodDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPeriodLength, setNewPeriodLength] = useState(5);
  const [newSymptomDate, setNewSymptomDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [locale, setLocale] = useState('de'); // todo: picker
  const t = strings[locale];
  const symptomCategories = symptomStrings[locale];

  const allSymptoms = Object.values(symptomCategories).flatMap(cat => cat.symptoms);

  useEffect(() => {
    initDatabase(setCycles, setSymptoms); // sqlite initialisierung (später)
  }, []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const getAverageCycleLength = () => {
    if (cycles.length < 2) return 28;
    const lengths = [];
    for (let i = 1; i < cycles.length; i++) {
      const prev = new Date(cycles[i-1].date);
      const curr = new Date(cycles[i].date);
      lengths.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
    }
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  };

  const predictNextPeriod = () => {
    if (cycles.length === 0) return null;
    const lastPeriod = new Date(cycles[cycles.length - 1].date);
    const avgCycle = getAverageCycleLength();
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(lastPeriod.getDate() + avgCycle);

    // Todo: wirklich null wenn überfällig? vielleicht doch die vorhergesagten?
    return nextPeriod > new Date() ? nextPeriod : null;
  };

  const getOverdueDays = () => {
    if (!cycles || cycles.length === 0) return [];
    const lastPeriod = new Date(cycles[cycles.length - 1].date);
    const expectedNext = new Date(lastPeriod);
    expectedNext.setDate(lastPeriod.getDate() + getAverageCycleLength());

    if (expectedNext > new Date()) return []; // Nicht überfällig

    const overdue = [];
    let current = new Date(expectedNext);
    while (current <= new Date()) {
      overdue.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return overdue;
  };

  const predictOvulation = () => {
    const nextPeriod = predictNextPeriod();
    if (!nextPeriod) return null;
    const ovulation = new Date(nextPeriod);
    ovulation.setDate(nextPeriod.getDate() - 14);
    return ovulation;
  };

  const getAllOvulations = () => {
    const ovulations = [];
    let currentPeriod = predictNextPeriod();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    while (currentPeriod && currentPeriod < endDate) {
      const ovulation = new Date(currentPeriod);
      ovulation.setDate(currentPeriod.getDate() - 14);
      ovulations.push(ovulation);

      currentPeriod = getNextCycleStart(currentPeriod);
    }
    return ovulations;
  };

  const getFertileDays = () => {
    const fertileDays = [];
    const ovulations = getAllOvulations();

    ovulations.forEach(ovulation => {
      for (let i = -2; i <= 2; i++) {
        const day = new Date(ovulation);
        day.setDate(ovulation.getDate() + i);
        fertileDays.push(day);
      }
    });
    return fertileDays;
  };

  const getPredictedPeriodDays = () => {
    const predictions = [];
    let current = predictNextPeriod();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    while (current && current < endDate) {
      const avgLength = 5;
      for (let i = 0; i < avgLength; i++) {
        const day = new Date(current);
        day.setDate(current.getDate() + i);
        predictions.push(day);
      }
      current = getNextCycleStart(current);
    }
    return predictions;
  };

  const getNextCycleStart = (startDate) => {
    const cycleLength = getAverageCycleLength();
    const next = new Date(startDate);
    next.setDate(startDate.getDate() + cycleLength);
    return next;
  };

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

  const formatDate = (date) => date.toLocaleDateString(t.localeISO, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getDayInfo = (day) => {
      if (!day) return {};
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDayDate = new Date(dateStr);

      const hasPeriod = cycles.some(cycle => {
        if (cycle.type !== 'period') return false;
        const startDate = new Date(cycle.date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + cycle.length - 1);
        return currentDayDate >= startDate && currentDayDate <= endDate;
      });

      const daySymptoms = symptoms.filter(s => s.date === dateStr);

      const fertileDays = getFertileDays();
      const predictedPeriodDays = getPredictedPeriodDays();
      const ovulation = predictOvulation();

      const isFertile = fertileDays.some(fd => fd.toDateString() === currentDayDate.toDateString());
      const isPredictedPeriod = predictedPeriodDays.some(pd => pd.toDateString() === currentDayDate.toDateString());
      const isOvulation = getAllOvulations().some(ov => ov.toDateString() === currentDayDate.toDateString());
      const isOverdue = getOverdueDays().some(od => od.toDateString() === currentDayDate.toDateString());
      const isToday = dateStr === todayStr;

      return { cycle: hasPeriod ? { type: 'period' } : null, symptoms: daySymptoms, isOverdue, isFertile, isPredictedPeriod, isOvulation, isToday };
    };

  const addPeriod = () => {
    const newCycle = { date: newPeriodDate, type: 'period', length: newPeriodLength };
    setCycles([...cycles, newCycle].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setShowAddPeriod(false);
  };

  const addSymptom = () => {
    if (!selectedSymptom) return;
    const category = Object.keys(symptomCategories).find(cat => symptomCategories[cat].symptoms.some(s => s.id === selectedSymptom));
    const newSymptom = { date: newSymptomDate, symptom: selectedSymptom, category: category };
    setSymptoms([...symptoms, newSymptom]);
    setShowAddSymptom(false);
    setSelectedSymptom('');
  };

  const nextPeriod = predictNextPeriod();
  const nextOvulation = predictOvulation();

  // Todo: Period/Symptom Modal: 1. auch bei Klick auf Datum 2. auch entfernen
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 w-full bg-white">

        {/* Header */}
        <View style={{
          backgroundColor: '#EC4899',
          paddingVertical: 16,
          paddingHorizontal: 16
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#FFFFFF'
          }}>
            {t.appName}
          </Text>
          <Text style={{
            textAlign: 'center',
            color: '#FBCFE8',
            fontSize: 14,
            marginTop: 4
          }}>
            {t.tagline}
          </Text>
        </View>

          {/* Navigation */}
          <View className="flex-row border-b bg-gray-50">
            <TouchableOpacity onPress={() => setActiveTab('calendar')} className={`flex-1 py-3 px-4 ${activeTab === 'calendar' ? 'border-b-2 border-pink-500' : ''}`}>
              <View className="items-center">
                <Calendar size={20} color={activeTab === 'calendar' ? '#DB2777' : '#6B7280'} />
                <Text className={`text-xs ${activeTab === 'calendar' ? 'text-pink-600' : 'text-gray-600'}`}>{t.calendar}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('predictions')} className={`flex-1 py-3 px-4 ${activeTab === 'predictions' ? 'border-b-2 border-pink-500' : ''}`}>
              <View className="items-center">
                <TrendingUp size={20} color={activeTab === 'predictions' ? '#DB2777' : '#6B7280'} />
                <Text className={`text-xs ${activeTab === 'predictions' ? 'text-pink-600' : 'text-gray-600'}`}>{t.predictions}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('stats')} className={`flex-1 py-3 px-4 ${activeTab === 'stats' ? 'border-b-2 border-pink-500' : ''}`}>
              <View className="items-center">
                <Brain size={20} color={activeTab === 'stats' ? '#DB2777' : '#6B7280'} />
                <Text className={`text-xs ${activeTab === 'stats' ? 'text-pink-600' : 'text-gray-600'}`}>{t.analysis}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <View className="p-4">
              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 rounded">
                  <Text className="text-gray-600">←</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold">{currentDate.toLocaleDateString(t.localeISO, { month: 'long', year: 'numeric' })}</Text>

                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 rounded">
                  <Text className="text-gray-600">→</Text>
                </TouchableOpacity>
              </View>

      {/* Calendar Grid */}
      <View style={{ marginBottom: 16 }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row' }}>
          {t.weekDays.map(day => (
            <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#6B7280' }}>
                {day}
              </Text>
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
              width: `${100/7}%`,
              height: 48,
              borderRadius: 6,
              fontSize: 14,
              position: 'relative',
              borderWidth: 2,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 1
            };
            if (isPeriod) {
              baseStyle = { ...baseStyle, backgroundColor: '#EF4444', borderColor: '#EF4444' };
            } else if (isOverdue) {
              baseStyle = { ...baseStyle, backgroundColor: '#506896', borderColor: '#394a6b' };
            } else if (dayInfo.isPredictedPeriod) {
              baseStyle = { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderStyle: 'dashed' };
            } else if (dayInfo.isOvulation) {
              baseStyle = { ...baseStyle, backgroundColor: '#BFDBFE', borderColor: '#3B82F6', fontWeight: 'bold' };
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
              <TouchableOpacity key={`day-${day}`} onPress={() => setSelectedDate(day)} style={baseStyle}>
                <Text style={{ color: textColor, fontWeight: dayInfo.isToday ? 'bold' : 'normal' }}>
                  {day}
                </Text>
                {hasSymptoms && (
                  <View style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    backgroundColor: '#FB923C',
                    borderRadius: 4
                  }} />
                )}
                {dayInfo.isPredictedPeriod && !isPeriod && (
                  <View style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    backgroundColor: '#F87171',
                    borderRadius: 4,
                    opacity: 0.6
                  }} />
                )}
                {dayInfo.isToday && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    borderWidth: 2,
                    borderColor: '#A855F7',
                    borderRadius: 8
                  }} />
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
      {getOverdueDays().length > 0 && (
        <View className="bg-blue-100 border border-blue-300 rounded p-3 mb-4">
          <Text className="text-blue-800 font-bold text-center">
            {t.overdueWarning.replace('{days}', getOverdueDays().length)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row space-x-2">
        <TouchableOpacity onPress={() => setShowAddPeriod(true)} className="flex-1 bg-red-500 py-2 px-4 rounded-lg items-center justify-center flex-row">
          <Plus size={16} color="#fff" />
          <Text className="text-white ml-2">{t.period}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAddSymptom(true)} className="flex-1 bg-orange-500 py-2 px-4 rounded-lg items-center justify-center flex-row">
          <Plus size={16} color="#fff" />
          <Text className="text-white ml-2">{t.symptom}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}

  {/* Predictions Tab */}
  {activeTab === 'predictions' && (
    <View style={{
      flex: 1,
      padding: 16,
      minHeight: 400
    }}>
      <View style={{
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        minHeight: 120
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Heart size={18} color="#DC2626" />
          <Text style={{
            fontWeight: '600',
            color: '#991B1B',
            marginLeft: 8,
            fontSize: 16
          }}>
            {t.nextPeriod}
          </Text>
        </View>
        <Text style={{
          color: '#B91C1C',
          fontSize: 16,
          marginBottom: 4
        }}>
          {nextPeriod ? formatDate(nextPeriod) : t.noData}
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#DC2626',
          marginTop: 4
        }}>
          {t.cycleLength.replace('{days}', getAverageCycleLength())}
        </Text>
      </View>

      <View style={{
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 8,
        padding: 16,
        minHeight: 120
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Moon size={18} color="#2563EB" />
          <Text style={{
            fontWeight: '600',
            color: '#1E40AF',
            marginLeft: 8,
            fontSize: 16
          }}>
            {t.ovulation}
          </Text>
        </View>
        <Text style={{
          color: '#1D4ED8',
          fontSize: 16,
          marginBottom: 4
        }}>
          {nextOvulation ? formatDate(nextOvulation) : t.noData}
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#2563EB',
          marginTop: 4
        }}>
          {t.fertileDays}: {nextOvulation ? `${formatDate(new Date(nextOvulation.getTime() - 2*24*60*60*1000))} - ${formatDate(new Date(nextOvulation.getTime() + 2*24*60*60*1000))}` : t.unknown}
        </Text>
      </View>
    </View>
  )}

  {/* Stats Tab */}
  {activeTab === 'stats' && (
    <View style={{
      flex: 1,
      padding: 16,
      minHeight: 400
    }}>
      <View style={{
        backgroundColor: '#FDF2F8',
        borderWidth: 1,
        borderColor: '#FBCFE8',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        minHeight: 120
      }}>
        <Text style={{
          fontWeight: '600',
          color: '#9D174D',
          marginBottom: 12,
          fontSize: 16
        }}>
          {t.yourStats}
        </Text>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 8
        }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#DB2777'
            }}>
              {getAverageCycleLength()}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#EC4899',
              textAlign: 'center'
            }}>
              {t.cycleDays}
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#9333EA'
            }}>
              {cycles.length}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#A855F7',
              textAlign: 'center'
            }}>
              {t.cyclesTracked}
            </Text>
          </View>
        </View>
      </View>

      <View style={{
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 8,
        padding: 16,
        flex: 1
      }}>
        <Text style={{
          fontWeight: '600',
          color: '#9A3412',
          marginBottom: 12,
          fontSize: 16
        }}>
          {t.frequentSymptoms}
        </Text>
        <View style={{ flex: 1 }}>
          {Object.entries(symptomCategories).map(([categoryKey, category]) => {
            const categorySymptoms = symptoms.filter(s => s.category === categoryKey);
            if (categorySymptoms.length === 0) return null;

            return (
              <View key={categoryKey} style={{ marginBottom: 16 }}>
                <Text style={{
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: 8,
                  fontSize: 15
                }}>
                  {category.name}
                </Text>
                {category.symptoms.map(symptomType => {
                  const count = categorySymptoms.filter(s => s.symptom === symptomType.id).length;
                  if (count === 0) return null;

                  return (
                    <View key={symptomType.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginLeft: 16,
                      marginBottom: 4,
                      paddingVertical: 2
                    }}>
                      <Text style={{
                        color: '#374151',
                        fontSize: 14,
                        flex: 1
                      }}>
                        {symptomType.name}
                      </Text>
                      <Text style={{
                        color: '#EA580C',
                        fontWeight: '500',
                        fontSize: 14
                      }}>
                        {count}x
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  )}

  {/* Add Period Modal */}
  {/* Todo: revamp */}
  <Modal visible={showAddPeriod} transparent animationType="fade">
    <View className="flex-1 bg-black bg-opacity-50 items-center justify-center p-4">
      <View className="bg-white rounded-lg p-6 w-full max-w-sm">
        <Text className="text-lg font-semibold mb-4">{t.addPeriod}</Text>
        <View className="space-y-4">
          <View>
            <Text className="block text-sm font-medium text-gray-700 mb-1">{t.startDate}</Text>
            <TextInput value={newPeriodDate} onChangeText={setNewPeriodDate} className="w-full border border-gray-300 rounded-lg p-2" />
          </View>

          <View>
            <Text className="block text-sm font-medium text-gray-700 mb-1">{t.length}</Text>
            <TextInput value={String(newPeriodLength)} onChangeText={(t) => setNewPeriodLength(parseInt(t) || 0)} className="w-full border border-gray-300 rounded-lg p-2" />
          </View>

          <View className="flex-row space-x-2">
            <TouchableOpacity onPress={() => setShowAddPeriod(false)} className="flex-1 bg-gray-200 py-2 px-4 rounded-lg items-center">
              <Text className="text-gray-800">{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addPeriod} className="flex-1 bg-red-500 py-2 px-4 rounded-lg items-center">
              <Text className="text-white">{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  </Modal>

  {/* Add Symptom Modal */}
  <Modal visible={showAddSymptom} transparent animationType="fade">
    <View className="flex-1 bg-black bg-opacity-50 items-center justify-center p-4">
      <View className="bg-white rounded-lg p-6 w-full max-w-sm max-h-[80vh]">
        <ScrollView>
          <Text className="text-lg font-semibold mb-4">{t.addSymptom}</Text>
          <View className="space-y-4">
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-1">{t.date}</Text>
              <TextInput value={newSymptomDate} onChangeText={setNewSymptomDate} className="w-full border border-gray-300 rounded-lg p-2" />
            </View>

            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">{t.pickSymptom}</Text>
              {Object.entries(symptomCategories).map(([categoryKey, category]) => (
                <View key={categoryKey} className="mb-4">
                  <Text className="font-medium text-gray-600 mb-2">{category.name}</Text>
                  <View className="grid grid-cols-1 gap-2">
                    {category.symptoms.map(symptom => (
                      <TouchableOpacity key={symptom.id} onPress={() => setSelectedSymptom(symptom.id)} className={`p-2 rounded-lg border-2 ${selectedSymptom === symptom.id ? 'border-pink-500 bg-pink-50' : 'border-transparent'}`}>
                        <Text className="text-sm font-medium">{symptom.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View className="flex-row space-x-2">
              <TouchableOpacity onPress={() => { setShowAddSymptom(false); setSelectedSymptom(''); }} className="flex-1 bg-gray-200 py-2 px-4 rounded-lg items-center">
                <Text className="text-gray-800">{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addSymptom} className="flex-1 bg-orange-500 py-2 px-4 rounded-lg items-center">
                <Text className="text-white">{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>

    </View>
  </ScrollView>
  </SafeAreaView>
  );
};

export default PetraTracker;
