import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
  outline?: boolean;
  titleColor?: string;
};

export function FeatureCard({ icon, title, desc, color, onPress, outline, titleColor }: FeatureCardProps) {
  return (
    <TouchableOpacity
      style={[styles.featureCard, outline && styles.featureCardOutline]}
      onPress={onPress}
    >
      <View style={[styles.featureIcon, { backgroundColor: color }]}>
        {icon}
      </View>
      <View style={styles.featureHeader}>
        <Text style={[styles.featureCardTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
        <ArrowRight color={titleColor || "#000"} size={20} />
      </View>
      <Text style={styles.featureCardDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featureCard: { backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: 24, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.5)' },
  featureCardOutline: { borderWidth: 2, borderColor: '#4ade80', backgroundColor: '#fff' },
  featureIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  featureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  featureCardTitle: { fontSize: 20, fontWeight: '700', color: '#09090b' },
  featureCardDesc: { color: '#71717a', fontSize: 15, lineHeight: 22 },
});
