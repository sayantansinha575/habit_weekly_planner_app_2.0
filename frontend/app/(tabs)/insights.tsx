import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Colors, Fonts } from "@/src/theme/colors";
import ProgressRing from "@/src/components/ProgressRing";
import { useFocusEffect } from "@react-navigation/native";
import { useTaskStore } from "@/src/store/useTaskStore";

// ─── Activity Heatmap ───────────────────────────────────────────────
function ActivityHeatmap() {
  // 4 rows (weeks) × 7 cols (days)
  const data = Array.from({ length: 4 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = Math.random();
      return v > 0.6 ? "high" : v > 0.3 ? "mid" : v > 0.1 ? "low" : "none";
    })
  );
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const colorMap: Record<string, string> = {
    high: "#2563EB",
    mid: "#93C5FD",
    low: "#DBEAFE",
    none: "#F1F5F9",
  };
  return (
    <View>
      <View style={heatStyles.dayRow}>
        {days.map((d, i) => (
          <Text key={i} style={heatStyles.dayLabel}>{d}</Text>
        ))}
      </View>
      {data.map((week, wi) => (
        <View key={wi} style={heatStyles.weekRow}>
          {week.map((cell, di) => (
            <View
              key={di}
              style={[heatStyles.cell, { backgroundColor: colorMap[cell] }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
const heatStyles = StyleSheet.create({
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  dayLabel: { fontSize: 11, color: "#94A3B8", fontFamily: Fonts.medium, width: 28, textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cell: { width: 28, height: 28, borderRadius: 6 },
});

// ─── Workload Row ────────────────────────────────────────────────────
function WorkloadRow({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <View style={wlStyles.row}>
      <Text style={wlStyles.label}>{label}</Text>
      <View style={wlStyles.barBg}>
        <View style={[wlStyles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={wlStyles.pct}>{pct}%</Text>
    </View>
  );
}
const wlStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { fontSize: 13, color: "#374151", fontFamily: Fonts.medium, width: 100 },
  barBg: { flex: 1, height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", marginHorizontal: 10 },
  barFill: { height: "100%", borderRadius: 4 },
  pct: { fontSize: 12, color: "#6B7280", fontFamily: Fonts.semiBold, width: 34, textAlign: "right" },
});

// ─── Main Screen ─────────────────────────────────────────────────────
export default function InsightsScreen() {
  const user = useTaskStore((state) => state.user);
  const { stats, loading, loadStats } = useTaskStore();
  const isFetchingRef = React.useRef(false);

  const handleLoadStats = React.useCallback(async () => {
    if (isFetchingRef.current || !user?.id) return;
    isFetchingRef.current = true;
    try {
      await loadStats(user.id);
    } catch (e) {
      console.error("Insights handleLoadStats failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadStats, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      handleLoadStats();
    }, [handleLoadStats]),
  );

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ color: "#9CA3AF", marginTop: 12, fontFamily: Fonts.regular }}>
            Loading insights...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const completionPct = Math.round(stats.completionRate || 0);
  const weeklyBars = stats.weeklyProgress || [
    { day: "Mon", rate: 40 }, { day: "Tue", rate: 65 }, { day: "Wed", rate: 30 },
    { day: "Thu", rate: 80 }, { day: "Fri", rate: 55 }, { day: "Sat", rate: 90 }, { day: "Sun", rate: 70 },
  ];
  const maxRate = Math.max(...weeklyBars.map((b: any) => b.rate), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Personal Insights</Text>
          <Text style={styles.subtitle}>Track your progress & patterns</Text>
        </View>

        {/* ── Completion Rate Hero Card (dark) ── */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["#0F172A", "#1E3A5F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Glow accents */}
          <View style={[styles.glow, { top: -30, right: -20, backgroundColor: "#3B82F6" }]} />
          <View style={[styles.glow, { bottom: -20, left: 20, backgroundColor: "#1D4ED8", width: 80, height: 80 }]} />

          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>COMPLETION RATE</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{completionPct}%</Text>
              <Text style={styles.heroChange}> ↑ 8% vs last week</Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>{stats.dailyStreak || 0} Day Streak</Text>
            </View>
          </View>

          <ProgressRing
            progress={completionPct / 100}
            size={80}
            strokeWidth={6}
            gradientColors={["#60A5FA", "#2563EB"]}
            trackColor="rgba(255,255,255,0.15)"
          >
            <Text style={styles.ringText}>{completionPct}%</Text>
          </ProgressRing>
        </View>

        {/* ── Today's Stats Row ── */}
        <Text style={styles.sectionTitle}>TODAY'S STATS</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Text style={styles.statEmoji}>📅</Text>
            </View>
            <Text style={styles.statValue}>{stats.bestDay || "Sun"}</Text>
            <Text style={styles.statCardLabel}>Best Day</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: "#EEF2FF" }]}>
              <Text style={styles.statEmoji}>✅</Text>
            </View>
            <Text style={styles.statValue}>
              {stats.completedTasks || 0}
              <Text style={styles.statValueSub}>/{stats.totalTasks || 0}</Text>
            </Text>
            <Text style={styles.statCardLabel}>Tasks Done</Text>
          </View>
        </View>

        {/* ── Task Progress Chart ── */}
        <Text style={styles.sectionTitle}>TASK PROGRESS</Text>
        <View style={styles.card}>
          <View style={styles.barChartRow}>
            {weeklyBars.map((item: any, index: number) => {
              const barColors = ["#6366F1", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"];
              const h = Math.max((item.rate / maxRate) * 100, 4);
              return (
                <View key={index} style={styles.barCol}>
                  <Text style={styles.barPct}>{item.rate}%</Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${h}%` as any, backgroundColor: barColors[index % barColors.length] },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDay}>{item.day?.slice(0, 3)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Activity Heatmap ── */}
        <Text style={styles.sectionTitle}>ACTIVITY</Text>
        <View style={styles.card}>
          <ActivityHeatmap />
          <View style={styles.heatLegend}>
            {[
              { label: "Low", color: "#DBEAFE" },
              { label: "Mid", color: "#93C5FD" },
              { label: "High", color: "#2563EB" },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Workload Breakdown ── */}
        <Text style={styles.sectionTitle}>PRODUCTIVITY PATTERNS</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workload Overview</Text>
          <View style={styles.workloadStats}>
            <View style={styles.workloadStatItem}>
              <Text style={styles.workloadStatValue}>{stats.totalTasks || 0}</Text>
              <Text style={styles.workloadStatLabel}>TOTAL TASKS</Text>
            </View>
            <View style={styles.workloadDivider} />
            <View style={styles.workloadStatItem}>
              <Text style={styles.workloadStatValue}>{stats.completedTasks || 0}</Text>
              <Text style={styles.workloadStatLabel}>COMPLETED</Text>
            </View>
          </View>
          <WorkloadRow label="Work Tasks" pct={45} color="#F59E0B" />
          <WorkloadRow label="Personal Goals" pct={30} color="#EF4444" />
          <WorkloadRow label="Health & Wellness" pct={15} color="#10B981" />
          <WorkloadRow label="Learning" pct={10} color="#3B82F6" />
        </View>

        {/* ── Consistency Badge ── */}
        <View style={styles.badgeCard}>
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.glow, { top: -20, right: 0, backgroundColor: "#F59E0B", width: 80, height: 80 }]} />
          <View style={styles.badgeLeft}>
            <Text style={styles.badgeEmoji}>🥇</Text>
          </View>
          <View style={styles.badgeText}>
            <Text style={styles.badgeTitle}>Consistency KING</Text>
            <Text style={styles.badgeSub}>Your productivity badge</Text>
            <Text style={styles.badgeDesc}>
              You have a{" "}
              <Text style={{ color: "#F59E0B" }}>{stats.dailyStreak || 0} day streak</Text>
              {" "}running! Your most productive day is{" "}
              <Text style={{ color: "#F59E0B" }}>{stats.bestDay || "Sunday"}</Text>.
            </Text>
          </View>
        </View>

        {/* ── Quote ── */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={["#3B82F6", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.quoteIcon}>❝❝❝</Text>
          <Text style={styles.quoteText}>
            Discipline is doing what needs to be done, even if you don't want to do it.
          </Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F2ED",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
    marginTop: 2,
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.25,
  },
  heroLeft: { flex: 1 },
  heroLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroValueRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  heroValue: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    lineHeight: 40,
  },
  heroChange: {
    fontSize: 12,
    color: "#60A5FA",
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
    marginLeft: 4,
  },
  streakPill: {
    backgroundColor: "rgba(59,130,246,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.4)",
  },
  streakPillText: {
    fontSize: 12,
    color: "#93C5FD",
    fontFamily: Fonts.semiBold,
  },
  ringText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
  },

  // ── Section title ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
    fontFamily: Fonts.bold,
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statEmoji: { fontSize: 20 },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  statValueSub: {
    fontSize: 16,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  statCardLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: Fonts.medium,
  },

  // ── Card ──
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },

  // ── Bar Chart ──
  barChartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barCol: { flex: 1, alignItems: "center" },
  barPct: { fontSize: 9, color: "#9CA3AF", fontFamily: Fonts.bold, marginBottom: 4 },
  barBg: {
    width: "70%",
    maxWidth: 26,
    height: 80,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 6 },
  barDay: { fontSize: 9, color: "#6B7280", fontFamily: Fonts.medium, marginTop: 6 },

  // ── Heatmap legend ──
  heatLegend: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 11, color: "#9CA3AF", fontFamily: Fonts.medium },

  // ── Workload ──
  workloadStats: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  workloadStatItem: { flex: 1, alignItems: "center" },
  workloadDivider: { width: 1, backgroundColor: "rgba(0,0,0,0.06)" },
  workloadStatValue: { fontSize: 28, fontWeight: "800", color: "#1C1C1E", fontFamily: Fonts.bold },
  workloadStatLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
  },

  // ── Badge Card ──
  badgeCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245,158,11,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  badgeEmoji: { fontSize: 22 },
  badgeText: { flex: 1 },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  badgeSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  badgeDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },

  // ── Quote Card ──
  quoteCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 20,
    marginBottom: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  quoteIcon: {
    fontSize: 16,
    color: "rgba(255,255,255,0.4)",
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: Fonts.medium,
    lineHeight: 24,
    fontStyle: "italic",
  },
});
