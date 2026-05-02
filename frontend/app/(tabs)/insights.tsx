import ProgressRing from "@/src/components/ProgressRing";
import { useTaskStore } from "@/src/store/useTaskStore";
import { Fonts } from "@/src/theme/colors";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { CalendarCheck2, ListTodo } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Activity Heatmap ───────────────────────────────────────────────
function ActivityHeatmap() {
  // 4 rows (weeks) × 7 cols (days)
  const data = Array.from({ length: 4 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = Math.random();
      return v > 0.6 ? "high" : v > 0.3 ? "mid" : v > 0.1 ? "low" : "none";
    })
  );
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const colorMap: Record<string, string> = {
    high: "#2563EB",
    mid: "#93C5FD",
    low: "#DBEAFE",
    none: "#F1F5F9",
  };
  return (
    <View>
      <View style={heatStyles.header}>
        <Text style={heatStyles.sectionLabel}>ACTIVITY HEATMAP</Text>
        <Text style={heatStyles.rangeLabel}>Last 4 weeks</Text>
      </View>
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
      <View style={heatStyles.legendRow}>
        <Text style={heatStyles.legendText}>LESS</Text>
        {["#DBEAFE", "#93C5FD", "#2563EB"].map((color, i) => (
          <View key={i} style={[heatStyles.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={heatStyles.legendText}>MORE</Text>
      </View>
    </View>
  );
}
const heatStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  rangeLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.medium,
  },
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  dayLabel: { fontSize: 9, color: "#94A3B8", fontFamily: Fonts.medium, width: 32, textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cell: { width: 32, height: 28, borderRadius: 6 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },
  legendCell: { width: 18, height: 18, borderRadius: 4 },
  legendText: { fontSize: 10, color: "#9CA3AF", fontFamily: Fonts.medium, marginHorizontal: 4 },
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
      <View style={wlStyles.topRow}>
        <Text style={wlStyles.label}>{label}</Text>
        <Text style={wlStyles.pct}>{pct}%</Text>
      </View>
      <View style={wlStyles.barBg}>
        <View style={[wlStyles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const wlStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 13, color: "#374151", fontFamily: Fonts.medium },
  barBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  pct: { fontSize: 12, color: "#6B7280", fontFamily: Fonts.semiBold },
});

// ─── Circular Mini Stat ──────────────────────────────────────────────
function CircleStat({
  pct,
  label,
  sub,
  color,
}: {
  pct: number;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <View style={circleStyles.container}>
      <View style={circleStyles.ringWrapper}>
        <ProgressRing
          progress={pct / 100}
          size={72}
          strokeWidth={5}
          gradientColors={[color, color]}
          trackColor="#F1F5F9"
        >
          <Text style={circleStyles.pct}>{pct}%</Text>
        </ProgressRing>
      </View>
      <Text style={circleStyles.label}>{label}</Text>
      <Text style={circleStyles.sub}>{sub}</Text>
    </View>
  );
}
const circleStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingVertical: 16 },
  ringWrapper: { marginBottom: 10 },
  pct: { fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: Fonts.bold },
  label: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: Fonts.bold, marginBottom: 2 },
  sub: { fontSize: 12, color: "#9CA3AF", fontFamily: Fonts.regular },
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
    { day: "Mon", rate: 55 }, { day: "Tue", rate: 62 }, { day: "Wed", rate: 48 },
    { day: "Thu", rate: 70 }, { day: "Fri", rate: 53 }, { day: "Sat", rate: 65 }, { day: "Sun", rate: 58 },
  ];
  const maxRate = Math.max(...weeklyBars.map((b: any) => b.rate), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header with greeting, weather, tabs ── */}
        <View style={styles.topHeader}>
          <View style={styles.greetingRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greetingLine}>Good morning, Alexa 👋</Text>
              <Text style={styles.welcomeBack}>Welcome Back</Text>
            </View>
            {/* Weather pill */}
            <View style={styles.weatherPill}>
              <Text style={styles.weatherTemp}>25°</Text>
              <View style={styles.weatherDivider} />
              <View>
                <Text style={styles.weatherCondition}>Cloudy</Text>
                <Text style={styles.weatherCity}>Haridwar</Text>
              </View>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Planner</Text>
            </View>
            <Text style={styles.tabInactive}>Calorie</Text>
          </View>
        </View>

        {/* ── Completion Rate Hero Card (dark) ── */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["#0F172A", "#1E3A5F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.glow, { top: -30, right: -20, backgroundColor: "#3B82F6" }]} />
          <View style={[styles.glow, { bottom: -20, left: 20, backgroundColor: "#1D4ED8", width: 80, height: 80 }]} />

          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>COMPLETION RATE</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{completionPct}%</Text>
              <Text style={styles.heroChange}> ↑ 8% vs last week</Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>{stats.dailyStreak || 3} Day Streak</Text>
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
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabel}>Best Day</Text>
              <View style={styles.statIconWrapper}>
                <CalendarCheck2 size={20} color={"#3B82F6"} />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.bestDay || "Sun"}</Text>
            <Text style={styles.statSubLabel}>Sunday is your peak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabel}>Tasks Done</Text>
              <View style={[styles.statIconWrapper, { backgroundColor: "#EEF2FF" }]}>
                <ListTodo size={20} color={"#60A5FA"} />
              </View>
            </View>
            <Text style={styles.statValue}>
              {stats.completedTasks || 12}
              <Text style={styles.statValueSub}>/{stats.totalTasks || 40}</Text>
            </Text>
            <Text style={styles.statSubLabel}>This week</Text>
          </View>
        </View>

        {/* ── Task Progress Chart ── */}
        <Text style={styles.sectionTitle}>TASK PROGRESS</Text>
        <View style={styles.card}>
          {/* Chart header */}
          <View style={styles.chartHeader}>
            <Text style={styles.chartHeaderLabel}>WEEKLY OVERVIEW</Text>
            <View style={styles.thisWeekPill}>
              <Text style={styles.thisWeekText}>This Week</Text>
            </View>
          </View>
          <View style={styles.barChartRow}>
            {weeklyBars.map((item: any, index: number) => {
              const barColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#94A3B8", "#10B981", "#EC4899"];
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

          {/* Two circle stats below bar chart */}
          <View style={styles.circleStatsRow}>
            <View style={styles.circleStatCard}>
              <CircleStat pct={14} label="4.2h" sub="Focus Time" color="#3B82F6" />
            </View>
            <View style={styles.circleStatDivider} />
            <View style={styles.circleStatCard}>
              <CircleStat pct={14} label="6/12" sub="Goals Hit" color="#10B981" />
            </View>
          </View>
        </View>

        {/* ── Productivity Patterns ── */}
        <Text style={styles.sectionTitle}>PRODUCTIVITY PATTERNS</Text>

        {/* ── Activity Heatmap ── */}
        <View style={styles.card}>
          <ActivityHeatmap />
        </View>

        {/* ── Workload Breakdown ── */}
        <View style={styles.card}>
          <View style={styles.workloadHeader}>
            <Text style={styles.cardTitle}>WORKLOAD OVERVIEW</Text>
            <Text style={styles.workloadDateRange}>Apr 1 – Apr 7, 2026</Text>
          </View>
          <View style={styles.workloadStats}>
            <View style={styles.workloadStatItem}>
              <Text style={styles.workloadStatValue}>{stats.totalTasks || 40}</Text>
              <Text style={styles.workloadStatLabel}>Total Tasks</Text>
            </View>
            <View style={styles.workloadDivider} />
            <View style={styles.workloadStatItem}>
              <Text style={styles.workloadStatValue}>{stats.completedTasks || 12}</Text>
              <Text style={styles.workloadStatLabel}>Completed</Text>
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
          <View style={styles.badgeInner}>
            <View style={styles.badgeTopRow}>
              <Text style={styles.badgeEmoji}>🥇</Text>
              <View style={styles.badgeTitleBlock}>
                <Text style={styles.badgeTitle}>Consistency KING</Text>
                <Text style={styles.badgeSub}>Your productivity badge</Text>
              </View>
            </View>
            <Text style={styles.badgeDesc}>
              You have a{" "}
              <Text style={{ color: "#F59E0B" }}>{stats.dailyStreak || 3} day streak</Text>
              {" "}running! Your most productive day is{" "}
              <Text style={{ color: "#F59E0B" }}>{stats.bestDay || "Sunday"}</Text>. Keep pushing — you're building something great.
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
    paddingTop: 8,
  },

  // ── Top Header ──
  topHeader: {
    marginBottom: 20,
    marginTop: 4,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    fontFamily: Fonts.bold,
  },
  greetingText: { flex: 1 },
  greetingLine: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  welcomeBack: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  weatherPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  weatherDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  weatherCondition: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    fontFamily: Fonts.semiBold,
  },
  weatherCity: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  tabActiveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
  },
  tabInactive: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: Fonts.medium,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statEmoji: { fontSize: 17 },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: Fonts.medium,
    flex: 1,
    paddingRight: 6,
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  statValueSub: {
    fontSize: 18,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  statSubLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },

  // ── Card ──
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Chart Header ──
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartHeaderLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },
  thisWeekPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  thisWeekText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: Fonts.semiBold,
  },

  // ── Bar Chart ──
  barChartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 110,
    marginBottom: 4,
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

  // ── Circle Stats Row ──
  circleStatsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 12,
  },
  circleStatCard: { flex: 1 },
  circleStatDivider: { width: 1, backgroundColor: "#F1F5F9" },

  // ── Workload header ──
  workloadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },
  workloadDateRange: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.medium,
  },

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
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeInner: { flex: 1 },
  badgeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeEmoji: { fontSize: 22, marginRight: 10 },
  badgeTitleBlock: { flex: 1 },
  badgeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
  },
  badgeSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  badgeDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: Fonts.regular,
    lineHeight: 20,
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