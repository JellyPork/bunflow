// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getNextTriggerDateAsync: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
}));

// Mock expo-intent-launcher
jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(),
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock expo-crypto
let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `mock-uuid-${mockUuidCounter++}`),
}));

// Mock expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  addSpeechRecognitionListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));
