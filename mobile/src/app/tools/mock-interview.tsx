import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap, Play, ArrowRight } from 'lucide-react-native';
import { generateMockInterview } from '../../services/api';

export default function MockInterviewScreen() {
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('resumeText').then((text) => {
      if (text) setResumeText(text);
    });
  }, []);

  const handleGenerate = async () => {
    if (!resumeText) {
      Alert.alert('Missing Resume', 'Please go back and upload a resume first.');
      return;
    }
    if (!jobRole) {
      Alert.alert('Missing Job Role', 'Please enter a target job role.');
      return;
    }

    setIsLoading(true);
    setQuestions([]);
    try {
      const data = await generateMockInterview(jobRole, resumeText);
      if (data.questions) {
        setQuestions(data.questions);
      } else {
        Alert.alert('Error', 'Failed to generate questions. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate mock interview.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Zap color="#16a34a" size={28} />
        </View>
        <Text style={styles.title}>Mock Interviews</Text>
        <Text style={styles.subtitle}>Enter your target role to generate highly customized interview questions.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.label}>Target Job Role</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior Frontend Developer"
          value={jobRole}
          onChangeText={setJobRole}
        />
        <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Questions</Text>}
        </TouchableOpacity>
      </View>

      {questions.length > 0 && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Your Customized Questions</Text>
          {questions.map((q, i) => (
            <View key={i} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.difficultyBadge}>{q.difficulty}</Text>
                <Text style={styles.focusText}>{q.focus}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#09090b', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#09090b', marginBottom: 16 },
  questionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 12 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  difficultyBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '700', color: '#374151' },
  focusText: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  questionText: { fontSize: 16, color: '#1f2937', fontWeight: '500', lineHeight: 24 },
});

