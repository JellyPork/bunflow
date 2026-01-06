import { parseNaturalLanguageTask, inferTimeFromContext, weekdayNameToNumber, removeMatchedText } from '../taskParser';

describe('taskParser', () => {
  describe('Basic title extraction', () => {
    it('extracts simple title with no modifiers', () => {
      const result = parseNaturalLanguageTask('buy groceries');
      expect(result.title).toBe('buy groceries');
      expect(result.recurrence).toBe('none');
      expect(result.tags).toEqual([]);
    });

    it('removes temporal references from title', () => {
      const result = parseNaturalLanguageTask('buy groceries tomorrow');
      expect(result.title).toBe('buy groceries');
    });

    it('removes recurrence pattern from title', () => {
      const result = parseNaturalLanguageTask('water plants daily');
      expect(result.title).toBe('water plants');
      expect(result.recurrence).toBe('daily');
    });

    it('removes tags from title', () => {
      const result = parseNaturalLanguageTask('buy milk #groceries');
      expect(result.title).toBe('buy milk');
      expect(result.tags).toEqual(['groceries']);
    });

    it('removes priority keywords from title', () => {
      const result = parseNaturalLanguageTask('fix bug urgent');
      expect(result.title).toBe('fix bug');
      expect(result.priority).toBe(3);
    });

    it('handles title with multiple words', () => {
      const result = parseNaturalLanguageTask('take out the trash tomorrow morning');
      expect(result.title).toBe('take out the trash');
    });

    it('handles empty input gracefully', () => {
      const result = parseNaturalLanguageTask('');
      expect(result.title).toBe('');
      expect(result.recurrence).toBe('none');
    });

    it('handles title that becomes empty after cleanup', () => {
      const result = parseNaturalLanguageTask('daily #work urgent');
      expect(result.title).not.toBe('');
      expect(result.recurrence).toBe('daily');
    });
  });

  describe('Recurrence parsing', () => {
    it('parses "daily" as daily recurrence', () => {
      const result = parseNaturalLanguageTask('water plants daily');
      expect(result.recurrence).toBe('daily');
      expect(result.hour).toBe(9); // default time
      expect(result.minute).toBe(0);
    });

    it('parses "every day" as daily recurrence', () => {
      const result = parseNaturalLanguageTask('check email every day');
      expect(result.recurrence).toBe('daily');
    });

    it('parses "weekly" as weekly recurrence', () => {
      const result = parseNaturalLanguageTask('team meeting weekly');
      expect(result.recurrence).toBe('weekly');
    });

    it('parses "every week" as weekly recurrence', () => {
      const result = parseNaturalLanguageTask('review goals every week');
      expect(result.recurrence).toBe('weekly');
    });

    it('parses "every 2 days" as custom recurrence', () => {
      const result = parseNaturalLanguageTask('take trash out every 2 days');
      expect(result.recurrence).toBe('custom');
      expect(result.interval).toBe(2);
      expect(result.intervalUnit).toBe('days');
    });

    it('parses "every 3 days" as custom recurrence', () => {
      const result = parseNaturalLanguageTask('water garden every 3 days');
      expect(result.recurrence).toBe('custom');
      expect(result.interval).toBe(3);
      expect(result.intervalUnit).toBe('days');
    });

    it('parses "every 2 weeks" as custom recurrence', () => {
      const result = parseNaturalLanguageTask('dentist appointment every 2 weeks');
      expect(result.recurrence).toBe('custom');
      expect(result.interval).toBe(2);
      expect(result.intervalUnit).toBe('weeks');
    });

    it('parses "every monday" as weekly with weekdays', () => {
      const result = parseNaturalLanguageTask('gym every monday');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toEqual([1]); // Monday
    });

    it('parses "every monday and friday" as weekly with multiple weekdays', () => {
      const result = parseNaturalLanguageTask('standup every monday and friday');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toContain(1); // Monday
      expect(result.weekdays).toContain(5); // Friday
      expect(result.weekdays).toHaveLength(2);
    });

    it('parses multiple weekdays in different order', () => {
      const result = parseNaturalLanguageTask('exercise every wednesday monday friday');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toEqual([1, 3, 5]); // sorted
    });

    it('handles case-insensitive weekday names', () => {
      const result = parseNaturalLanguageTask('meeting every MONDAY and Friday');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toContain(1);
      expect(result.weekdays).toContain(5);
    });

    it('handles abbreviated weekday names', () => {
      const result = parseNaturalLanguageTask('call mom every mon and wed');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toContain(1);
      expect(result.weekdays).toContain(3);
    });

    it('defaults to "once" when time is specified without recurrence', () => {
      const result = parseNaturalLanguageTask('meeting tomorrow at 3pm');
      expect(result.recurrence).toBe('once');
      expect(result.hour).toBe(15);
    });

    it('uses "none" recurrence when no pattern detected', () => {
      const result = parseNaturalLanguageTask('buy milk');
      expect(result.recurrence).toBe('none');
    });
  });

  describe('Time parsing', () => {
    it('parses absolute time "at 9am"', () => {
      const result = parseNaturalLanguageTask('meeting at 9am');
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
    });

    it('parses absolute time "at 2pm"', () => {
      const result = parseNaturalLanguageTask('lunch at 2pm');
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(0);
    });

    it('parses time with minutes "at 2:30pm"', () => {
      const result = parseNaturalLanguageTask('appointment at 2:30pm');
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
    });

    it('parses time with minutes "at 10:15am"', () => {
      const result = parseNaturalLanguageTask('standup at 10:15am');
      expect(result.hour).toBe(10);
      expect(result.minute).toBe(15);
    });

    it('infers morning time as 9am', () => {
      const result = parseNaturalLanguageTask('walk dog tomorrow morning');
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
    });

    it('infers afternoon time as 2pm', () => {
      const result = parseNaturalLanguageTask('coffee break tomorrow afternoon');
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(0);
    });

    it('infers evening time as 6pm', () => {
      const result = parseNaturalLanguageTask('dinner tomorrow evening');
      expect(result.hour).toBe(18);
      expect(result.minute).toBe(0);
    });

    it('infers night time as 9pm', () => {
      const result = parseNaturalLanguageTask('take medicine tomorrow night');
      expect(result.hour).toBe(21);
      expect(result.minute).toBe(0);
    });

    it('defaults to 9am for daily recurrence without time', () => {
      const result = parseNaturalLanguageTask('water plants daily');
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
    });

    it('defaults to 9am for weekly recurrence without time', () => {
      const result = parseNaturalLanguageTask('team meeting weekly');
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
    });

    it('does not set time for "none" recurrence', () => {
      const result = parseNaturalLanguageTask('buy milk');
      expect(result.hour).toBeUndefined();
      expect(result.minute).toBeUndefined();
    });
  });

  describe('End date parsing', () => {
    it('parses "until june 6th"', () => {
      const result = parseNaturalLanguageTask('water plants daily until june 6th');
      expect(result.endDate).toBeDefined();
      const endDate = new Date(result.endDate!);
      expect(endDate.getMonth()).toBe(5); // June (0-indexed)
      expect(endDate.getDate()).toBe(6);
    });

    it('parses "through friday"', () => {
      const result = parseNaturalLanguageTask('take medicine daily through friday');
      expect(result.endDate).toBeDefined();
    });

    it('parses "ending march 1st"', () => {
      const result = parseNaturalLanguageTask('gym every day ending march 1st');
      expect(result.endDate).toBeDefined();
      const endDate = new Date(result.endDate!);
      expect(endDate.getMonth()).toBe(2); // March
      expect(endDate.getDate()).toBe(1);
    });

    it('parses "till december 31st"', () => {
      const result = parseNaturalLanguageTask('meditation daily till december 31st');
      expect(result.endDate).toBeDefined();
      const endDate = new Date(result.endDate!);
      expect(endDate.getMonth()).toBe(11); // December
      expect(endDate.getDate()).toBe(31);
    });

    it('sets end date to end of day (23:59:59)', () => {
      const result = parseNaturalLanguageTask('task daily until june 6th');
      expect(result.endDate).toBeDefined();
      const endDate = new Date(result.endDate!);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    it('handles task without end date', () => {
      const result = parseNaturalLanguageTask('water plants daily');
      expect(result.endDate).toBeUndefined();
    });
  });

  describe('Tag extraction', () => {
    it('extracts single hashtag', () => {
      const result = parseNaturalLanguageTask('buy milk #groceries');
      expect(result.tags).toEqual(['groceries']);
    });

    it('extracts single @ tag', () => {
      const result = parseNaturalLanguageTask('clean house @chores');
      expect(result.tags).toEqual(['chores']);
    });

    it('extracts multiple tags with different formats', () => {
      const result = parseNaturalLanguageTask('fix bug #work @urgent');
      expect(result.tags).toContain('work');
      expect(result.tags).toContain('urgent');
      expect(result.tags).toHaveLength(2);
    });

    it('extracts multiple hashtags', () => {
      const result = parseNaturalLanguageTask('meeting #work #important #q1');
      expect(result.tags).toEqual(['work', 'important', 'q1']);
    });

    it('handles tags with numbers', () => {
      const result = parseNaturalLanguageTask('review #q4goals #2024');
      expect(result.tags).toContain('q4goals');
      expect(result.tags).toContain('2024');
    });

    it('handles task without tags', () => {
      const result = parseNaturalLanguageTask('buy milk');
      expect(result.tags).toEqual([]);
    });
  });

  describe('Priority detection', () => {
    it('detects "urgent" as high priority', () => {
      const result = parseNaturalLanguageTask('fix bug urgent');
      expect(result.priority).toBe(3);
    });

    it('detects "high priority" as high priority', () => {
      const result = parseNaturalLanguageTask('meeting high priority');
      expect(result.priority).toBe(3);
    });

    it('detects "important" as high priority', () => {
      const result = parseNaturalLanguageTask('important call client');
      expect(result.priority).toBe(3);
    });

    it('detects "critical" as high priority', () => {
      const result = parseNaturalLanguageTask('critical system update');
      expect(result.priority).toBe(3);
    });

    it('detects "low priority" as low priority', () => {
      const result = parseNaturalLanguageTask('organize files low priority');
      expect(result.priority).toBe(1);
    });

    it('detects "minor" as low priority', () => {
      const result = parseNaturalLanguageTask('minor bug fix');
      expect(result.priority).toBe(1);
    });

    it('does not set priority when no keywords present', () => {
      const result = parseNaturalLanguageTask('buy milk');
      expect(result.priority).toBeUndefined();
    });
  });

  describe('Complex integration tests', () => {
    it('handles full example with all features', () => {
      const result = parseNaturalLanguageTask(
        'take trash out every 2 days at 9am #chores urgent until june 6th'
      );
      expect(result.title).toBe('take trash out');
      expect(result.recurrence).toBe('custom');
      expect(result.interval).toBe(2);
      expect(result.intervalUnit).toBe('days');
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
      expect(result.tags).toEqual(['chores']);
      expect(result.priority).toBe(3);
      expect(result.endDate).toBeDefined();
    });

    it('handles daily recurrence with time and end date', () => {
      const result = parseNaturalLanguageTask('water plants daily at 7am until august 1st');
      expect(result.title).toBe('water plants');
      expect(result.recurrence).toBe('daily');
      expect(result.hour).toBe(7);
      expect(result.minute).toBe(0);
      expect(result.endDate).toBeDefined();
    });

    it('handles weekly with specific days and tags', () => {
      const result = parseNaturalLanguageTask('gym every monday and wednesday #fitness #health');
      expect(result.title).toBe('gym');
      expect(result.recurrence).toBe('weekly');
      expect(result.weekdays).toContain(1);
      expect(result.weekdays).toContain(3);
      expect(result.tags).toEqual(['fitness', 'health']);
    });

    it('handles once with context time', () => {
      const result = parseNaturalLanguageTask('doctor appointment tomorrow afternoon #health important');
      expect(result.title).toBe('doctor appointment');
      expect(result.recurrence).toBe('once');
      expect(result.hour).toBe(14);
      expect(result.tags).toEqual(['health']);
      expect(result.priority).toBe(3);
    });

    it('handles custom weeks with priority', () => {
      const result = parseNaturalLanguageTask('review goals every 2 weeks at 10am low priority');
      expect(result.title).toBe('review goals');
      expect(result.recurrence).toBe('custom');
      expect(result.interval).toBe(2);
      expect(result.intervalUnit).toBe('weeks');
      expect(result.hour).toBe(10);
      expect(result.priority).toBe(1);
    });
  });

  describe('Helper functions', () => {
    describe('inferTimeFromContext', () => {
      it('returns 9am for morning', () => {
        const result = inferTimeFromContext('tomorrow morning');
        expect(result).toEqual({ hour: 9, minute: 0 });
      });

      it('returns 2pm for afternoon', () => {
        const result = inferTimeFromContext('tomorrow afternoon');
        expect(result).toEqual({ hour: 14, minute: 0 });
      });

      it('returns 6pm for evening', () => {
        const result = inferTimeFromContext('tomorrow evening');
        expect(result).toEqual({ hour: 18, minute: 0 });
      });

      it('returns 9pm for night', () => {
        const result = inferTimeFromContext('tomorrow night');
        expect(result).toEqual({ hour: 21, minute: 0 });
      });

      it('returns null when no context found', () => {
        const result = inferTimeFromContext('buy milk');
        expect(result).toBeNull();
      });
    });

    describe('weekdayNameToNumber', () => {
      it('converts monday to 1', () => {
        expect(weekdayNameToNumber('monday')).toBe(1);
        expect(weekdayNameToNumber('Mon')).toBe(1);
      });

      it('converts sunday to 0', () => {
        expect(weekdayNameToNumber('sunday')).toBe(0);
        expect(weekdayNameToNumber('Sun')).toBe(0);
      });

      it('converts friday to 5', () => {
        expect(weekdayNameToNumber('friday')).toBe(5);
        expect(weekdayNameToNumber('Fri')).toBe(5);
      });

      it('returns -1 for invalid day', () => {
        expect(weekdayNameToNumber('invalid')).toBe(-1);
      });
    });

    describe('removeMatchedText', () => {
      it('removes single match', () => {
        const result = removeMatchedText('buy milk tomorrow', ['tomorrow']);
        expect(result).toBe('buy milk');
      });

      it('removes multiple matches', () => {
        const result = removeMatchedText('buy milk tomorrow #groceries', ['tomorrow', '#groceries']);
        expect(result).toBe('buy milk');
      });

      it('cleans up extra whitespace', () => {
        const result = removeMatchedText('buy   milk   tomorrow', ['tomorrow']);
        expect(result).toBe('buy milk');
      });
    });
  });
});
