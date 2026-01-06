import * as Crypto from 'expo-crypto';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../useTasks';
import { scheduleTaskNotifications, cancelManyNotifications } from '@/lib/notifications';

// Mock the notification functions
jest.mock('@/lib/notifications', () => ({
  scheduleTaskNotifications: jest.fn(),
  cancelManyNotifications: jest.fn(),
}));

describe('useTasks store', () => {
  let counter = 0;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the UUID counter for each test
    counter = 0;
    (Crypto.randomUUID as jest.Mock).mockImplementation(() => `mock-uuid-${counter++}`);

    (scheduleTaskNotifications as jest.Mock).mockResolvedValue(['notif-1', 'notif-2']);
    (cancelManyNotifications as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Reset the store state to initial values
    const { result } = renderHook(() => useTasks());
    act(() => {
      useTasks.setState({
        tasks: [],
        tags: [],
        priorities: [
          { key: 'Low', label: 'Low', value: 1 },
          { key: 'Medium', label: 'Medium', value: 2 },
          { key: 'High', label: 'High', value: 3 },
        ],
      });
    });
  });

  describe('Initial state', () => {
    it('starts with empty tasks and tags', () => {
      const { result } = renderHook(() => useTasks());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.tags).toEqual([]);
    });

    it('has default priorities (Low, Medium, High)', () => {
      const { result } = renderHook(() => useTasks());

      expect(result.current.priorities).toEqual([
        { key: 'Low', label: 'Low', value: 1 },
        { key: 'Medium', label: 'Medium', value: 2 },
        { key: 'High', label: 'High', value: 3 },
      ]);
    });
  });

  describe('addOrGetTagByName', () => {
    it('creates a new tag with auto-assigned color', () => {
      const { result } = renderHook(() => useTasks());

      let tagId: string;
      act(() => {
        tagId = result.current.addOrGetTagByName('Work');
      });

      expect(result.current.tags).toHaveLength(1);
      expect(result.current.tags[0]).toEqual({
        id: expect.any(String),
        name: 'Work',
        color: '#7aa2ff', // First color in palette
        usageCount: 0,
      });
      expect(tagId!).toBe(result.current.tags[0].id);
    });

    it('returns existing tag ID for case-insensitive match', () => {
      const { result } = renderHook(() => useTasks());

      let firstId: string;
      let secondId: string;

      act(() => {
        firstId = result.current.addOrGetTagByName('Work');
        secondId = result.current.addOrGetTagByName('work'); // lowercase
      });

      expect(result.current.tags).toHaveLength(1);
      expect(firstId!).toBe(secondId!);
    });

    it('returns empty string for empty name', () => {
      const { result } = renderHook(() => useTasks());

      let tagId: string;
      act(() => {
        tagId = result.current.addOrGetTagByName('   '); // whitespace only
      });

      expect(tagId!).toBe('');
      expect(result.current.tags).toHaveLength(0);
    });

    it('trims whitespace from tag names', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addOrGetTagByName('  Work  ');
      });

      expect(result.current.tags[0].name).toBe('Work');
    });

    it('cycles through color palette for multiple tags', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addOrGetTagByName('Tag1');
        result.current.addOrGetTagByName('Tag2');
        result.current.addOrGetTagByName('Tag3');
        result.current.addOrGetTagByName('Tag4');
        result.current.addOrGetTagByName('Tag5');
        result.current.addOrGetTagByName('Tag6');
        result.current.addOrGetTagByName('Tag7'); // Should cycle back
      });

      // Tags are prepended, so newest is at index 0
      expect(result.current.tags[6].color).toBe('#7aa2ff'); // Tag1 (oldest, at end)
      expect(result.current.tags[5].color).toBe('#8b5cf6'); // Tag2
      expect(result.current.tags[4].color).toBe('#34d399'); // Tag3
      expect(result.current.tags[0].color).toBe('#7aa2ff'); // Tag7 - cycled back (newest, at start)
    });

    it('prepends new tags to the beginning of the list', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addOrGetTagByName('First');
        result.current.addOrGetTagByName('Second');
      });

      expect(result.current.tags[0].name).toBe('Second');
      expect(result.current.tags[1].name).toBe('First');
    });
  });

  describe('addPriorityTier', () => {
    it('adds a new priority tier', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addPriorityTier('Critical', 4);
      });

      expect(result.current.priorities).toContainEqual({
        key: 'Critical',
        label: 'Critical',
        value: 4,
      });
    });

    it('replaces existing tier with same label (case-insensitive)', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addPriorityTier('low', 0.5); // lowercase "low"
      });

      const lowPriorities = result.current.priorities.filter(
        (p) => p.label.toLowerCase() === 'low'
      );
      expect(lowPriorities).toHaveLength(1);
      expect(lowPriorities[0].value).toBe(0.5);
    });

    it('sorts priorities by value in ascending order', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addPriorityTier('Critical', 4);
        result.current.addPriorityTier('Minimal', 0.5);
      });

      const values = result.current.priorities.map((p) => p.value);
      expect(values).toEqual([0.5, 1, 2, 3, 4]);
    });

    it('allows custom numeric values between defaults', () => {
      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.addPriorityTier('Medium-High', 2.5);
      });

      expect(result.current.priorities).toContainEqual({
        key: 'Medium-High',
        label: 'Medium-High',
        value: 2.5,
      });
    });
  });

  describe('addTask', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('creates a task with generated ID and timestamps', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Test Task',
          priority: 2,
          tagIds: [],
          recurrence: 'none',
        });
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toMatchObject({
        id: expect.any(String),
        title: 'Test Task',
        priority: 2,
        done: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    it('sets done to false for new tasks', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'New Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      expect(result.current.tasks[0].done).toBe(false);
    });

    it('schedules notifications and stores notification IDs', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Daily Task',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 30,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 Daily Task',
        body: 'Bunflow reminder',
        recurrence: 'daily',
        hour: 9,
        minute: 30,
        weekdays: undefined,
      });

      expect(result.current.tasks[0].notificationIds).toEqual(['notif-1', 'notif-2']);
    });

    it('adds task to the beginning of the list', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'First',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      await act(async () => {
        await result.current.addTask({
          title: 'Second',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      expect(result.current.tasks[0].title).toBe('Second');
      expect(result.current.tasks[1].title).toBe('First');
    });

    it('includes optional fields (notes, weekdays)', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Weekly Task',
          notes: 'Some notes here',
          priority: 2,
          tagIds: [],
          recurrence: 'weekly',
          weekdays: [1, 3, 5],
          hour: 14,
          minute: 0,
        });
      });

      expect(result.current.tasks[0]).toMatchObject({
        notes: 'Some notes here',
        weekdays: [1, 3, 5],
      });
    });

    it('creates task with "once" recurrence and schedules one notification', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'One-time Reminder',
          priority: 2,
          tagIds: [],
          recurrence: 'once',
          hour: 15,
          minute: 30,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 One-time Reminder',
        body: 'Bunflow reminder',
        recurrence: 'once',
        hour: 15,
        minute: 30,
        weekdays: undefined,
      });

      expect(result.current.tasks[0]).toMatchObject({
        title: 'One-time Reminder',
        recurrence: 'once',
        hour: 15,
        minute: 30,
      });
    });

    it('stores notification IDs for "once" recurrence', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'One-time Task',
          priority: 1,
          tagIds: [],
          recurrence: 'once',
          hour: 10,
          minute: 0,
        });
      });

      // Mock returns ['notif-1', 'notif-2'] but for 'once' we only expect one
      // The actual implementation will return just one, but our mock returns array
      expect(result.current.tasks[0].notificationIds).toBeDefined();
      expect(Array.isArray(result.current.tasks[0].notificationIds)).toBe(true);
    });

    it('creates "once" task without weekdays', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Once Task',
          priority: 1,
          tagIds: [],
          recurrence: 'once',
          hour: 12,
          minute: 0,
        });
      });

      expect(result.current.tasks[0].weekdays).toBeUndefined();
    });

    // Custom interval tests
    it('creates task with custom interval (days) and passes to notifications', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Every 2 Days Task',
          priority: 2,
          tagIds: [],
          recurrence: 'custom',
          interval: 2,
          intervalUnit: 'days',
          hour: 10,
          minute: 0,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 Every 2 Days Task',
        body: 'Bunflow reminder',
        recurrence: 'custom',
        hour: 10,
        minute: 0,
        weekdays: undefined,
        interval: 2,
        intervalUnit: 'days',
        endDate: undefined,
      });

      expect(result.current.tasks[0]).toMatchObject({
        title: 'Every 2 Days Task',
        recurrence: 'custom',
        interval: 2,
        intervalUnit: 'days',
      });
    });

    it('creates task with custom interval (weeks) and passes to notifications', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Every 3 Weeks Task',
          priority: 2,
          tagIds: [],
          recurrence: 'custom',
          interval: 3,
          intervalUnit: 'weeks',
          hour: 14,
          minute: 30,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 Every 3 Weeks Task',
        body: 'Bunflow reminder',
        recurrence: 'custom',
        hour: 14,
        minute: 30,
        weekdays: undefined,
        interval: 3,
        intervalUnit: 'weeks',
        endDate: undefined,
      });

      expect(result.current.tasks[0]).toMatchObject({
        interval: 3,
        intervalUnit: 'weeks',
      });
    });

    // End date tests
    it('creates task with end date and passes to notifications', async () => {
      const { result } = renderHook(() => useTasks());
      const endDate = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

      await act(async () => {
        await result.current.addTask({
          title: 'Task with End Date',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
          endDate,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 Task with End Date',
        body: 'Bunflow reminder',
        recurrence: 'daily',
        hour: 9,
        minute: 0,
        weekdays: undefined,
        interval: undefined,
        intervalUnit: undefined,
        endDate,
      });

      expect(result.current.tasks[0]).toMatchObject({
        endDate,
      });
    });

    it('creates task with custom interval and end date', async () => {
      const { result } = renderHook(() => useTasks());
      const endDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now

      await act(async () => {
        await result.current.addTask({
          title: 'Every 5 Days Until End Date',
          priority: 2,
          tagIds: [],
          recurrence: 'custom',
          interval: 5,
          intervalUnit: 'days',
          hour: 12,
          minute: 0,
          endDate,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: expect.any(String),
        title: '📌 Every 5 Days Until End Date',
        body: 'Bunflow reminder',
        recurrence: 'custom',
        hour: 12,
        minute: 0,
        weekdays: undefined,
        interval: 5,
        intervalUnit: 'days',
        endDate,
      });

      expect(result.current.tasks[0]).toMatchObject({
        recurrence: 'custom',
        interval: 5,
        intervalUnit: 'days',
        endDate,
      });
    });

    it('creates daily task with end date', async () => {
      const { result } = renderHook(() => useTasks());
      const endDate = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days from now

      await act(async () => {
        await result.current.addTask({
          title: 'Daily Task Until End Date',
          priority: 1,
          tagIds: [],
          recurrence: 'daily',
          hour: 8,
          minute: 0,
          endDate,
        });
      });

      expect(result.current.tasks[0]).toMatchObject({
        recurrence: 'daily',
        endDate,
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrence: 'daily',
          endDate,
        })
      );
    });

    it('creates weekly task with end date', async () => {
      const { result } = renderHook(() => useTasks());
      const endDate = Date.now() + (21 * 24 * 60 * 60 * 1000); // 21 days from now

      await act(async () => {
        await result.current.addTask({
          title: 'Weekly Task Until End Date',
          priority: 2,
          tagIds: [],
          recurrence: 'weekly',
          weekdays: [1, 3, 5],
          hour: 10,
          minute: 30,
          endDate,
        });
      });

      expect(result.current.tasks[0]).toMatchObject({
        recurrence: 'weekly',
        weekdays: [1, 3, 5],
        endDate,
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrence: 'weekly',
          weekdays: [1, 3, 5],
          endDate,
        })
      );
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('updates task and reschedules notifications', async () => {
      const { result } = renderHook(() => useTasks());

      // Create task first
      await act(async () => {
        await result.current.addTask({
          title: 'Original Task',
          priority: 1,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
        });
      });

      const taskId = result.current.tasks[0].id;
      jest.clearAllMocks();

      // Update task
      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Updated Task',
          priority: 3,
          tagIds: [],
          recurrence: 'weekly',
          weekdays: [1, 3],
          hour: 14,
          minute: 30,
        });
      });

      // Should cancel old notifications
      expect(cancelManyNotifications).toHaveBeenCalledWith(['notif-1', 'notif-2']);

      // Should schedule new notifications
      expect(scheduleTaskNotifications).toHaveBeenCalledWith({
        id: taskId,
        title: '📌 Updated Task',
        body: 'Bunflow reminder',
        recurrence: 'weekly',
        hour: 14,
        minute: 30,
        weekdays: [1, 3],
        interval: undefined,
        intervalUnit: undefined,
        endDate: undefined,
      });

      // Task should be updated
      expect(result.current.tasks[0]).toMatchObject({
        title: 'Updated Task',
        priority: 3,
        recurrence: 'weekly',
        weekdays: [1, 3],
      });
    });

    it('updates task with custom interval', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Daily Task',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
        });
      });

      const taskId = result.current.tasks[0].id;
      jest.clearAllMocks();

      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Every 3 Days Task',
          priority: 2,
          tagIds: [],
          recurrence: 'custom',
          interval: 3,
          intervalUnit: 'days',
          hour: 10,
          minute: 0,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrence: 'custom',
          interval: 3,
          intervalUnit: 'days',
        })
      );

      expect(result.current.tasks[0]).toMatchObject({
        recurrence: 'custom',
        interval: 3,
        intervalUnit: 'days',
      });
    });

    it('updates task with end date', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
        });
      });

      const taskId = result.current.tasks[0].id;
      const endDate = Date.now() + (10 * 24 * 60 * 60 * 1000);
      jest.clearAllMocks();

      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Task with End Date',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
          endDate,
        });
      });

      expect(scheduleTaskNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate,
        })
      );

      expect(result.current.tasks[0]).toMatchObject({
        endDate,
      });
    });

    it('updates task from daily to custom interval with end date', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Daily Task',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
        });
      });

      const taskId = result.current.tasks[0].id;
      const endDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
      jest.clearAllMocks();

      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Every 2 Weeks Until End Date',
          priority: 2,
          tagIds: [],
          recurrence: 'custom',
          interval: 2,
          intervalUnit: 'weeks',
          hour: 10,
          minute: 30,
          endDate,
        });
      });

      expect(cancelManyNotifications).toHaveBeenCalled();
      expect(scheduleTaskNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrence: 'custom',
          interval: 2,
          intervalUnit: 'weeks',
          endDate,
        })
      );

      expect(result.current.tasks[0]).toMatchObject({
        recurrence: 'custom',
        interval: 2,
        intervalUnit: 'weeks',
        endDate,
      });
    });

    it('updates updatedAt timestamp', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;
      const initialUpdatedAt = result.current.tasks[0].updatedAt;

      jest.advanceTimersByTime(5000);

      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Updated Task',
          priority: 2,
          tagIds: [],
          recurrence: 'none',
        });
      });

      expect(result.current.tasks[0].updatedAt).toBeGreaterThan(initialUpdatedAt);
    });

    it('does nothing if task does not exist', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.updateTask('non-existent-id', {
          title: 'Test',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      expect(cancelManyNotifications).not.toHaveBeenCalled();
      expect(scheduleTaskNotifications).not.toHaveBeenCalled();
    });

    it('handles empty notification IDs array', async () => {
      const { result } = renderHook(() => useTasks());

      (scheduleTaskNotifications as jest.Mock).mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;
      jest.clearAllMocks();

      await act(async () => {
        await result.current.updateTask(taskId, {
          title: 'Updated',
          priority: 2,
          tagIds: [],
          recurrence: 'daily',
          hour: 9,
          minute: 0,
        });
      });

      // Should not call cancelManyNotifications with empty array
      expect(cancelManyNotifications).not.toHaveBeenCalled();
    });
  });

  describe('toggleTask', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('toggles task done status from false to true', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.toggleTask(taskId);
      });

      expect(result.current.tasks[0].done).toBe(true);
    });

    it('toggles task done status from true to false', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.toggleTask(taskId);
        result.current.toggleTask(taskId);
      });

      expect(result.current.tasks[0].done).toBe(false);
    });

    it('updates the updatedAt timestamp', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const initialUpdatedAt = result.current.tasks[0].updatedAt;
      const taskId = result.current.tasks[0].id;

      jest.advanceTimersByTime(5000);

      act(() => {
        result.current.toggleTask(taskId);
      });

      expect(result.current.tasks[0].updatedAt).toBeGreaterThan(initialUpdatedAt);
    });

    it('does not affect other tasks', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task 1',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
        await result.current.addTask({
          title: 'Task 2',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const task1Id = result.current.tasks[1].id;

      act(() => {
        result.current.toggleTask(task1Id);
      });

      expect(result.current.tasks[1].done).toBe(true);
      expect(result.current.tasks[0].done).toBe(false);
    });
  });

  describe('removeTask', () => {
    it('removes task from the list', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task to remove',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      await act(async () => {
        await result.current.removeTask(taskId);
      });

      expect(result.current.tasks).toHaveLength(0);
    });

    it('cancels notifications if they exist', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task with notifications',
          priority: 1,
          tagIds: [],
          recurrence: 'daily',
        });
      });

      const taskId = result.current.tasks[0].id;

      await act(async () => {
        await result.current.removeTask(taskId);
      });

      expect(cancelManyNotifications).toHaveBeenCalledWith(['notif-1', 'notif-2']);
    });

    it('does not call cancelNotifications if task has no notifications', async () => {
      const { result } = renderHook(() => useTasks());

      // Mock scheduleTaskNotifications to return empty array for recurrence='none'
      (scheduleTaskNotifications as jest.Mock).mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.addTask({
          title: 'Task without notifications',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      await act(async () => {
        await result.current.removeTask(taskId);
      });

      expect(cancelManyNotifications).not.toHaveBeenCalled();
    });

    it('does not affect other tasks', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task 1',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
        await result.current.addTask({
          title: 'Task 2',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const task2Id = result.current.tasks[0].id;

      await act(async () => {
        await result.current.removeTask(task2Id);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].title).toBe('Task 1');
    });
  });

  describe('setTaskTags', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('creates tags on-demand and assigns them to task', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['Work', 'Urgent']);
      });

      expect(result.current.tags).toHaveLength(2);
      expect(result.current.tasks[0].tagIds).toHaveLength(2);
    });

    it('trims whitespace from tag names', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['  Work  ', ' Personal ']);
      });

      // Tags are prepended, so newest is first
      const tagNames = result.current.tags.map((t) => t.name);
      expect(tagNames).toContain('Work');
      expect(tagNames).toContain('Personal');
      expect(tagNames).toHaveLength(2);
    });

    it('filters out empty tag names', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['Work', '', '   ', 'Personal']);
      });

      expect(result.current.tags).toHaveLength(2);
      expect(result.current.tasks[0].tagIds).toHaveLength(2);
    });

    it('de-duplicates tag IDs', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['Work', 'work', 'WORK']);
      });

      expect(result.current.tags).toHaveLength(1);
      expect(result.current.tasks[0].tagIds).toHaveLength(1);
    });

    it('updates the updatedAt timestamp', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const initialUpdatedAt = result.current.tasks[0].updatedAt;
      const taskId = result.current.tasks[0].id;

      jest.advanceTimersByTime(5000);

      act(() => {
        result.current.setTaskTags(taskId, ['Work']);
      });

      expect(result.current.tasks[0].updatedAt).toBeGreaterThan(initialUpdatedAt);
    });

    it('reuses existing tags instead of creating duplicates', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['Work']);
        result.current.setTaskTags(taskId, ['Work', 'Personal']);
      });

      expect(result.current.tags).toHaveLength(2);
      expect(result.current.tags.filter((t) => t.name === 'Work')).toHaveLength(1);
    });

    it('allows removing all tags by passing empty array', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.addTask({
          title: 'Task',
          priority: 1,
          tagIds: [],
          recurrence: 'none',
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.setTaskTags(taskId, ['Work', 'Personal']);
        result.current.setTaskTags(taskId, []);
      });

      expect(result.current.tasks[0].tagIds).toEqual([]);
    });
  });
});
