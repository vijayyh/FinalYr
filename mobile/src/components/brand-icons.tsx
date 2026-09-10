import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

type IconProps = { size?: number };

// Official LinkedIn glyph (as used across the LinkedIn brand) on its brand-blue background.
export function LinkedInIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        fill="#ffffff"
      />
    </Svg>
  );
}

// Target with a checkmark tick - ATS parsing / scoring.
export function AtsIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="12" r="8.5" stroke="#ffffff" strokeWidth="2" />
      <Circle cx="11" cy="12" r="4.5" stroke="#ffffff" strokeWidth="2" />
      <Path d="M15.5 16.5L21 22M21 22V17.5M21 22H16.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Folded letter with a subtle motion line - cover letter generation.
export function CoverLetterIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="#ffffff" strokeWidth="2" />
      <Path d="M3 7l9 6 9-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Connected nodes forming a path - skill graph / prerequisite roadmap.
export function SkillGapIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="6" r="2.5" stroke="#ffffff" strokeWidth="2" />
      <Circle cx="19" cy="6" r="2.5" stroke="#ffffff" strokeWidth="2" />
      <Circle cx="12" cy="18" r="2.5" stroke="#ffffff" strokeWidth="2" />
      <Path d="M7 7.5L10.2 16M17 7.5L13.8 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Document with a sparkle - AI-assisted resume building.
export function BuilderIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2.5h8l5 5V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V4A1.5 1.5 0 016 2.5z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9 12h6M9 16h6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <G>
        <Path d="M18.5 6.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#ffffff" />
      </G>
    </Svg>
  );
}

// Chat bubble with a mic - interactive mock interview.
export function MockInterviewIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 5.5A2.5 2.5 0 015.5 3h13A2.5 2.5 0 0121 5.5v9a2.5 2.5 0 01-2.5 2.5H10l-4.5 4v-4H5.5A2.5 2.5 0 013 14.5v-9z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
      <Rect x="10.5" y="6" width="3" height="5.5" rx="1.5" stroke="#ffffff" strokeWidth="1.6" />
      <Path d="M8.5 10.5a3.5 3.5 0 007 0" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
