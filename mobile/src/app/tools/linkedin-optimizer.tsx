import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, Star } from 'lucide-react-native';
import { LinkedInIcon } from '../../components/brand-icons';
import { optimizeLinkedIn } from '../../services/api';

export default function LinkedInOptimizerScreen() {
  const [resumeText, setResumeText] = useState('');
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

    setIsLoading(true);
    setResult(null);
    try {
      const data = await optimizeLinkedIn(resumeText);
      setResult(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze LinkedIn profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <LinkedInIcon size={28} />
        </View>
        <Text style={styles.title}>LinkedIn Optimizer</Text>
        <Text style={styles.subtitle}>Transform your profile into a recruiter magnet.</Text>
      </View>

      {!result && (
        <View style={styles.inputCard}>
          <Text style={styles.label}>Ready to optimize?</Text>
          <Text style={styles.helperText}>We will use your previously uploaded resume to generate LinkedIn improvements.</Text>
          <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze Profile</Text>}
          </TouchableOpacity>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Headline Suggestions</Text>
            {result.headline_suggestions?.map((str: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <Star color="#eab308" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.listText}>{str}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>About Summary</Text>
            <Text style={styles.summaryText}>{result.about_summary}</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Experience Tips</Text>
            {result.experience_tips?.map((str: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <CheckCircle2 color="#0ea5e9" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.listText}>{str}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Keywords to Include</Text>
            <View style={styles.chipContainer}>
              {result.keywords?.map((kw: string, i: number) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{kw}</Text>
                </View>
              ))}
            </View>
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
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 24, alignItems: 'center' },
  label: { fontSize: 18, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 8 },
  helperText: { fontSize: 14, color: '#57534e', textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  detailsCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 16 },
  detailsTitle: { fontSize: 18, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  listText: { flex: 1, fontSize: 16, color: '#44403c', lineHeight: 22 },
  summaryText: { fontSize: 16, color: '#44403c', lineHeight: 24, fontStyle: 'italic' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#bae6fd' },
  chipText: { color: '#0369a1', fontFamily: 'Geist_600SemiBold', fontWeight: '600' },
});

