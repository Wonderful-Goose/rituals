import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { AppProvider } from './src/context/AppContext';
import { TodayScreen } from './src/screens/TodayScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Error boundary to catch and log errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ERROR BOUNDARY CAUGHT:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0A0A0B',
  },
  title: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

type TabIconName = 'checkbox' | 'checkbox-outline' | 'calendar' | 'calendar-outline' | 
  'stats-chart' | 'stats-chart-outline' | 'settings' | 'settings-outline';

const TAB_ICONS: { [key: string]: { active: TabIconName; inactive: TabIconName } } = {
  Today: { active: 'checkbox', inactive: 'checkbox-outline' },
  Calendar: { active: 'calendar', inactive: 'calendar-outline' },
  Stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

// Inner component to access safe area insets
function AppNavigator() {
  const insets = useSafeAreaInsets();
  
  // Set Android navigation bar to dark
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0A0A0B');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);
  
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            ...styles.tabBar,
            // Add padding for devices with gesture navigation / home indicator
            // Extra 4px ensures tab labels aren't cut off
            paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 10,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          },
          tabBarActiveTintColor: '#FF3B30',
          tabBarInactiveTintColor: '#5A5A5E',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={24} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#141416',
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
