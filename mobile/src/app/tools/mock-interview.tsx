import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Briefcase, Mic, CheckCircle2, CornerDownLeft, RefreshCcw, AlertCircle } from 'lucide-react-native';
import { MockInterviewIcon } from '../../components/brand-icons';
import {
  generateInteractiveInterview,
  evaluateInterviewAnswer,
  finalizeInterview,
  InterviewQuestion,
} from '../../services/api';

type Status = 'setup' | 'generating' | 'interviewing' | 'evaluating' | 'feedback' | 'finalizing' | 'finished';

type QnA = { question: InterviewQuestion; answer: string; feedback?: string };

type FinalReview = { score?: number; rating?: string; summary?: string; advice?: string[] };

export default function MockInterviewScreen() {
  const [status, setStatus] = useState<Status>('setup');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [qnaHistory, setQnaHistory] = useState<QnA[]>([]);
  const [finalReview, setFinalReview] = useState<FinalReview | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem('resumeText').then((text) => {
      if (text) setResumeText(text);
    });
  }, []);

  const handleStart = async () => {
    if (!resumeText) {
      Alert.alert('Missing Resume', 'Please go back and upload a resume first.');
      return;
    }
    if (!jobRole) {
      Alert.alert('Missing Job Role', 'Please enter a target job role.');
      return;
    }

    setStatus('generating');
    try {
      const data = await generateInteractiveInterview(jobRole, jobDescription, resumeText);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setQnaHistory([]);
        setCurrentIndex(0);
        setStatus('interviewing');
      } else {
        throw new Error('Failed to generate valid questions.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate mock interview questions.');
      setStatus('setup');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    const currentQuestion = questions[currentIndex];
    const newHistory = [...qnaHistory, { question: currentQuestion, answer: currentAnswer }];
    setQnaHistory(newHistory);
    setStatus('evaluating');

    const withFeedback = (feedback: string) => [
      ...newHistory.slice(0, -1),
      { ...newHistory[newHistory.length - 1], feedback },
    ];

    try {
      const data = await evaluateInterviewAnswer(currentQuestion, currentAnswer, jobRole, jobDescription, resumeText);
      if (data.feedback) {
        const updated = withFeedback(data.feedback);
        setQnaHistory(updated);
        if (data.terminate) {
          Alert.alert('Interview Ended', 'The AI interviewer ended the session early.');
          handleFinalize(updated);
        } else {
          setStatus('feedback');
        }
      } else {
        setQnaHistory(withFeedback("Oops, I had trouble evaluating that response! Let's keep moving forward."));
        setStatus('feedback');
      }
    } catch {
      setQnaHistory(withFeedback("Oops, I had trouble evaluating that response! Let's keep moving forward."));
      setStatus('feedback');
    }
  };

  const handleNextQuestion = () => {
    setCurrentAnswer('');
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setStatus('interviewing');
    } else {
      handleFinalize(qnaHistory);
    }
  };

  const handleFinalize = async (history: QnA[]) => {
    setStatus('finalizing');
    try {
      const data = await finalizeInterview(history, jobRole);
      if (data.score !== undefined || data.rating) {
        setFinalReview(data);
      }
      setStatus('finished');
    } catch {
      setStatus('finished');
    }
  };

  const handleRestart = () => {
    setStatus('setup');
    setQnaHistory([]);
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer('');
    setFinalReview(null);
  };

  const difficultyStyle = (difficulty: string) => {
    const d = (difficulty || '').toLowerCase();
    if (d.includes('hard')) return { backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' };
    if (d.includes('medium')) return { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' };
    return { backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' };
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <MockInterviewIcon size={28} />
          </View>
          <Text style={styles.title}>Interactive Mock Interview</Text>
          <Text style={styles.subtitle}>Step into the hot seat. Answer real questions and get real-time AI feedback.</Text>
        </View>

        {status === 'setup' && (
          <View style={styles.inputCard}>
            <Text style={styles.label}>Target Role</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Senior Frontend Developer"
              value={jobRole}
              onChangeText={setJobRole}
            />
            <Text style={styles.label}>Job Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste the job description for more targeted questions..."
              value={jobDescription}
              onChangeText={setJobDescription}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Mock Interview</Text>
            </TouchableOpacity>
          </View>
        )}

        {(status === 'generating' || status === 'finalizing') && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#09090b" />
            <Text style={styles.loadingText}>
              {status === 'generating' ? 'Analyzing your resume and building custom questions...' : 'Compiling your final interview report...'}
            </Text>
          </View>
        )}

        {(status === 'interviewing' || status === 'evaluating' || status === 'feedback') && (
          <View style={{ gap: 16 }}>
            <View style={styles.progressBar}>
              <Text style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</Text>
              <TouchableOpacity onPress={() => handleFinalize(qnaHistory)}>
                <Text style={styles.endEarly}>End Early</Text>
              </TouchableOpacity>
            </View>

            {qnaHistory.map((item, idx) => {
              const badge = difficultyStyle(item.question.difficulty);
              return (
                <View key={idx} style={{ gap: 12 }}>
                  <View style={styles.chatRow}>
                    <View style={styles.avatarDark}><Briefcase color="#fff" size={18} /></View>
                    <View style={styles.questionBubble}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.focusBadge}>{item.question.focus}</Text>
                        <Text style={[styles.diffBadge, { backgroundColor: badge.backgroundColor, color: badge.color, borderColor: badge.borderColor }]}>{item.question.difficulty}</Text>
                      </View>
                      <Text style={styles.questionText}>{item.question.question}</Text>
                    </View>
                  </View>
                  <View style={[styles.chatRow, { flexDirection: 'row-reverse' }]}>
                    <View style={styles.avatarBlue}><Mic color="#fff" size={18} /></View>
                    <View style={styles.answerBubble}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  </View>
                  {item.feedback && (
                    <View style={styles.chatRow}>
                      <View style={styles.avatarGreen}><CheckCircle2 color="#fff" size={18} /></View>
                      <View style={styles.feedbackBubble}>
                        <Text style={styles.feedbackText}>{item.feedback}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {status !== 'feedback' && questions[currentIndex] && (
              <View style={styles.chatRow}>
                <View style={styles.avatarDark}><Briefcase color="#fff" size={18} /></View>
                <View style={styles.currentQuestionBubble}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.focusBadge}>{questions[currentIndex].focus}</Text>
                    <Text style={[styles.diffBadge, difficultyStyle(questions[currentIndex].difficulty)]}>{questions[currentIndex].difficulty}</Text>
                  </View>
                  <Text style={styles.currentQuestionText}>{questions[currentIndex].question}</Text>
                </View>
              </View>
            )}

            {status === 'interviewing' && (
              <View style={{ gap: 10 }}>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChangeText={setCurrentAnswer}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitButton, !currentAnswer.trim() && styles.submitButtonDisabled]}
                  onPress={handleSubmitAnswer}
                  disabled={!currentAnswer.trim()}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                  <CornerDownLeft color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            )}

            {status === 'evaluating' && (
              <View style={styles.evaluatingRow}>
                <ActivityIndicator color="#71717a" size="small" />
                <Text style={styles.evaluatingText}>Evaluating your response...</Text>
              </View>
            )}

            {status === 'feedback' && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                <Text style={styles.nextButtonText}>
                  {currentIndex + 1 < questions.length ? 'Next Question' : 'View Final Report'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {status === 'finished' && (
          <View style={styles.finishedCard}>
            <Text style={styles.finishedScore}>
              {finalReview?.score !== undefined ? finalReview.score : (finalReview?.rating ? finalReview.rating.split('/')[0] : '—')}
              <Text style={styles.finishedScoreMax}> /10</Text>
            </Text>
            <Text style={styles.finishedTitle}>Interview Complete</Text>
            {!!finalReview?.summary && <Text style={styles.finishedSummary}>{finalReview.summary}</Text>}

            {finalReview?.advice && finalReview.advice.length > 0 && (
              <View style={styles.adviceCard}>
                <View style={styles.adviceHeader}>
                  <AlertCircle color="#71717a" size={16} />
                  <Text style={styles.adviceHeaderText}>Areas for Improvement</Text>
                </View>
                {finalReview.advice.map((a, i) => (
                  <View key={i} style={styles.adviceRow}>
                    <View style={styles.adviceNumber}><Text style={styles.adviceNumberText}>{i + 1}</Text></View>
                    <Text style={styles.adviceText}>{a}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
              <RefreshCcw color="#fff" size={16} />
              <Text style={styles.restartButtonText}>Start New Interview</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#71717a', textAlign: 'center' },

  inputCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7' },
  label: { fontSize: 13, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#fafafa', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 16, fontSize: 16, color: '#09090b' },
  textArea: { height: 100 },
  startButton: { backgroundColor: '#09090b', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  startButtonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 15 },

  loadingCard: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontFamily: 'Geist_600SemiBold', fontWeight: '600', color: '#09090b', textAlign: 'center', maxWidth: 280 },

  progressBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e4e4e7' },
  progressText: { fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b' },
  endEarly: { fontSize: 12, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase' },

  chatRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatarDark: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' },
  avatarBlue: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarGreen: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },

  questionBubble: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 18, borderTopLeftRadius: 4, padding: 16 },
  currentQuestionBubble: { flex: 1, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#09090b', borderRadius: 18, borderTopLeftRadius: 4, padding: 18 },
  currentQuestionText: { fontSize: 18, fontFamily: 'Geist_800ExtraBold', fontWeight: '800', color: '#09090b', lineHeight: 24 },
  answerBubble: { flex: 1, maxWidth: '85%', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 18, borderTopRightRadius: 4, padding: 16 },
  answerText: { fontSize: 15, color: '#1e3a8a', fontFamily: 'Geist_500Medium', fontWeight: '500', lineHeight: 22 },
  feedbackBubble: { flex: 1, maxWidth: '85%', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 18, borderTopLeftRadius: 4, padding: 16 },
  feedbackText: { fontSize: 15, color: '#14532d', fontFamily: 'Geist_500Medium', fontWeight: '500', lineHeight: 22 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  focusBadge: { backgroundColor: '#f4f4f5', borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5 },
  diffBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontFamily: 'Geist_700Bold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, overflow: 'hidden' },
  questionText: { fontSize: 15, color: '#27272a', fontFamily: 'Geist_500Medium', fontWeight: '500', lineHeight: 21 },

  answerInput: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#d4d4d8', borderRadius: 18, padding: 18, minHeight: 120, fontSize: 16, color: '#09090b' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 14 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 15 },

  evaluatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f4f4f5', paddingVertical: 16, borderRadius: 999 },
  evaluatingText: { fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a', fontSize: 13 },

  nextButton: { backgroundColor: '#09090b', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 15 },

  finishedCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 28, padding: 28, alignItems: 'center' },
  finishedScore: { fontSize: 48, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b' },
  finishedScoreMax: { fontSize: 18, fontFamily: 'Geist_500Medium', fontWeight: '500', color: '#a1a1aa' },
  finishedTitle: { fontSize: 24, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b', marginTop: 8, marginBottom: 10 },
  finishedSummary: { fontSize: 15, color: '#71717a', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  adviceCard: { backgroundColor: '#fafafa', borderRadius: 20, padding: 20, width: '100%', marginBottom: 24 },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  adviceHeaderText: { fontSize: 12, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5 },
  adviceRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  adviceNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e4e7', alignItems: 'center', justifyContent: 'center' },
  adviceNumberText: { fontSize: 11, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#71717a' },
  adviceText: { flex: 1, fontSize: 14, color: '#27272a', fontFamily: 'Geist_500Medium', fontWeight: '500', lineHeight: 20 },
  restartButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#09090b', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14 },
  restartButtonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 15 },
});
