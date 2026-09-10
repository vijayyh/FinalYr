import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GitFork, Map, Navigation, CheckCircle2 } from 'lucide-react-native';
import { analyzeSkillGap } from '../../services/api';

export default function SkillGapScreen() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('resumeText').then((text) => {
      if (text) setResumeText(text);
    });
  }, []);

  const handleAnalyze = async () => {
    if (!resumeText) {
      Alert.alert('Missing Resume', 'Please go back and upload a resume first.');
      return;
    }
    if (!jobDescription) {
      Alert.alert('Missing Job Description', 'Please paste a job description.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeSkillGap(resumeText, jobDescription);
      setResult(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze skill gap.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <GitFork color="#fff" size={28} />
        </View>
        <Text style={styles.title}>Skill Gap Analyzer</Text>
        <Text style={styles.subtitle}>Map prerequisite skills and dynamic roadmap pathways against your target job.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.label}>Job Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Paste the target job description here..."
          value={jobDescription}
          onChangeText={setJobDescription}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze Skill Gap</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>SKILL OVERLAP</Text>
            <Text style={styles.scoreValue}>{result.jaccard_overlap}%</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Missing Skills</Text>
            {result.missing_skills && result.missing_skills.length > 0 ? (
              result.missing_skills.map((str: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Map color="#ea580c" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{str}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>You have all the required skills!</Text>
            )}
          </View>

          {result.roadmap && result.roadmap.length > 0 && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Learning Roadmap</Text>
              {result.roadmap.map((item: any, i: number) => (
                <View key={i} style={styles.roadmapItem}>
                  <Navigation color="#3b82f6" size={20} style={{ marginRight: 8, marginTop: 4 }} />
                  <View>
                    <Text style={styles.roadmapSkill}>To learn: {item.skill}</Text>
                    <Text style={styles.roadmapPath}>{item.path.join(' → ')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#09090b', marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderRadius: 12, padding: 16, height: 160, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#f97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  scoreCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#f97316', marginBottom: 16 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#71717a', letterSpacing: 1, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '900', color: '#ea580c' },
  detailsCard: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 16 },
  detailsTitle: { fontSize: 18, fontWeight: '700', color: '#09090b', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  listText: { fontSize: 16, color: '#44403c' },
  emptyText: { color: '#78716c', fontStyle: 'italic' },
  roadmapItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  roadmapSkill: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  roadmapPath: { fontSize: 14, color: '#57534e', fontStyle: 'italic' },
});

