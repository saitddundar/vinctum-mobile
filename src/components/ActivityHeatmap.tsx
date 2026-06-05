import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../lib/theme";
import type { ActivityDay } from "../features/transfer/hooks/useTransferMetrics";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_COUNT = 16;
const DAY_COUNT = WEEK_COUNT * 7;
const WEEKDAYS = ["M", "", "W", "", "F", "", "S"];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function levelFor(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 1) return 1;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

export default function ActivityHeatmap({
  days,
}: {
  days: ActivityDay[];
}) {
  const counts = new Map(days.map((d) => [d.date, d.transfer_count]));
  const today = new Date();
  const start = new Date(today.getTime() - (DAY_COUNT - 1) * DAY_MS);
  const startOffset = (start.getDay() + 6) % 7;
  const alignedStart = new Date(start.getTime() - startOffset * DAY_MS);

  const cells = Array.from({ length: WEEK_COUNT * 7 }, (_, index) => {
    const date = new Date(alignedStart.getTime() + index * DAY_MS);
    const key = isoDate(date);
    const inRange = date >= start && date <= today;
    return { date, key, count: inRange ? counts.get(key) ?? 0 : -1 };
  });

  const max = Math.max(1, ...days.map((d) => d.transfer_count));
  const weeks = Array.from({ length: WEEK_COUNT }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7)
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Last 16 weeks</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.weekdayCol}>
          {WEEKDAYS.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekCol}>
                {week.map((day) => {
                  const level = day.count < 0 ? -1 : levelFor(day.count, max);
                  return (
                    <View
                      key={day.key}
                      style={[
                        styles.cell,
                        level === -1 ? styles.cellEmpty : heatStyles[level],
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.monthRow}>
            {weeks.map((week, index) => {
              const first = week[0].date;
              const label =
                index === 0 || first.getDate() <= 7 ? monthLabel(first) : "";
              return (
                <Text key={index} style={styles.month}>
                  {label}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const heatStyles = [
  { backgroundColor: colors.inputBg },
  { backgroundColor: "rgba(110, 231, 183, 0.22)" },
  { backgroundColor: "rgba(110, 231, 183, 0.42)" },
  { backgroundColor: "rgba(110, 231, 183, 0.68)" },
  { backgroundColor: colors.accent },
];

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  body: {
    flexDirection: "row",
  },
  weekdayCol: {
    width: 14,
    marginRight: 6,
    gap: 4,
  },
  weekday: {
    height: 10,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
  },
  gridWrap: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekCol: {
    gap: 4,
  },
  cell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  cellEmpty: {
    backgroundColor: "transparent",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  month: {
    width: 10,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 10,
    textAlign: "left",
  },
});
