import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import local components and functions
import { Reading, getSortedReadings } from './lib/calculations';
import { loadReadings, saveReadings, generateMockReadings } from './lib/storage';
import DashboardTab from './components/DashboardTab';
import FormTab from './components/FormTab';
import HistoryTab from './components/HistoryTab';
import ChartsTab from './components/ChartsTab';
import SettingsTab from './components/SettingsTab';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'dashboard' | 'form' | 'history' | 'charts' | 'settings';
const PRICE_STORAGE_KEY = '@compteur_electrique_price';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.2516); // Default EDF rate
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on startup
  useEffect(() => {
    async function initApp() {
      try {
        const loadedReadings = await loadReadings();
        setReadings(loadedReadings);

        const savedPrice = await AsyncStorage.getItem(PRICE_STORAGE_KEY);
        if (savedPrice) {
          const parsedPrice = parseFloat(savedPrice);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            setPricePerKwh(parsedPrice);
          }
        }
      } catch (e) {
        console.error('Error initializing app:', e);
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  // Save price updates
  const handleUpdatePrice = async (newPrice: number) => {
    setPricePerKwh(newPrice);
    try {
      await AsyncStorage.setItem(PRICE_STORAGE_KEY, newPrice.toString());
    } catch (e) {
      console.error('Error saving price:', e);
    }
  };

  // Add or update a reading
  const handleSaveReading = async (newReading: Omit<Reading, 'id'> & { id?: string }) => {
    let updatedReadings: Reading[] = [];

    if (newReading.id) {
      // Editing existing
      updatedReadings = readings.map(r =>
        r.id === newReading.id ? (newReading as Reading) : r
      );
      setEditingReading(null);
      setActiveTab('history'); // Go back to history after editing
    } else {
      // Creating new
      const readingWithId: Reading = {
        ...newReading,
        id: Math.random().toString(36).substring(2, 9),
      };
      updatedReadings = [...readings, readingWithId];
      setActiveTab('dashboard'); // Go to dashboard to see updated stats
    }

    setReadings(updatedReadings);
    await saveReadings(updatedReadings);
  };

  // Delete a reading
  const handleDeleteReading = async (id: string) => {
    const updatedReadings = readings.filter(r => r.id !== id);
    setReadings(updatedReadings);
    await saveReadings(updatedReadings);
  };

  // Generate mock data for testing
  const handleGenerateMockData = async () => {
    const mock = generateMockReadings();
    setReadings(mock);
    await saveReadings(mock);
    setActiveTab('dashboard');
    alert('Données de démonstration générées avec succès ! Vous pouvez maintenant explorer l\'application.');
  };

  // Clear all data
  const handleClearAllData = async () => {
    setReadings([]);
    await saveReadings([]);
    setActiveTab('dashboard');
    alert('Toutes les données ont été supprimées.');
  };

  // Import CSV data
  const handleImportCSVData = async (importedReadings: Reading[]) => {
    // Sort imported readings chronologically
    const sortedImported = getSortedReadings(importedReadings);
    setReadings(sortedImported);
    await saveReadings(sortedImported);
    setActiveTab('dashboard');
  };

  // Start editing a reading
  const handleStartEdit = (reading: Reading) => {
    setEditingReading(reading);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setEditingReading(null);
    setActiveTab('history');
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement de l'application...</Text>
      </View>
    );
  }

  // Get the last reading for pre-filling and validations
  const sortedReadings = getSortedReadings(readings);
  const lastReading = sortedReadings.length > 0 ? sortedReadings[sortedReadings.length - 1] : undefined;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerAppTitle}>Mon Compteur Élec</Text>
              <Text style={styles.headerAppSubtitle}>Suivi de consommation virtuel</Text>
            </View>
          </View>
          {readings.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{readings.length} relevés</Text>
            </View>
          )}
        </View>

        {/* Main Workspace Area */}
        <View style={styles.workspace}>
          {activeTab === 'dashboard' && (
            <DashboardTab
              readings={readings}
              pricePerKwh={pricePerKwh}
              onNavigateToForm={() => setActiveTab('form')}
              onNavigateToMock={handleGenerateMockData}
            />
          )}

          {activeTab === 'form' && (
            <FormTab
              onSave={handleSaveReading}
              lastReading={lastReading}
              editingReading={editingReading}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              readings={readings}
              onEdit={handleStartEdit}
              onDelete={handleDeleteReading}
            />
          )}

          {activeTab === 'charts' && <ChartsTab readings={readings} />}

          {activeTab === 'settings' && (
            <SettingsTab
              pricePerKwh={pricePerKwh}
              onUpdatePrice={handleUpdatePrice}
              onGenerateMock={handleGenerateMockData}
              onClearAll={handleClearAllData}
              readings={readings}
              onImportCSV={handleImportCSVData}
            />
          )}
        </View>

        {/* Custom Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => {
              setEditingReading(null);
              setActiveTab('dashboard');
            }}
          >
            <Ionicons
              name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
              size={20}
              color={activeTab === 'dashboard' ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
              Accueil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'form' && styles.tabItemActive]}
            onPress={() => setActiveTab('form')}
          >
            <Ionicons
              name={activeTab === 'form' ? 'add-circle' : 'add-circle-outline'}
              size={20}
              color={activeTab === 'form' ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeTab === 'form' && styles.tabLabelActive]}>
              Saisie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            onPress={() => {
              setEditingReading(null);
              setActiveTab('history');
            }}
          >
            <Ionicons
              name={activeTab === 'history' ? 'list' : 'list-outline'}
              size={20}
              color={activeTab === 'history' ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
              Historique
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'charts' && styles.tabItemActive]}
            onPress={() => {
              setEditingReading(null);
              setActiveTab('charts');
            }}
          >
            <Ionicons
              name={activeTab === 'charts' ? 'bar-chart' : 'bar-chart-outline'}
              size={20}
              color={activeTab === 'charts' ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeTab === 'charts' && styles.tabLabelActive]}>
              Graphiques
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => {
              setEditingReading(null);
              setActiveTab('settings');
            }}
          >
            <Ionicons
              name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
              size={20}
              color={activeTab === 'settings' ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
              Paramètres
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        paddingTop: 12,
      },
      android: {
        paddingTop: 12,
      },
    }),
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAppTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerAppSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  workspace: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabItemActive: {
    backgroundColor: '#F9FAFB',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});
