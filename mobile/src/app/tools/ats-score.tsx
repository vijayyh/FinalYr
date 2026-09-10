import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { AtsIcon } from '../../components/brand-icons';
import { atsScore } from '../../services/api';

export default function AtsScoreScreen() {
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
      const data = await atsScore(resumeText, jobDescription);
      setResult(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate ATS score.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <AtsIcon size={28} />
        </View>
        <Text style={styles.title}>ATS Optimization</Text>
        <Text style={styles.subtitle}>Paste the job description below to see how well your resume matches.</Text>
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
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Calculate Score</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>ATS MATCH SCORE</Text>
            <Text style={styles.scoreValue}>{result.score}%</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Matching Skills (Strengths)</Text>
            {result.strengths && result.strengths.length > 0 ? (
              result.strengths.map((str: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <CheckCircle2 color="#16a34a" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{str}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No exact matches found.</Text>
            )}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Missing Keywords to Add</Text>
            {result.missingSkills && result.missingSkills.length > 0 ? (
              result.missingSkills.map((str: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <AlertCircle color="#ea580c" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{str}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Looks great! No critical missing skills.</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 24 },
  label: { fontSize: 14, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderRadius: 12, padding: 16, height: 160, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#09090b', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  scoreCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#4ade80', marginBottom: 16 },
  scoreLabel: { fontSize: 12, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a', letterSpacing: 1, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#16a34a' },
  detailsCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 16 },
  detailsTitle: { fontSize: 18, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  listText: { fontSize: 16, color: '#44403c' },
  emptyText: { color: '#78716c', fontStyle: 'italic' },
});

