import { Tabs } from 'expo-router';
import { Home, Sparkles, Wrench } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F1EA' },
        headerTintColor: '#000000',
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#F4F1EA',
          borderTopWidth: 1,
          borderTopColor: '#D1C9B9',
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Builder',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
