/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional semantic colors
    cardBackground: '#ffe9ea',
    border: '#c8c8d4',
    borderActive: '#6a6aff',
    inputBackground: '#fff',
    inputBorder: '#000',
    modalBackground: '#fff',
    modalOverlay: 'rgba(0,0,0,0.25)',
    activeBackground: '#eef0ff',
    separator: '#eee',
    textSecondary: '#687076',
    danger: '#d32f2f',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional semantic colors
    cardBackground: '#2a2a2a',
    border: '#3a3a3a',
    borderActive: '#6a6aff',
    inputBackground: '#2a2a2a',
    inputBorder: '#4a4a4a',
    modalBackground: '#1f1f1f',
    modalOverlay: 'rgba(0,0,0,0.5)',
    activeBackground: '#2b2b48',
    separator: '#3a3a3a',
    textSecondary: '#9BA1A6',
    danger: '#ff6b6b',
  },
};
