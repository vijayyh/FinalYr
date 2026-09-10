import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Copy, Plus, Trash2 } from 'lucide-react-native';
import { BuilderIcon } from '../../components/brand-icons';
import { buildResume } from '../../services/api';

type Education = { degree: string; university: string; year: string };
type Experience = { job_title: string; company: string; date: string; description: string };
type BuiltExperience = { job_title: string; company: string; date: string; bullets: string[] };
type BuiltResume = {
  personal: Record<string, string>;
  summary: string;
  education: Education[];
  experience: BuiltExperience[];
  skills: string[];
};

export default function BuilderScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState<Education[]>([{ degree: '', university: '', year: '' }]);
  const [experience, setExperience] = useState<Experience[]>([{ job_title: '', company: '', date: '', description: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BuiltResume | null>(null);

  const updateEducation = (i: number, field: keyof Education, value: string) => {
    setEducation((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };
  const updateExperience = (i: number, field: keyof Experience, value: string) => {
    setExperience((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const handleGenerate = async () => {
    if (!name || !email) {
      Alert.alert('Missing Info', 'Please enter at least your name and email.');
      return;
    }
    if (!skills.trim()) {
      Alert.alert('Missing Info', 'Please list at least one skill.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await buildResume({
        personal: { name, email, phone, linkedin },
        education: education.filter((e) => e.degree || e.university),
        experience: experience.filter((e) => e.job_title || e.company),
        skills,
      });
      if (data.status === 'success') {
        setResult(data.data);
      } else {
        Alert.alert('Error', 'Failed to build resume.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to build resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const lines: string[] = [
      result.personal.name,
      [result.personal.email, result.personal.phone, result.personal.linkedin].filter(Boolean).join(' | '),
      '',
      result.summary,
      '',
      ...result.experience.flatMap((exp) => [
        `${exp.job_title} — ${exp.company} (${exp.date})`,
        ...exp.bullets.map((b) => `• ${b}`),
        '',
      ]),
      'Education:',
      ...result.education.map((ed) => `${ed.degree}, ${ed.university} (${ed.year})`),
      '',
      `Skills: ${result.skills.join(', ')}`,
    ];
    Clipboard.setString(lines.join('\n'));
    Alert.alert('Copied!', 'Resume copied to clipboard.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <BuilderIcon size={28} />
        </View>
        <Text style={styles.title}>Smart Resume Builder</Text>
        <Text style={styles.subtitle}>Build a stunning, ATS-friendly resume from scratch.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.sectionLabel}>Personal Details</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>LinkedIn / Website</Text>
        <TextInput style={styles.input} placeholder="linkedin.com/in/johndoe" value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" />
      </View>

      <View style={styles.inputCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Education</Text>
          <TouchableOpacity onPress={() => setEducation((p) => [...p, { degree: '', university: '', year: '' }])}>
            <Plus color="#a855f7" size={20} />
          </TouchableOpacity>
        </View>
        {education.map((ed, i) => (
          <View key={i} style={styles.entryBlock}>
            {education.length > 1 && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => setEducation((p) => p.filter((_, idx) => idx !== i))}>
                <Trash2 color="#ef4444" size={16} />
              </TouchableOpacity>
            )}
            <Text style={styles.label}>Degree</Text>
            <TextInput style={styles.input} placeholder="B.S. Computer Science" value={ed.degree} onChangeText={(v) => updateEducation(i, 'degree', v)} />
            <Text style={styles.label}>University</Text>
            <TextInput style={styles.input} placeholder="MIT" value={ed.university} onChangeText={(v) => updateEducation(i, 'university', v)} />
            <Text style={styles.label}>Year</Text>
            <TextInput style={styles.input} placeholder="2024" value={ed.year} onChangeText={(v) => updateEducation(i, 'year', v)} />
          </View>
        ))}
      </View>

      <View style={styles.inputCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Experience</Text>
          <TouchableOpacity onPress={() => setExperience((p) => [...p, { job_title: '', company: '', date: '', description: '' }])}>
            <Plus color="#a855f7" size={20} />
          </TouchableOpacity>
        </View>
        {experience.map((exp, i) => (
          <View key={i} style={styles.entryBlock}>
            {experience.length > 1 && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => setExperience((p) => p.filter((_, idx) => idx !== i))}>
                <Trash2 color="#ef4444" size={16} />
              </TouchableOpacity>
            )}
            <Text style={styles.label}>Job Title</Text>
            <TextInput style={styles.input} placeholder="Software Engineer" value={exp.job_title} onChangeText={(v) => updateExperience(i, 'job_title', v)} />
            <Text style={styles.label}>Company</Text>
            <TextInput style={styles.input} placeholder="Acme Corp" value={exp.company} onChangeText={(v) => updateExperience(i, 'company', v)} />
            <Text style={styles.label}>Dates</Text>
            <TextInput style={styles.input} placeholder="2022 - Present" value={exp.date} onChangeText={(v) => updateExperience(i, 'date', v)} />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What did you work on?"
              value={exp.description}
              onChangeText={(v) => updateExperience(i, 'description', v)}
              multiline
              numberOfLines={4}
            />
          </View>
        ))}
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.sectionLabel}>Skills</Text>
        <Text style={styles.label}>Comma-separated</Text>
        <TextInput style={styles.input} placeholder="Python, React, AWS, Docker" value={skills} onChangeText={setSkills} />

        <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Resume</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your Enhanced Resume</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Copy color="#4b5563" size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{result.personal.name}</Text>
            <Text style={styles.resultContact}>
              {[result.personal.email, result.personal.phone, result.personal.linkedin].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            {result.experience.map((exp, i) => (
              <View key={i} style={styles.resultBlock}>
                <Text style={styles.resultJobTitle}>{exp.job_title} — {exp.company}</Text>
                <Text style={styles.resultDate}>{exp.date}</Text>
                {exp.bullets.map((b, j) => (
                  <Text key={j} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}

            {result.education.length > 0 && (
              <View style={styles.resultBlock}>
                <Text style={styles.resultJobTitle}>Education</Text>
                {result.education.map((ed, i) => (
                  <Text key={i} style={styles.resultDate}>{ed.degree}, {ed.university} ({ed.year})</Text>
                ))}
              </View>
            )}

            <View style={styles.skillsRow}>
              {result.skills.map((s, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
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
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#71717a', textAlign: 'center' },
  inputCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 18, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 8 },
  entryBlock: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e4e4e7' },
  removeBtn: { alignSelf: 'flex-end', padding: 4 },
  label: { fontSize: 14, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, fontSize: 16 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  button: { backgroundColor: '#a855f7', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Geist_700Bold', fontWeight: '700', fontSize: 16 },
  resultContainer: { marginTop: 8 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 20, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b' },
  copyBtn: { padding: 8, backgroundColor: '#e5e7eb', borderRadius: 8 },
  resultCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e4e4e7' },
  resultName: { fontSize: 22, fontFamily: 'Geist_900Black', fontWeight: '900', color: '#09090b' },
  resultContact: { fontSize: 14, color: '#71717a', marginBottom: 12 },
  resultSummary: { fontSize: 15, color: '#1f2937', lineHeight: 22, marginBottom: 16 },
  resultBlock: { marginBottom: 16 },
  resultJobTitle: { fontSize: 16, fontFamily: 'Geist_700Bold', fontWeight: '700', color: '#09090b' },
  resultDate: { fontSize: 13, color: '#71717a', marginBottom: 6 },
  bullet: { fontSize: 14, color: '#1f2937', lineHeight: 20, marginLeft: 4 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  skillChip: { backgroundColor: '#f3e8ff', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  skillChipText: { fontSize: 13, fontFamily: 'Geist_600SemiBold', fontWeight: '600', color: '#7e22ce' },
});
