import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { initDatabase, addCycle, deleteCycle, addSymptom as addSymptomToDB, deleteSymptom as deleteSymptomFromDB } from './db';
import { Calendar, TrendingUp, Brain } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import strings from './strings';
import symptomStrings from './symptomStrings';
import CalendarTab from './CalendarTab';
import PredictionsTab from './PredictionsTab';
import StatsTab from './StatsTab';
import ActionModal from './ActionModal';
import PeriodModal from './PeriodModal';
import SymptomModal from './SymptomModal';

const PetraTracker = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycles, setCycles] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set());
  const [locale, setLocale] = useState('de');

  const [periodStartDate, setPeriodStartDate] = useState(null);
  const [periodLength, setPeriodLength] = useState(5);
  const [periodModalInitialDate, setPeriodModalInitialDate] = useState(null);
  const [periodOriginalDate, setPeriodOriginalDate] = useState(null);

  const [symptomDate, setSymptomDate] = useState(null);
  const [symptomModalInitialDate, setSymptomModalInitialDate] = useState(null);

  const handleLocaleChange = async (value) => {
    setLocale(value);
    try {
      await AsyncStorage.setItem('userLocale', value);
    } catch (error) {
      console.log('Error saving locale:', error);
    }
  };

  const t = strings[locale];
  const symptomCategories = symptomStrings[locale];

  useEffect(() => {
    const initialize = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('userLocale');
        if (savedLocale) setLocale(savedLocale);
        await initDatabase(setCycles, setSymptoms);
      } catch (error) {
        console.log('Initialization failed:', error);
      }
    };
    initialize();
  }, []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const openPeriodModal = (clickedDateStr) => {
    const dateStr = clickedDateStr || todayStr;
    setPeriodOriginalDate(null);
    setPeriodStartDate(dateStr);
    setPeriodLength(5);
    setPeriodModalInitialDate(dateStr);
    setShowAddPeriod(true);
  };

  const openSymptomModal = (clickedDateStr) => {
    const dateStr = clickedDateStr || todayStr;
    setSymptomDate(dateStr);
    setSymptomModalInitialDate(dateStr);
    const alreadySaved = new Set(symptoms.filter(s => s.date === dateStr).map(s => s.symptom));
    setSelectedSymptoms(alreadySaved);
    setShowAddSymptom(true);
  };

  const editPeriodHandler = (dateStr) => {
    const existing = cycles.find(c => c.type === 'period' && c.date === dateStr);
    setShowActionModal(false);
    setPeriodOriginalDate(existing ? existing.date : null);
    setPeriodStartDate(existing ? existing.date : dateStr);
    setPeriodLength(existing ? existing.length : 5);
    setPeriodModalInitialDate(existing ? existing.date : dateStr);
    setShowAddPeriod(true);
  };

  const savePeriod = async () => {
    if (!periodStartDate) return;
    try {
      if (periodOriginalDate) {
        await deleteCycle(periodOriginalDate);
      }
      await addCycle(periodStartDate, 'period', periodLength);
      const newCycle = { date: periodStartDate, type: 'period', length: periodLength };
      const updatedCycles = [
        ...cycles.filter(c => !(c.type === 'period' && c.date === periodOriginalDate)),
        newCycle
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      setCycles(updatedCycles);
      setPeriodOriginalDate(null);
      setShowAddPeriod(false);
    } catch (e) {
      console.error('Error saving period:', e);
    }
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => {
      const next = new Set(prev);
      if (next.has(symptomId)) {
        next.delete(symptomId);
      } else {
        next.add(symptomId);
      }
      return next;
    });
  };

  const addSymptomHandler = async () => {
    const date = symptomDate || todayStr;
    const alreadySavedIds = new Set(symptoms.filter(s => s.date === date).map(s => s.symptom));
    const toDelete = symptoms.filter(s => s.date === date && !selectedSymptoms.has(s.symptom));
    const toAdd = [...selectedSymptoms].filter(id => !alreadySavedIds.has(id));
    const newSymptomsList = [];
    try {
      for (const s of toDelete) {
        await deleteSymptomFromDB(s.id);
      }
      for (const symptomId of toAdd) {
        const category = Object.keys(symptomCategories).find(cat =>
          symptomCategories[cat].symptoms.some(s => s.id === symptomId)
        );
        const result = await addSymptomToDB(date, symptomId, category);
        newSymptomsList.push({ id: result.lastInsertRowId, date, symptom: symptomId, category });
      }
      setSymptoms(prev => [
        ...prev.filter(s => !(s.date === date && !selectedSymptoms.has(s.symptom))),
        ...newSymptomsList
      ]);
      setShowAddSymptom(false);
      setSelectedSymptoms(new Set());
    } catch(e) {
      console.error('DB write failed:', e);
    }
  };

  const onDayPress = (day, dayInfo) => {
    setSelectedDate(day);
    setShowActionModal(true);
  };

  // Reaktiv berechnet damit es immer den aktuellen cycles/symptoms-State reflektiert
  const getSelectedDayInfo = () => {
    if (!selectedDate) return null;
    const dateStr = (() => {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();
    const currentDayDate = new Date(dateStr);
    const hasPeriod = cycles.some(cycle => {
      if (cycle.type !== 'period') return false;
      const startDate = new Date(cycle.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + cycle.length - 1);
      return currentDayDate >= startDate && currentDayDate <= endDate;
    });
    const daySymptoms = symptoms.filter(s => s.date === dateStr);
    return { cycle: hasPeriod ? { type: 'period' } : null, symptoms: daySymptoms, dateStr };
  };
  const selectedDayInfo = getSelectedDayInfo();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 w-full bg-white">

        {/* Header */}
        <LinearGradient
          colors={['#F472B6', '#C084FC', '#818CF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingTop: 40, paddingVertical: 16, paddingHorizontal: 16 }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#FFFFFF' }}>
            {t.appName}
          </Text>
          <Text style={{ textAlign: 'center', color: '#FBCFE8', fontSize: 14, marginTop: 4 }}>
            {t.tagline}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'left' }}>
            <Text style={{ fontSize: 16, marginRight: 0, color: '#FFFFFF' }}>🌐</Text>
            <Picker
              selectedValue={locale}
              onValueChange={handleLocaleChange}
              mode="dropdown"
              style={{ width: 40, height: 30, color: '#FFFFFF' }}
              dropdownIconColor="#FFFFFF"
            >
              <Picker.Item label="🇩🇪" value="de" />
              <Picker.Item label="🇬🇧" value="en" />
            </Picker>
          </View>
        </LinearGradient>

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

          {activeTab === 'calendar' && (
            <CalendarTab
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              cycles={cycles}
              symptoms={symptoms}
              todayStr={todayStr}
              t={t}
              openPeriodModal={openPeriodModal}
              openSymptomModal={openSymptomModal}
              onDayPress={onDayPress}
            />
          )}
          {activeTab === 'predictions' && (
            <PredictionsTab cycles={cycles} t={t} />
          )}
          {activeTab === 'stats' && (
            <StatsTab cycles={cycles} symptoms={symptoms} symptomCategories={symptomCategories} t={t} />
          )}

          <ActionModal
            visible={showActionModal}
            selectedDayInfo={selectedDayInfo}
            t={t}
            symptomCategories={symptomCategories}
            onClose={() => setShowActionModal(false)}
            onEditPeriod={editPeriodHandler}
            onOpenPeriodModal={openPeriodModal}
            onOpenSymptomModal={openSymptomModal}
          />
          <PeriodModal
            visible={showAddPeriod}
            periodStartDate={periodStartDate}
            setPeriodStartDate={setPeriodStartDate}
            periodLength={periodLength}
            setPeriodLength={setPeriodLength}
            periodModalInitialDate={periodModalInitialDate}
            t={t}
            onClose={() => setShowAddPeriod(false)}
            onSave={savePeriod}
          />
          <SymptomModal
            visible={showAddSymptom}
            symptomDate={symptomDate}
            setSymptomDate={setSymptomDate}
            symptomModalInitialDate={symptomModalInitialDate}
            selectedSymptoms={selectedSymptoms}
            toggleSymptom={toggleSymptom}
            symptomCategories={symptomCategories}
            t={t}
            onClose={() => { setShowAddSymptom(false); setSelectedSymptoms(new Set()); }}
            onSave={addSymptomHandler}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PetraTracker;