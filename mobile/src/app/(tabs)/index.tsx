import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UploadCloud, FileText, ArrowRight, Sparkles, Target, Zap, Layout, GitFork } from 'lucide-react-native';
import { uploadResume } from '../../services/api';
import { FeatureCard } from '../../components/feature-card';

const ADVICE = [
  "Keep it under 2 pages!",
  "Start bullets with action verbs.",
  "Quantify your achievements!",
  "Tailor it to the job description.",
  "Always check for typos!"
];

export default function HomeScreen() {
  const router = useRouter();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [adviceIndex, setAdviceIndex] = useState(0);
  
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 1200);

    const interval = setInterval(() => {
      setAdviceIndex((prev) => (prev + 1) % ADVICE.length);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(splashTimer);
    };
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const data = await uploadResume(file.uri, file.name, file.mimeType || 'application/pdf');
      
      await AsyncStorage.setItem('analysisResult', JSON.stringify(data));
      if (data.extracted_text) {
        await AsyncStorage.setItem('resumeText', data.extracted_text);
      }
      
      router.push('/analysis-report');
    } catch (err: any) {
      console.error('Error analyzing resume:', err);
      Alert.alert('Analysis Failed', err.message || 'Failed to connect to the backend.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTrySampleResume = async () => {
    const mockData = {
      status: "success",
      extracted_text: "Software Engineer with 5+ years of experience in React and Node.js...",
      parsed_data: {
        job_title: "Senior Full Stack Engineer",
        ats_score: 92,
        executive_summary: "A highly experienced Software Engineer with strong skills in React, Node.js, and Cloud Infrastructure.",
        skills: ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL", "Docker"],
        key_strengths: [
          { title: "Frontend Architecture", explanation: "Extensive use of React and modern state management tools." }
        ],
        areas_for_improvement: [
          { title: "Quantifiable Metrics", explanation: "Consider adding specific metrics to boost ATS performance." }
        ],
        formatting_feedback: "The resume is well-structured."
      },
      jobs: [
        { job_title: "Senior Software Engineer", employer_name: "Tech Corp", job_apply_link: "#" }
      ]
    };

    await AsyncStorage.setItem("analysisResult", JSON.stringify(mockData));
    await AsyncStorage.setItem("resumeText", mockData.extracted_text);
    router.push("/analysis-report");
  };

  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>Let your AI career companion get started.</Text>
          <Text style={styles.subtitle}>Upload your resume and tell ResumePro what you want to achieve.</Text>
          
          <View style={styles.adviceCard}>
            <Text style={styles.adviceText}>"{ADVICE[adviceIndex]}"</Text>
          </View>

          <View style={styles.uploadCard}>
            {file ? (
              <View style={styles.fileSelectedRow}>
                <View style={styles.fileIconBox}>
                  <FileText color="#000" size={24} />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileStatus}>Ready for analysis</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)} style={styles.clearFileBtn}>
                  <Text style={styles.clearFileText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.browseButton} onPress={pickDocument}>
                <UploadCloud color="#71717a" size={24} />
                <Text style={styles.browseButtonText}>Upload your resume here (.pdf, .docx)...</Text>
              </TouchableOpacity>
            )}

            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.smallBrowseBtn} onPress={pickDocument}>
                <UploadCloud color="#71717a" size={16} />
                <Text style={styles.smallBrowseText}>Browse Files</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.analyzeBtn, !file || isAnalyzing ? styles.analyzeBtnDisabled : {}]} 
                onPress={analyzeResume}
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? <ActivityIndicator color="#fff" /> : <ArrowRight color="#fff" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.sampleBtn} onPress={handleTrySampleResume}>
              <FileText color="#fff" size={16} />
              <Text style={styles.sampleBtnText}>Try Sample Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.builderBtn} onPress={() => router.push('/builder')}>
              <Sparkles color="#18181b" size={16} />
              <Text style={styles.builderBtnText}>Build from Scratch</Text>
            </TouchableOpacity>
          </View>

          {/* Rabbit Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../assets/images/rabbit_resume.png')} 
              style={styles.mascotImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Elevate your job search</Text>
          
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
        </View>
      </ScrollView>

      {/* Splash Screen Overlay */}
      {showSplash && (
        <Animated.View style={[styles.splashScreen, { opacity: fadeAnim }]}>
          <View style={styles.splashIconBox}>
            <FileText color="#000" size={48} />
          </View>
          <Text style={styles.splashTitle}>ResumePro</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: '#E5DFD3' },
  container: { flex: 1, backgroundColor: '#E5DFD3' },
  content: { padding: 24, paddingBottom: 60 },
  heroSection: { marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#09090b', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#71717a', marginBottom: 24 },
  adviceCard: { backgroundColor: '#F4F1EA', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#D1C9B9' },
  adviceText: { fontSize: 14, fontWeight: '700', color: '#09090b' },
  uploadCard: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.5)' },
  browseButton: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: 16 },
  browseButtonText: { color: '#71717a', fontSize: 16, marginLeft: 12 },
  fileSelectedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fileIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  fileDetails: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 16, fontWeight: '700', color: '#000' },
  fileStatus: { fontSize: 12, color: '#71717a', fontWeight: '500' },
  clearFileBtn: { padding: 8 },
  clearFileText: { fontSize: 16, color: '#71717a' },
  uploadActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16, marginTop: 8 },
  smallBrowseBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  smallBrowseText: { fontSize: 12, fontWeight: '700', color: '#71717a', marginLeft: 8 },
  analyzeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  analyzeBtnDisabled: { backgroundColor: '#d4d4d8' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  sampleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  sampleBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  builderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  builderBtnText: { color: '#18181b', fontWeight: '700', marginLeft: 8 },
  imageContainer: { width: '100%', height: 320, marginTop: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  mascotImage: { width: '100%', height: '100%', opacity: 0.95, borderRadius: 32 },
  featuresSection: { marginTop: 10 },
  featuresTitle: { fontSize: 28, fontWeight: '900', color: '#09090b', marginBottom: 24, textAlign: 'center' },
  
  splashScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  splashIconBox: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  splashTitle: { fontSize: 36, fontWeight: '900', color: '#fff' },
});
