import * as Notifications from "expo-notifications"

export async function setupNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!")
    return
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

export async function scheduleTaskReminder(taskId: string, title: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: title,
      data: { taskId, type: "task" },
    },
    trigger: { date },
  })
}

export async function scheduleHabitReminder(habitId: string, name: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Habit Reminder",
      body: `Time for: ${name}`,
      data: { habitId, type: "habit" },
    },
    trigger: date,
  })
}

export async function cancelNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier)
}
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}