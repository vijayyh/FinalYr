import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Target, CheckCircle2, Zap, AlertCircle, Briefcase, ExternalLink } from 'lucide-react-native';

export default function AnalysisReportScreen() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('analysisResult');
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load analysis result', err);
      }
    };
    loadData();
  }, []);

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Preparing your professional analysis...</Text>
      </View>
    );
  }

  const { parsed_data, jobs } = data;
  const { 
    job_title, 
    ats_score,
    executive_summary,
    skills, 
    key_strengths, 
    areas_for_improvement,
    formatting_feedback 
  } = parsed_data || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>COMPREHENSIVE ANALYSIS</Text>
        <Text style={styles.headerTitle}>
          Targeting: <Text style={styles.headerTitleLight}>{job_title || 'Professional Role'}</Text>
        </Text>
        {ats_score && (
          <View style={styles.atsBadge}>
            <Target color="#15803d" size={16} />
            <Text style={styles.atsBadgeText}>{ats_score}/100 ATS Score</Text>
          </View>
        )}
      </View>

      {executive_summary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Executive Summary</Text>
          <Text style={styles.cardText}>{executive_summary}</Text>
        </View>
      )}

      {skills && skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CORE COMPETENCIES</Text>
          <View style={styles.chipsContainer}>
            {skills.map((skill: string, i: number) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconBoxGreen}>
            <Zap color="#15803d" size={24} />
          </View>
          <Text style={styles.cardTitleLarge}>Key Strengths</Text>
        </View>
        {key_strengths && key_strengths.length > 0 ? (
          key_strengths.map((str: any, i: number) => (
            <View key={i} style={styles.listItem}>
              <CheckCircle2 color="#16a34a" size={24} style={styles.listIcon} />
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{str.title}</Text>
                <Text style={styles.listText}>{str.explanation}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No specific strengths detected.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconBoxOrange}>
            <AlertCircle color="#ea580c" size={24} />
          </View>
          <Text style={styles.cardTitleLarge}>Actionable Feedback</Text>
        </View>
        {areas_for_improvement && areas_for_improvement.length > 0 ? (
          areas_for_improvement.map((area: any, i: number) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dotIconBox}>
                <View style={styles.dot} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{area.title}</Text>
                <Text style={styles.listText}>{area.explanation || area.actionable_advice}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Your resume looks solid.</Text>
        )}

        {formatting_feedback && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>FORMATTING</Text>
            <Text style={styles.feedbackText}>{formatting_feedback}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.cardTitleLarge}>Recommended Opportunities</Text>
        <Text style={styles.subtitleText}>Real-time job listings matching your profile.</Text>
        
        {jobs && jobs.length > 0 ? (
          jobs.map((job: any, index: number) => (
            <View key={index} style={styles.jobCard}>
              <View style={styles.jobIconBox}>
                <Briefcase color="#57534e" size={24} />
              </View>
              <Text style={styles.jobTitle}>{job.job_title}</Text>
              <Text style={styles.jobEmployer}>{job.employer_name}</Text>
              {job.job_city && (
                <Text style={styles.jobLocation}>{job.job_city}, {job.job_country}</Text>
              )}
              <TouchableOpacity 
                style={styles.applyBtn} 
                onPress={() => Linking.openURL(job.job_apply_link)}
              >
                <Text style={styles.applyBtnText}>Apply on Company Site</Text>
                <ExternalLink color="#fff" size={16} style={{marginLeft: 8}}/>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyJobCard}>
            <Briefcase color="#a8a29e" size={32} />
            <Text style={styles.emptyJobTitle}>No live jobs found right now</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5DFD3' },
  loadingText: { marginTop: 16, color: '#57534e', fontSize: 16, fontWeight: '500' },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerLabel: { color: '#c2410c', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#000', marginBottom: 12 },
  headerTitleLight: { fontWeight: '300', color: '#78716c' },
  atsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5DFD3', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1C9B9' },
  atsBadgeText: { marginLeft: 8, color: '#166534', fontWeight: 'bold' },
  card: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12 },
  cardText: { fontSize: 16, color: '#44403c', lineHeight: 24 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#78716c', letterSpacing: 1, marginBottom: 16 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F4F1EA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D1C9B9' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#292524' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconBoxGreen: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E5DFD3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1C9B9', marginRight: 16 },
  iconBoxOrange: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E5DFD3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1C9B9', marginRight: 16 },
  cardTitleLarge: { fontSize: 24, fontWeight: '700', color: '#000' },
  listItem: { flexDirection: 'row', marginBottom: 20 },
  listIcon: { marginRight: 16, marginTop: 2 },
  dotIconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5DFD3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1C9B9', marginRight: 16, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ea580c' },
  listContent: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  listText: { fontSize: 15, color: '#57534e', lineHeight: 22 },
  emptyText: { color: '#78716c', fontSize: 15 },
  feedbackBox: { marginTop: 16, padding: 16, backgroundColor: '#E5DFD3', borderRadius: 16, borderWidth: 1, borderColor: '#D1C9B9' },
  feedbackLabel: { fontSize: 10, fontWeight: '700', color: '#78716c', letterSpacing: 1, marginBottom: 4 },
  feedbackText: { fontSize: 14, color: '#44403c' },
  subtitleText: { color: '#57534e', marginBottom: 24 },
  jobCard: { backgroundColor: '#F4F1EA', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 16 },
  jobIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E5DFD3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1C9B9', marginBottom: 16 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 4 },
  jobEmployer: { fontSize: 16, fontWeight: '500', color: '#44403c' },
  jobLocation: { fontSize: 14, color: '#78716c', marginTop: 8 },
  applyBtn: { marginTop: 20, backgroundColor: '#000', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyJobCard: { padding: 40, backgroundColor: '#F4F1EA', borderRadius: 24, borderWidth: 1, borderColor: '#D1C9B9', borderStyle: 'dashed', alignItems: 'center' },
  emptyJobTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 16 },
});

