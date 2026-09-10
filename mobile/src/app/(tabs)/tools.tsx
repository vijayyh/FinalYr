import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Layout, Sparkles, FileText, GitFork, Zap } from 'lucide-react-native';
import { FeatureCard } from '../../components/feature-card';

export default function ToolsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>All AI Tools</Text>
      <Text style={styles.subtitle}>Supercharge your job search with our AI-powered suite.</Text>

      <FeatureCard 
        icon={<Target color="#fff" size={24} />} 
        title="ATS Optimization" 
        desc="Beat the automated resume screeners."
        color="#f97316"
        onPress={() => router.push('/tools/ats-score')}
      />
      <FeatureCard 
        icon={<Layout color="#fff" size={24} />} 
        title="Cover Letter Gen" 
        desc="Instantly generate highly targeted cover letters."
        color="#3b82f6"
        onPress={() => router.push('/tools/cover-letter')}
      />
      <FeatureCard 
        icon={<Sparkles color="#fff" size={24} />} 
        title="LinkedIn Optimizer" 
        desc="Transform your LinkedIn profile into a recruiter magnet."
        color="#0ea5e9"
        onPress={() => router.push('/tools/linkedin-optimizer')}
      />
      <FeatureCard 
        icon={<FileText color="#fff" size={24} />} 
        title="Smart Resume Builder" 
        desc="Build a stunning, ATS-friendly resume from scratch."
        color="#a855f7"
        onPress={() => router.push('/builder')}
      />
      <FeatureCard 
        icon={<GitFork color="#fff" size={24} />} 
        title="Skill Gap Analyzer" 
        desc="Map prerequisite skills and dynamic roadmap pathways."
        color="#f97316"
        onPress={() => router.push('/tools/skill-gap')}
      />
      <FeatureCard 
        icon={<Zap color="#16a34a" size={24} />} 
        title="Interactive Mock Interviews" 
        desc="Practice technical and behavioral interviews."
        color="#bbf7d0"
        titleColor="#16a34a"
        onPress={() => router.push('/tools/mock-interview')}
        outline
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', marginBottom: 24 },
});
