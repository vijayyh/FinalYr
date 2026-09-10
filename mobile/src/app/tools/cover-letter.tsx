import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout, Copy } from 'lucide-react-native';
import { generateCoverLetter } from '../../services/api';

export default function CoverLetterScreen() {
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);

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
    if (!jobRole || !companyName) {
      Alert.alert('Missing Info', 'Please enter a target job role and company name.');
      return;
    }

    setIsLoading(true);
    setLetter(null);
    try {
      const data = await generateCoverLetter(jobRole, companyName, resumeText);
      if (data.letter) {
        setLetter(data.letter);
      } else {
        Alert.alert('Error', 'Failed to generate cover letter.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate cover letter.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (letter) {
      Clipboard.setString(letter);
      Alert.alert('Copied!', 'Cover letter copied to clipboard.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Layout color="#fff" size={28} />
        </View>
        <Text style={styles.title}>Cover Letter Gen</Text>
        <Text style={styles.subtitle}>Instantly generate highly targeted cover letters customized for specific jobs.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.label}>Target Job Role</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior Frontend Developer"
          value={jobRole}
          onChangeText={setJobRole}
        />
        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Google"
          value={companyName}
          onChangeText={setCompanyName}
        />
        <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Cover Letter</Text>}
        </TouchableOpacity>
      </View>

      {letter && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>Your Cover Letter</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Copy color="#4b5563" size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.letterCard}>
            <Text style={styles.letterText}>{letter}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#09090b', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#09090b' },
  copyBtn: { padding: 8, backgroundColor: '#e5e7eb', borderRadius: 8 },
  letterCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#D1C9B9' },
  letterText: { fontSize: 16, color: '#1f2937', lineHeight: 26 },
});

