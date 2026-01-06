import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Alert, Platform } from 'react-native';
import { parseNaturalLanguageTask } from '@/lib/taskParser';
import { useTasks } from '@/store/useTasks';
import { useThemeColors } from '@/theme/AppThemeProvider';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

type Props = {
  onTaskCreated?: () => void;
};

export default function QuickAddInput({ onTaskCreated }: Props) {
  const colors = useThemeColors();
  const { addTask, addOrGetTagByName } = useTasks();

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [voicePermissionGranted, setVoicePermissionGranted] = useState(false);

  // Listen for speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const transcription = event.results[0]?.transcript;
    if (transcription) {
      setInputText(transcription);
      setShowPreview(true);
    }
  });

  // Listen for errors
  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    Alert.alert('Voice Input Error', event.error || 'Unknown error occurred');
    setIsRecording(false);
  });

  // Listen for end event
  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  // Request microphone permissions on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    ExpoSpeechRecognitionModule.getPermissionsAsync().then((result) => {
      if (result.granted) {
        setVoicePermissionGranted(true);
      } else if (result.canAskAgain) {
        // Auto-request permission on first load
        ExpoSpeechRecognitionModule.requestPermissionsAsync().then((newResult) => {
          setVoicePermissionGranted(newResult.granted);
        });
      }
    }).catch((error) => {
      console.log('Speech recognition not available:', error);
    });
  }, []);

  // Parse input in real-time for preview
  const parsed = inputText.trim() ? parseNaturalLanguageTask(inputText) : null;

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    const parsed = parseNaturalLanguageTask(inputText);

    // Convert tag names to IDs
    const tagIds = parsed.tags.map(name => addOrGetTagByName(name));

    // Create task
    await addTask({
      title: parsed.title || inputText, // fallback to original if parsing failed
      notes: parsed.notes,
      priority: parsed.priority ?? 2, // default to Medium
      tagIds,
      recurrence: parsed.recurrence,
      weekdays: parsed.weekdays,
      hour: parsed.hour,
      minute: parsed.minute,
      interval: parsed.interval,
      intervalUnit: parsed.intervalUnit,
      endDate: parsed.endDate,
    });

    // Clear input
    setInputText('');
    setShowPreview(false);
    onTaskCreated?.();
  };

  const toggleVoiceInput = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Voice Input', 'Voice input is not available on web. Please use text input.');
      return;
    }

    if (!voicePermissionGranted) {
      // Request permission
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Microphone Permission', 'Microphone permission is required for voice input.');
        return;
      }
      setVoicePermissionGranted(true);
    }

    try {
      if (isRecording) {
        ExpoSpeechRecognitionModule.stop();
        setIsRecording(false);
      } else {
        setIsRecording(true);
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          maxAlternatives: 1,
          continuous: false,
          requiresOnDeviceRecognition: false,
        });
      }
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Voice Input Error', 'Failed to start voice recognition. ' + (error instanceof Error ? error.message : String(error)));
      setIsRecording(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.inputRow}>
        {/* Microphone button */}
        <Pressable
          onPress={toggleVoiceInput}
          style={[
            styles.iconButton,
            { backgroundColor: isRecording ? '#ff6b6b' : colors.inputBackground },
            isRecording && styles.recordingButton
          ]}
        >
          <Text style={styles.icon}>{isRecording ? '⏹️' : '🎤'}</Text>
        </Pressable>

        {/* Text input */}
        <TextInput
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            setShowPreview(text.trim().length > 0);
          }}
          placeholder="Type or speak to add a task..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!inputText.trim()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.inputBackground },
            !inputText.trim() && styles.disabledButton
          ]}
        >
          <Text style={styles.icon}>➕</Text>
        </Pressable>
      </View>

      {/* Preview */}
      {showPreview && parsed && (
        <View style={styles.preview}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {parsed.title || inputText}
          </Text>

          {parsed.recurrence !== 'none' && (
            <Text style={[styles.previewDetail, { color: colors.textSecondary }]}>
              {formatRecurrencePreview(parsed)}
            </Text>
          )}

          {parsed.tags.length > 0 && (
            <Text style={[styles.previewDetail, { color: colors.textSecondary }]}>
              🏷️ {parsed.tags.map(t => `#${t}`).join(' ')}
            </Text>
          )}

          {parsed.endDate && (
            <Text style={[styles.previewDetail, { color: colors.textSecondary }]}>
              📅 Until {new Date(parsed.endDate).toLocaleDateString()}
            </Text>
          )}

          {parsed.priority && (
            <Text style={[styles.previewDetail, { color: colors.textSecondary }]}>
              {parsed.priority === 3 ? '⚡ High Priority' : parsed.priority === 1 ? '📋 Low Priority' : ''}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function formatRecurrencePreview(parsed: any): string {
  const timeStr = parsed.hour !== undefined
    ? ` at ${formatTime(parsed.hour, parsed.minute ?? 0)}`
    : '';

  switch (parsed.recurrence) {
    case 'once':
      return `🔔 Once${timeStr}`;
    case 'daily':
      return `🔁 Every day${timeStr}`;
    case 'weekly':
      if (parsed.weekdays?.length) {
        const days = parsed.weekdays.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
        return `🔁 Every ${days}${timeStr}`;
      }
      return `🔁 Weekly${timeStr}`;
    case 'custom':
      if (parsed.interval && parsed.intervalUnit) {
        return `🔁 Every ${parsed.interval} ${parsed.intervalUnit}${timeStr}`;
      }
      return `🔁 Custom${timeStr}`;
    default:
      return '';
  }
}

function formatTime(hour: number, minute: number): string {
  const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  recordingButton: {
    backgroundColor: '#ff6b6b',
  },
  disabledButton: {
    opacity: 0.3,
  },
  icon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  preview: {
    paddingTop: 4,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
    paddingTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewDetail: {
    fontSize: 12,
  },
});
