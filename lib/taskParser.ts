import * as chrono from 'chrono-node';
import type { Recurrence } from './notifications';

export type ParsedTask = {
  title: string;              // Cleaned title with temporal/recurrence phrases removed
  recurrence: Recurrence;     // "none" | "once" | "daily" | "weekly" | "custom"
  hour?: number;              // 0-23
  minute?: number;            // 0-59
  weekdays?: number[];        // 0-6 for weekly (JS day format: 0=Sun, 6=Sat)
  interval?: number;          // e.g., 2 for "every 2 days"
  intervalUnit?: 'days' | 'weeks';
  endDate?: number;           // timestamp
  tags: string[];             // extracted tag names (not IDs)
  priority?: number;          // 1-3 (Low/Medium/High)
  notes?: string;             // additional context
};

// Patterns for parsing
const PATTERNS = {
  // Recurrence patterns
  everyNDays: /every\s+(\d+)\s+days?/i,
  everyNWeeks: /every\s+(\d+)\s+weeks?/i,
  everyDay: /every\s+day|daily/i,
  everyWeek: /every\s+week|weekly/i,
  // Updated weekday pattern - matches individual weekday names or abbreviations
  weekdayPattern: /(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat|sunday|sun)\b/gi,

  // End date patterns - capture everything after the keyword
  endDate: /(?:until|through|ending|till)\s+(.+)/i,

  // Tag patterns (both # and @ supported)
  tags: /[#@](\w+)/g,

  // Priority patterns
  highPriority: /\b(urgent|high\s*priority|important|critical)\b/i,
  lowPriority: /\b(low\s*priority|minor|trivial)\b/i,
};

// Map weekday names to JS day numbers (0=Sun, 6=Sat)
const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

/**
 * Infer time from context words like "morning", "afternoon", "evening", "night"
 */
export function inferTimeFromContext(text: string): { hour: number; minute: number } | null {
  const morning = /\bmorning\b/i;
  const afternoon = /\bafternoon\b/i;
  const evening = /\bevening\b/i;
  const night = /\bnight\b/i;

  if (morning.test(text)) return { hour: 9, minute: 0 };
  if (afternoon.test(text)) return { hour: 14, minute: 0 };
  if (evening.test(text)) return { hour: 18, minute: 0 };
  if (night.test(text)) return { hour: 21, minute: 0 };
  return null;
}

/**
 * Convert weekday name to JS day number (0-6)
 */
export function weekdayNameToNumber(name: string): number {
  return WEEKDAY_MAP[name.toLowerCase()] ?? -1;
}

/**
 * Remove matched text from input, cleaning up extra whitespace
 */
export function removeMatchedText(text: string, matches: string[]): string {
  let result = text;
  matches.forEach(match => {
    result = result.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  });
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Main parsing function - extracts structured task data from natural language input
 */
export function parseNaturalLanguageTask(input: string): ParsedTask {
  const result: ParsedTask = {
    title: '',
    recurrence: 'none',
    tags: [],
  };

  const matchedPhrases: string[] = [];

  // 1. Extract tags (#tag or @tag)
  const tagMatches = input.match(PATTERNS.tags);
  if (tagMatches) {
    result.tags = tagMatches.map(t => t.slice(1)); // Remove # or @
    matchedPhrases.push(...tagMatches);
  }

  // 2. Extract priority
  if (PATTERNS.highPriority.test(input)) {
    result.priority = 3;
    const match = input.match(PATTERNS.highPriority);
    if (match) matchedPhrases.push(match[0]);
  } else if (PATTERNS.lowPriority.test(input)) {
    result.priority = 1;
    const match = input.match(PATTERNS.lowPriority);
    if (match) matchedPhrases.push(match[0]);
  }

  // 3. Extract recurrence pattern
  let recurrenceMatched = false;

  // Check for specific weekdays FIRST (e.g., "every monday and friday")
  // This needs to be before "every N days/weeks" to avoid conflicts
  const weekdayMatches = input.match(PATTERNS.weekdayPattern);
  if (weekdayMatches) {
    const weekdays = weekdayMatches
      .map(day => weekdayNameToNumber(day))
      .filter(num => num >= 0);

    if (weekdays.length > 0) {
      result.recurrence = 'weekly';
      result.weekdays = Array.from(new Set(weekdays)).sort(); // unique and sorted
      matchedPhrases.push(...weekdayMatches);
      matchedPhrases.push('every'); // also remove the "every" keyword
      matchedPhrases.push('and'); // remove "and" connector
      recurrenceMatched = true;
    }
  }

  // Check "every N days" pattern
  if (!recurrenceMatched) {
    const everyNDaysMatch = input.match(PATTERNS.everyNDays);
    if (everyNDaysMatch) {
      const interval = parseInt(everyNDaysMatch[1], 10);
      if (interval > 0) {
        result.recurrence = 'custom';
        result.interval = interval;
        result.intervalUnit = 'days';
        matchedPhrases.push(everyNDaysMatch[0]);
        recurrenceMatched = true;
      }
    }
  }

  // Check "every N weeks" pattern
  if (!recurrenceMatched) {
    const everyNWeeksMatch = input.match(PATTERNS.everyNWeeks);
    if (everyNWeeksMatch) {
      const interval = parseInt(everyNWeeksMatch[1], 10);
      if (interval > 0) {
        result.recurrence = 'custom';
        result.interval = interval;
        result.intervalUnit = 'weeks';
        matchedPhrases.push(everyNWeeksMatch[0]);
        recurrenceMatched = true;
      }
    }
  }

  // Check "every day" or "daily" pattern
  if (!recurrenceMatched && PATTERNS.everyDay.test(input)) {
    result.recurrence = 'daily';
    const match = input.match(PATTERNS.everyDay);
    if (match) matchedPhrases.push(match[0]);
    recurrenceMatched = true;
  }

  // Check "every week" or "weekly" pattern
  if (!recurrenceMatched && PATTERNS.everyWeek.test(input)) {
    result.recurrence = 'weekly';
    const match = input.match(PATTERNS.everyWeek);
    if (match) matchedPhrases.push(match[0]);
    recurrenceMatched = true;
  }

  // 4. Extract end date FIRST (before time parsing)
  // This prevents chrono from confusing end dates with times
  let inputWithoutEndDate = input;
  const endDateMatch = input.match(PATTERNS.endDate);
  if (endDateMatch) {
    const fullMatch = endDateMatch[0];
    const endDatePhrase = endDateMatch[1].trim();

    // Parse the end date phrase with chrono
    const endChronoResults = chrono.parse(endDatePhrase);

    if (endChronoResults.length > 0) {
      const endDateObj = endChronoResults[0].start.date();
      // Set to end of day for the end date
      endDateObj.setHours(23, 59, 59, 999);
      result.endDate = endDateObj.getTime();

      // Add full match to cleanup
      matchedPhrases.push(fullMatch);

      // Also add the parsed text from chrono
      if (endChronoResults[0].text) {
        matchedPhrases.push(endChronoResults[0].text);
      }

      // Remove ordinal indicators (1st, 2nd, 3rd, 4th, etc.) from title
      const ordinalPattern = /\b\d+(st|nd|rd|th)\b/gi;
      const ordinals = endDatePhrase.match(ordinalPattern);
      if (ordinals) {
        matchedPhrases.push(...ordinals);
      }

      // Remove end date from input before parsing time
      inputWithoutEndDate = input.replace(fullMatch, '');
    }
  }

  // 5. Extract date/time using chrono-node (without end date phrase)
  const chronoResults = chrono.parse(inputWithoutEndDate);

  if (chronoResults.length > 0) {
    const firstResult = chronoResults[0];

    // Extract time if available
    if (firstResult.start.isCertain('hour')) {
      const hour = firstResult.start.get('hour');
      const minute = firstResult.start.get('minute');
      if (hour !== null) {
        result.hour = hour;
        result.minute = minute ?? 0;

        // If we have a time and no recurrence, default to "once"
        if (!recurrenceMatched) {
          result.recurrence = 'once';
        }
      }
    } else {
      // No explicit time, try to infer from context
      const inferredTime = inferTimeFromContext(input);
      if (inferredTime) {
        result.hour = inferredTime.hour;
        result.minute = inferredTime.minute;

        if (!recurrenceMatched) {
          result.recurrence = 'once';
        }
      }
    }

    // Add matched text to cleanup list
    if (firstResult.text) {
      matchedPhrases.push(firstResult.text);
    }
  } else {
    // No chrono results, but check for context-based time inference
    const inferredTime = inferTimeFromContext(input);
    if (inferredTime) {
      result.hour = inferredTime.hour;
      result.minute = inferredTime.minute;

      if (!recurrenceMatched) {
        result.recurrence = 'once';
      }

      // Remove context words
      const contextMatch = input.match(/\b(morning|afternoon|evening|night)\b/i);
      if (contextMatch) matchedPhrases.push(contextMatch[0]);
    }
  }

  // 6. Clean title by removing all matched phrases
  result.title = removeMatchedText(input, matchedPhrases);

  // If title is empty after cleanup, use original input
  if (!result.title.trim()) {
    result.title = input.trim();
  }

  // 7. If we have recurrence but no time, default to 9am
  if (result.recurrence !== 'none' && result.hour === undefined) {
    result.hour = 9;
    result.minute = 0;
  }

  return result;
}
