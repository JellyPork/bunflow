import { startActivityAsync } from "expo-intent-launcher"; // npx expo install expo-intent-launcher
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let handlerSet = false;
const DBG = true;
const tag = "🔔 [notifs]";

const log = (...a: any[]) => DBG && console.log(tag, ...a);

export async function openExactAlarmsSettingsAndroid() {
  if (Platform.OS !== "android") return;
  try {
    await startActivityAsync("android.settings.REQUEST_SCHEDULE_EXACT_ALARM");
  } catch (e) {
    log("openExactAlarmsSettingsAndroid error:", e);
  }
}

export async function ensureNotificationSetup() {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    } catch (e) {
      log("setNotificationChannelAsync error:", e);
    }
  }

  const p = await Notifications.getPermissionsAsync();
  log("permissions:", p);
  if (p.status !== "granted") {
    const r = await Notifications.requestPermissionsAsync();
    log("permissions after request:", r);
    if (r.status !== "granted") return false;
  }

  if (!handlerSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
    log("handler set");
  }
  return true;
}

/* ---------- helpers ---------- */

export const toIsoLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function nextDateAtTime(hour: number, minute: number, from = new Date()) {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= from.getTime() + 1000) d.setDate(d.getDate() + 1);
  return d;
}

export function nextWeekdayDate(weekdayJS: number, hour: number, minute: number, from = new Date()) {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setHours(hour, minute, 0, 0);
  let diff = (weekdayJS - d.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() <= from.getTime() + 1000) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

async function scheduleAt(date: Date, title: string, body?: string) {
  try {
    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date
    };
    const next = await Notifications.getNextTriggerDateAsync(trigger);
    log("SCHED →", toIsoLocal(date), "| nextTriggerAPI:", next ? new Date(next).toString() : next);

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false, data: { at: date.getTime() } }, // embed ts for Android debug
      trigger,
    });

    log("OK id:", id, "| when:", toIsoLocal(date), "| in(ms):", date.getTime() - Date.now());
    return id;
  } catch (e) {
    log("scheduleAt error", toIsoLocal(date), e);
    throw e;
  }
}

/* ---------- public API ---------- */

export type Recurrence = "none" | "once" | "daily" | "weekly" | "custom";

export async function scheduleTaskNotifications(opts: {
  id: string;
  title: string;
  body?: string;
  recurrence: Recurrence;
  hour?: number;
  minute?: number;
  weekdays?: number[]; // 0..6 Sun..Sat
  interval?: number;   // for custom recurrence (e.g., 2 for "every 2 days")
  intervalUnit?: 'days' | 'weeks'; // unit for custom interval
  endDate?: number;    // timestamp to stop scheduling
}): Promise<string[]> {
  const out: string[] = [];
  const { title, body, recurrence, hour = 9, minute = 0, weekdays, interval, intervalUnit, endDate } = opts;

  log("INPUT:", { title, body, recurrence, hour, minute, weekdays, interval, intervalUnit, endDate, now: new Date().toString() });

  if (recurrence === "none") return out;

  const DAILY_COUNT = 30;
  const WEEKLY_WEEKS = 12;
  const MAX_CUSTOM_SCHEDULES = 100; // Safety limit for custom intervals

  // Helper to check if date is past end date
  const isPastEndDate = (date: Date): boolean => {
    return endDate ? date.getTime() > endDate : false;
  };

  if (recurrence === "once") {
    const when = nextDateAtTime(hour, minute);
    if (!isPastEndDate(when)) {
      log("once at:", toIsoLocal(when));
      out.push(await scheduleAt(when, `📌 ${title}`, body));
    }
  } else if (recurrence === "daily") {
    const first = nextDateAtTime(hour, minute);
    log("daily first:", toIsoLocal(first));

    // Calculate how many to schedule based on end date
    const maxSchedules = endDate
      ? Math.ceil((endDate - first.getTime()) / (24 * 60 * 60 * 1000))
      : DAILY_COUNT;
    const scheduleCount = Math.min(Math.max(maxSchedules, 0), DAILY_COUNT);

    for (let i = 0; i < scheduleCount; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      if (!isPastEndDate(d)) {
        out.push(await scheduleAt(d, `📌 ${title}`, body));
      } else {
        break;
      }
    }
  } else if (recurrence === "weekly" && weekdays?.length) {
    const start = new Date();
    log("weekly start:", toIsoLocal(start), "weekdays:", weekdays);

    // Calculate how many weeks to schedule based on end date
    const maxWeeks = endDate
      ? Math.ceil((endDate - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
      : WEEKLY_WEEKS;
    const scheduleWeeks = Math.min(Math.max(maxWeeks, 0), WEEKLY_WEEKS);

    for (let w = 0; w < scheduleWeeks; w++) {
      const base = new Date(start);
      base.setDate(start.getDate() + w * 7);
      for (const wd of weekdays) {
        const d = nextWeekdayDate(wd, hour, minute, base);
        if (d.getTime() > Date.now() && !isPastEndDate(d)) {
          out.push(await scheduleAt(d, `📌 ${title}`, body));
        } else {
          if (isPastEndDate(d)) {
            log("skip past end date:", toIsoLocal(d));
          } else {
            log("skip past:", toIsoLocal(d));
          }
        }
      }
    }
  } else if (recurrence === "custom" && interval && intervalUnit) {
    // Custom interval scheduling (e.g., every 2 days, every 3 weeks)
    const first = nextDateAtTime(hour, minute);
    log("custom first:", toIsoLocal(first), "interval:", interval, intervalUnit);

    const intervalMs = intervalUnit === 'days'
      ? interval * 24 * 60 * 60 * 1000
      : interval * 7 * 24 * 60 * 60 * 1000;

    // Calculate how many occurrences to schedule
    const maxSchedules = endDate
      ? Math.ceil((endDate - first.getTime()) / intervalMs)
      : (intervalUnit === 'days' ? 30 : 12); // Default: 30 occurrences for days, 12 for weeks

    const scheduleCount = Math.min(Math.max(maxSchedules, 0), MAX_CUSTOM_SCHEDULES);

    for (let i = 0; i < scheduleCount; i++) {
      const d = new Date(first.getTime() + i * intervalMs);
      if (!isPastEndDate(d)) {
        out.push(await scheduleAt(d, `📌 ${title}`, body));
      } else {
        break;
      }
    }
  } else {
    log("recurrence type not handled or missing required fields");
  }

  await debugListScheduledVerbose();
  return out;
}

export async function cancelManyNotifications(ids: string[]) {
  log("cancelManyNotifications →", ids.length);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await debugListScheduledVerbose();
}

/* ---------- debug ---------- */

export async function debugListScheduledVerbose() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  log("OS scheduled count:", all.length);
  all.slice(0, 20).forEach((n, i) => {
    const t: any = (n as any).trigger;
    const at = (n as any)?.content?.data?.at;
    const atStr = at ? toIsoLocal(new Date(at)) : "n/a";
    log(`[${i}] id=${n.identifier} type=${t?.type} dateField=${String(t?.date)} content.data.at=${atStr}`);
  });
  return all;
}
