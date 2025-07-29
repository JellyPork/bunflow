export const RECURRENCE_OPTIONS = [
  { label: "Never", value: null },
  { label: "Every Day", value: { frequency: "daily", interval: 1 } },
  { label: "Every Week", value: { frequency: "weekly", interval: 1 } },
  { label: "Every 2 Weeks", value: { frequency: "weekly", interval: 2 } },
  { label: "Every Month", value: { frequency: "monthly", interval: 1 } },
  { label: "Every Year", value: { frequency: "yearly", interval: 1 } },
] as const

export const WEEKDAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
] as const

export const REMINDER_PRESETS = [
  { label: "None", value: null },
  { label: "At time of task", value: { type: "before_start", value: 0, unit: "minutes" } },
  { label: "5 minutes before", value: { type: "before_due", value: 5, unit: "minutes" } },
  { label: "15 minutes before", value: { type: "before_due", value: 15, unit: "minutes" } },
  { label: "30 minutes before", value: { type: "before_due", value: 30, unit: "minutes" } },
  { label: "1 hour before", value: { type: "before_due", value: 1, unit: "hours" } },
  { label: "2 hours before", value: { type: "before_due", value: 2, unit: "hours" } },
  { label: "1 day before", value: { type: "before_due", value: 1, unit: "days" } },
  { label: "2 days before", value: { type: "before_due", value: 2, unit: "days" } },
  { label: "1 week before", value: { type: "before_due", value: 7, unit: "days" } },
] as const

export const REMINDER_UNITS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
] as const
