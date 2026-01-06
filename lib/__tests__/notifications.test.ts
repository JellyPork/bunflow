import * as Notifications from 'expo-notifications';
import {
  nextDateAtTime,
  nextWeekdayDate,
  toIsoLocal,
  scheduleTaskNotifications,
  cancelManyNotifications,
} from '../notifications';

describe('toIsoLocal', () => {
  it('formats date correctly as YYYY-MM-DD HH:MM:SS', () => {
    const date = new Date('2025-01-15T14:30:45.123Z');
    const result = toIsoLocal(date);

    // Result should be in local time format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('pads single-digit values with leading zeros', () => {
    const date = new Date(2025, 0, 5, 8, 9, 7); // Jan 5, 08:09:07
    const result = toIsoLocal(date);

    expect(result).toBe('2025-01-05 08:09:07');
  });

  it('handles month boundaries correctly', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59); // Dec 31, 2024
    const result = toIsoLocal(date);

    expect(result).toBe('2024-12-31 23:59:59');
  });

  it('handles year boundaries correctly', () => {
    const date = new Date(2025, 0, 1, 0, 0, 0); // Jan 1, 2025
    const result = toIsoLocal(date);

    expect(result).toBe('2025-01-01 00:00:00');
  });
});

describe('nextDateAtTime', () => {
  it('returns today at specified time if current time is before that time', () => {
    const from = new Date('2025-01-15T10:00:00'); // 10 AM
    const result = nextDateAtTime(14, 30, from); // Request 2:30 PM

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('returns tomorrow at specified time if current time is after that time', () => {
    const from = new Date('2025-01-15T16:00:00'); // 4 PM
    const result = nextDateAtTime(14, 30, from); // Request 2:30 PM

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(16); // Next day
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('returns tomorrow if exactly at specified time (due to 1000ms buffer)', () => {
    const from = new Date('2025-01-15T14:30:00.000'); // Exactly 2:30 PM
    const result = nextDateAtTime(14, 30, from);

    expect(result.getDate()).toBe(16); // Next day due to buffer
  });

  it('returns tomorrow if within 1 second of specified time', () => {
    const from = new Date('2025-01-15T14:29:59.500'); // 0.5s before 2:30 PM
    const result = nextDateAtTime(14, 30, from);

    expect(result.getDate()).toBe(16); // Next day due to buffer
  });

  it('correctly sets seconds and milliseconds to 0', () => {
    const from = new Date('2025-01-15T10:45:30.789');
    const result = nextDateAtTime(14, 30, from);

    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('handles month boundary correctly', () => {
    const from = new Date('2025-01-31T16:00:00'); // Last day of January
    const result = nextDateAtTime(14, 30, from); // Time already passed

    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(1);
  });

  it('handles year boundary correctly', () => {
    const from = new Date('2024-12-31T16:00:00'); // Last day of year
    const result = nextDateAtTime(14, 30, from); // Time already passed

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(1);
  });
});

describe('nextWeekdayDate', () => {
  it('returns correct date for weekday later in the same week', () => {
    const from = new Date('2025-01-13T10:00:00'); // Monday, Jan 13
    const result = nextWeekdayDate(5, 14, 30, from); // Friday at 2:30 PM

    expect(result.getDate()).toBe(17); // Friday, Jan 17
    expect(result.getDay()).toBe(5); // Friday
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('returns next week for same weekday if time already passed', () => {
    const from = new Date('2025-01-13T16:00:00'); // Monday, Jan 13, 4 PM
    const result = nextWeekdayDate(1, 14, 30, from); // Monday at 2:30 PM (already passed)

    expect(result.getDate()).toBe(20); // Next Monday, Jan 20
    expect(result.getDay()).toBe(1); // Monday
  });

  it('returns this week for same weekday if time has not passed', () => {
    const from = new Date('2025-01-13T10:00:00'); // Monday, Jan 13, 10 AM
    const result = nextWeekdayDate(1, 14, 30, from); // Monday at 2:30 PM (not yet passed)

    expect(result.getDate()).toBe(13); // Same Monday
    expect(result.getDay()).toBe(1);
  });

  it('handles wrapping from Saturday to Sunday', () => {
    const from = new Date('2025-01-18T10:00:00'); // Saturday, Jan 18
    const result = nextWeekdayDate(0, 14, 30, from); // Sunday at 2:30 PM

    expect(result.getDate()).toBe(19); // Sunday, Jan 19
    expect(result.getDay()).toBe(0); // Sunday
  });

  it('handles wrapping from Sunday to Monday', () => {
    const from = new Date('2025-01-19T10:00:00'); // Sunday, Jan 19
    const result = nextWeekdayDate(1, 14, 30, from); // Monday at 2:30 PM

    expect(result.getDate()).toBe(20); // Monday, Jan 20
    expect(result.getDay()).toBe(1); // Monday
  });

  it('handles all weekdays correctly (0-6)', () => {
    const from = new Date('2025-01-13T10:00:00'); // Monday, Jan 13

    const sunday = nextWeekdayDate(0, 14, 30, from);
    expect(sunday.getDay()).toBe(0);

    const wednesday = nextWeekdayDate(3, 14, 30, from);
    expect(wednesday.getDay()).toBe(3);

    const saturday = nextWeekdayDate(6, 14, 30, from);
    expect(saturday.getDay()).toBe(6);
  });

  it('returns next week if exactly at specified time (due to 1000ms buffer)', () => {
    const from = new Date('2025-01-13T14:30:00.000'); // Monday, exactly 2:30 PM
    const result = nextWeekdayDate(1, 14, 30, from); // Monday at 2:30 PM

    expect(result.getDate()).toBe(20); // Next Monday due to buffer
  });

  it('correctly sets seconds and milliseconds to 0', () => {
    const from = new Date('2025-01-13T10:45:30.789'); // Monday
    const result = nextWeekdayDate(3, 14, 30, from); // Wednesday

    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('scheduleTaskNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock implementations
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('mock-notification-id');
    (Notifications.getNextTriggerDateAsync as jest.Mock).mockResolvedValue(null);
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
  });

  it('returns empty array for recurrence "none"', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Test Task',
      recurrence: 'none',
    });

    expect(result).toEqual([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules 30 notifications for "daily" recurrence', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Daily Task',
      recurrence: 'daily',
      hour: 9,
      minute: 0,
    });

    expect(result).toHaveLength(30);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(30);
  });

  it('uses default hour=9, minute=0 when not provided', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Daily Task',
      recurrence: 'daily',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;

    expect(triggerDate.getHours()).toBe(9);
    expect(triggerDate.getMinutes()).toBe(0);
  });

  it('schedules notifications for "weekly" with weekdays', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Weekly Task',
      recurrence: 'weekly',
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      hour: 10,
      minute: 30,
    });

    // Should schedule 12 weeks * 3 days = up to 36 notifications
    // (some might be skipped if in the past)
    expect(result.length).toBeGreaterThan(0);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('returns empty array for "weekly" without weekdays', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Weekly Task',
      recurrence: 'weekly',
      hour: 10,
      minute: 30,
    });

    expect(result).toEqual([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('adds emoji prefix to notification title', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Test Task',
      recurrence: 'daily',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(firstCall.content.title).toBe('📌 Test Task');
  });

  it('includes body in notification content', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Test Task',
      body: 'Custom reminder message',
      recurrence: 'daily',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(firstCall.content.body).toBe('Custom reminder message');
  });

  it('uses undefined body when not provided', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Test Task',
      recurrence: 'daily',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(firstCall.content.body).toBeUndefined();
  });

  it('schedules exactly one notification for "once" recurrence', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Task',
      recurrence: 'once',
      hour: 15,
      minute: 30,
    });

    expect(result).toHaveLength(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('schedules "once" notification at correct time (uses nextDateAtTime logic)', async () => {
    // This test verifies that "once" uses nextDateAtTime which is already tested above
    // It will schedule for the next occurrence of the specified time
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Task',
      recurrence: 'once',
      hour: 15, // 3 PM
      minute: 30,
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;

    // Should be scheduled at 3:30 PM
    expect(triggerDate.getHours()).toBe(15);
    expect(triggerDate.getMinutes()).toBe(30);
    expect(triggerDate.getSeconds()).toBe(0);
  });

  it('schedules "once" notification in the future', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Task',
      recurrence: 'once',
      hour: 23, // 11 PM - likely in future
      minute: 59,
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;

    // Verify it's scheduled in the future
    expect(triggerDate.getTime()).toBeGreaterThan(Date.now());
    expect(triggerDate.getHours()).toBe(23);
    expect(triggerDate.getMinutes()).toBe(59);
  });

  it('uses default hour=9, minute=0 for "once" when not provided', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Task',
      recurrence: 'once',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;

    expect(triggerDate.getHours()).toBe(9);
    expect(triggerDate.getMinutes()).toBe(0);
  });

  it('adds emoji prefix to "once" notification title', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Reminder',
      recurrence: 'once',
      hour: 14,
      minute: 0,
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(firstCall.content.title).toBe('📌 One-time Reminder');
  });

  it('includes body in "once" notification content', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'One-time Task',
      body: 'Don\'t forget this!',
      recurrence: 'once',
      hour: 14,
      minute: 0,
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(firstCall.content.body).toBe('Don\'t forget this!');
  });

  // Custom interval tests
  it('schedules notifications for "custom" recurrence with days interval', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Every 2 Days Task',
      recurrence: 'custom',
      interval: 2,
      intervalUnit: 'days',
      hour: 9,
      minute: 0,
    });

    // Should schedule 30 notifications (default for days without endDate)
    expect(result).toHaveLength(30);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(30);

    // Verify interval spacing
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const firstDate = calls[0][0].trigger.date;
    const secondDate = calls[1][0].trigger.date;
    const diffMs = secondDate.getTime() - firstDate.getTime();
    const expectedDiffMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

    expect(diffMs).toBe(expectedDiffMs);
  });

  it('schedules notifications for "custom" recurrence with weeks interval', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Every 3 Weeks Task',
      recurrence: 'custom',
      interval: 3,
      intervalUnit: 'weeks',
      hour: 10,
      minute: 30,
    });

    // Should schedule 12 notifications (default for weeks without endDate)
    expect(result).toHaveLength(12);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(12);

    // Verify interval spacing
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const firstDate = calls[0][0].trigger.date;
    const secondDate = calls[1][0].trigger.date;
    const diffMs = secondDate.getTime() - firstDate.getTime();
    const expectedDiffMs = 3 * 7 * 24 * 60 * 60 * 1000; // 3 weeks in milliseconds

    expect(diffMs).toBe(expectedDiffMs);
  });

  it('returns empty array for "custom" recurrence without interval', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Custom Task',
      recurrence: 'custom',
      hour: 9,
      minute: 0,
    });

    expect(result).toEqual([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('returns empty array for "custom" recurrence without intervalUnit', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Custom Task',
      recurrence: 'custom',
      interval: 2,
      hour: 9,
      minute: 0,
    });

    expect(result).toEqual([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('respects max 100 notifications for custom intervals', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Very Frequent Task',
      recurrence: 'custom',
      interval: 1,
      intervalUnit: 'days',
      hour: 9,
      minute: 0,
    });

    // Should be capped at 100 even though default would be higher
    expect(result.length).toBeLessThanOrEqual(100);
  });

  // End date tests
  it('respects end date for "daily" recurrence', async () => {
    const now = Date.now();
    const endDate = now + (5 * 24 * 60 * 60 * 1000); // 5 days from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Daily Task with End Date',
      recurrence: 'daily',
      hour: 9,
      minute: 0,
      endDate,
    });

    // Should only schedule up to end date (5 notifications)
    expect(result.length).toBeLessThanOrEqual(5);

    // Verify all scheduled notifications are before end date
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(call => {
      const triggerDate = call[0].trigger.date;
      expect(triggerDate.getTime()).toBeLessThanOrEqual(endDate);
    });
  });

  it('respects end date for "weekly" recurrence', async () => {
    const now = Date.now();
    const endDate = now + (14 * 24 * 60 * 60 * 1000); // 2 weeks from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Weekly Task with End Date',
      recurrence: 'weekly',
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      hour: 10,
      minute: 0,
      endDate,
    });

    // Verify all scheduled notifications are before end date
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(call => {
      const triggerDate = call[0].trigger.date;
      expect(triggerDate.getTime()).toBeLessThanOrEqual(endDate);
    });

    // Should have fewer notifications than without end date
    expect(result.length).toBeLessThan(36); // 12 weeks * 3 days
  });

  it('respects end date for "custom" recurrence', async () => {
    const now = Date.now();
    const endDate = now + (10 * 24 * 60 * 60 * 1000); // 10 days from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Custom Task with End Date',
      recurrence: 'custom',
      interval: 2,
      intervalUnit: 'days',
      hour: 9,
      minute: 0,
      endDate,
    });

    // Should schedule only until end date (max 5 notifications for every 2 days over 10 days)
    expect(result.length).toBeLessThanOrEqual(5);

    // Verify all scheduled notifications are before end date
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(call => {
      const triggerDate = call[0].trigger.date;
      expect(triggerDate.getTime()).toBeLessThanOrEqual(endDate);
    });
  });

  it('returns empty array when end date is in the past', async () => {
    const endDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Task with Past End Date',
      recurrence: 'daily',
      hour: 9,
      minute: 0,
      endDate,
    });

    expect(result).toEqual([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('calculates custom interval count based on end date', async () => {
    const now = Date.now();
    const endDate = now + (20 * 24 * 60 * 60 * 1000); // 20 days from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Every 3 Days Until End Date',
      recurrence: 'custom',
      interval: 3,
      intervalUnit: 'days',
      hour: 9,
      minute: 0,
      endDate,
    });

    // 20 days / 3 days = ~6-7 notifications
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(7);

    // Verify all notifications are before end date
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(call => {
      const triggerDate = call[0].trigger.date;
      expect(triggerDate.getTime()).toBeLessThanOrEqual(endDate);
    });
  });

  it('does not schedule "once" notification if end date is before scheduled time', async () => {
    const endDate = Date.now() + (1000); // 1 second from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Once with Immediate End Date',
      recurrence: 'once',
      hour: 9,
      minute: 0,
      endDate,
    });

    // The "once" notification will be scheduled for next 9am, which is likely after endDate
    // So it should not be scheduled
    expect(result).toEqual([]);
  });

  it('handles end date at exact notification time correctly', async () => {
    const now = Date.now();
    const exactEndDate = now + (3 * 24 * 60 * 60 * 1000); // Exactly 3 days from now

    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Daily Task with Exact End Date',
      recurrence: 'daily',
      hour: 9,
      minute: 0,
      endDate: exactEndDate,
    });

    // Verify notifications are scheduled up to (but not exceeding) end date
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(call => {
      const triggerDate = call[0].trigger.date;
      expect(triggerDate.getTime()).toBeLessThanOrEqual(exactEndDate);
    });
  });

  it('uses default hour and minute for custom recurrence when not provided', async () => {
    await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Custom Task',
      recurrence: 'custom',
      interval: 5,
      intervalUnit: 'days',
    });

    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;

    expect(triggerDate.getHours()).toBe(9);
    expect(triggerDate.getMinutes()).toBe(0);
  });

  it('schedules custom interval with weeks correctly', async () => {
    const result = await scheduleTaskNotifications({
      id: 'task-1',
      title: 'Every 2 Weeks Task',
      recurrence: 'custom',
      interval: 2,
      intervalUnit: 'weeks',
      hour: 14,
      minute: 30,
    });

    expect(result).toHaveLength(12); // Default for weeks

    // Verify first notification has correct time
    const firstCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    const triggerDate = firstCall.trigger.date;
    expect(triggerDate.getHours()).toBe(14);
    expect(triggerDate.getMinutes()).toBe(30);

    // Verify 2-week interval
    const secondCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[1][0];
    const secondDate = secondCall.trigger.date;
    const diffMs = secondDate.getTime() - triggerDate.getTime();
    const expectedDiffMs = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks

    expect(diffMs).toBe(expectedDiffMs);
  });
});

describe('cancelManyNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
  });

  it('cancels all provided notification IDs', async () => {
    const ids = ['id-1', 'id-2', 'id-3'];
    await cancelManyNotifications(ids);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-1');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-2');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-3');
  });

  it('handles empty array gracefully', async () => {
    await cancelManyNotifications([]);

    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('cancels notifications in parallel', async () => {
    const ids = ['id-1', 'id-2', 'id-3'];
    const startTime = Date.now();

    await cancelManyNotifications(ids);

    const endTime = Date.now();
    const elapsed = endTime - startTime;

    // All calls should happen in parallel, not sequentially
    // This is a rough check - should be very fast since they're mocked
    expect(elapsed).toBeLessThan(100);
  });
});
