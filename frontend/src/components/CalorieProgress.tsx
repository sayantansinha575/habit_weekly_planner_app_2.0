import { Colors, Fonts } from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Flame
} from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

interface CalorieProgressProps {
  data: {
    currentWeight: number;
    goalWeight: number;
    bmi: number;
    bmiCategory: string;
    chartData: Array<{ date: string; calories: number }>;
    streak: number;
  };
  onProfilePress?: () => void;
  loading?: boolean;
  onFilterChange?: (days: number) => void;
  activeDays?: number;
}

const Chart = React.memo(
  ({
    data,
    color,
    height = 200,
  }: {
    data: Array<{ date: string; calories: number }>;
    color: string;
    height?: number;
  }) => {
    if (!data || data.length === 0) return null;

    const labels = useMemo(() => {
      return data.map((d, i) => {
        const date = new Date(d.date);
        if (data.length <= 7)
          return date.toLocaleDateString("en-US", { weekday: "short" });
        if (
          i === 0 ||
          i === Math.floor(data.length / 2) ||
          i === data.length - 1
        ) {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
        return "";
      });
    }, [data]);

    const chartData = useMemo(
      () => ({
        labels,
        datasets: [
          {
            data: data.map((d) => d.calories),
            color: (opacity = 1) => color,
            strokeWidth: 3,
          },
          {
            data: [0],
            withDots: false,
          },
        ],
      }),
      [data, labels, color],
    );

    const chartConfig = useMemo(
      () => ({
        backgroundColor: "#ffffff",
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: data.length > 7 ? "0" : "5",
          strokeWidth: "2",
          stroke: "#FFFFFF",
          fill: color,
        },
        propsForLabels: {
          fontFamily: Fonts.medium,
          fontSize: 10,
        },
        fillShadowGradient: "#3B82F6",
        fillShadowGradientOpacity: 0.15,
        useShadowColorFromDataset: false,
        propsForBackgroundLines: {
          strokeDasharray: "",
          stroke: "#F3F4F6",
          strokeWidth: "1",
        },
      }),
      [data.length, color],
    );

    return (
      <LineChart
        data={chartData}
        width={width - 80}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 4,
          borderRadius: 12,
        }}
        withHorizontalLines={true}
        withVerticalLines={false}
        withDots={data.length <= 30}
        fromZero={true}
        yAxisLabel=""
        yAxisSuffix=" "
        formatYLabel={(val) => Math.round(Number(val)).toString()}
      />
    );
  },
);

export default function CalorieProgress({
  data,
  onProfilePress,
  loading,
  onFilterChange,
  activeDays = 7,
}: CalorieProgressProps) {
  const filters = [
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
    { label: "All Time", days: 365 },
  ];

  const weightProgress = Math.max(
    0,
    Math.min(
      1,
      data.currentWeight <= data.goalWeight
        ? 1
        : 1 - Math.min(1, (data.currentWeight - data.goalWeight) / 20),
    ),
  );

  const weightToGo = Math.max(0, data.currentWeight - data.goalWeight);

  const handleFilter = useCallback(
    (days: number) => {
      onFilterChange?.(days);
    },
    [onFilterChange],
  );

  // BMI category label + color
  const getBmiStyle = () => {
    const bmi = data.bmi;
    if (bmi < 18.5) return { label: "Underweight", color: "#3B82F6", bg: "#EBF2FF" };
    if (bmi < 25) return { label: "Healthy", color: "#22C55E", bg: "#DCFCE7" };
    if (bmi < 30) return { label: "Overweight", color: "#F59E0B", bg: "#FEF3C7" };
    return { label: "Obese", color: "#EF4444", bg: "#FEE2E2" };
  };
  const bmiStyle = getBmiStyle();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header: back arrow + Progress title + streak badge */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onProfilePress}>
          <ChevronLeft color="#1C1C1E" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Progress</Text>
        <View style={styles.streakBadge}>
          <Flame color="#FF6B35" fill="#FF6B35" size={16} />
          <Text style={styles.streakBadgeText}>{data.streak}</Text>
        </View>
      </View>

      {/* Weight + Streak row */}
      <View style={styles.row}>

        {/* My Weight Card */}
        <View style={styles.halfCard}>
          <Text style={styles.cardSectionLabel}>MY WEIGHT</Text>
          <Text style={styles.weightValue}>{data.currentWeight}kg</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${weightProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.goalWeightText}>
            Goal {data.goalWeight} kg
            {weightToGo > 0 ? (
              <Text style={styles.toGoText}> · {weightToGo?.toFixed(2)} to go</Text>
            ) : null}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.nextWeighInText}>
            {(() => {
              const lastUpdate = new Date((data as any).updatedAt || new Date());
              const nextWeighIn = new Date(lastUpdate);
              nextWeighIn.setDate(nextWeighIn.getDate() + 7);
              const now = new Date();
              const diffMs = nextWeighIn.getTime() - now.getTime();
              const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              return `Next weigh-in: ${diffDays}d`;
            })()}
          </Text>
        </View>

        {/* Day Streak Card */}
        <View style={styles.halfCard}>
          <Text style={styles.cardSectionLabel}>DAY STREAK</Text>
          <View style={styles.streakTopRow}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakNumber}>{data.streak}</Text>
              <Text style={styles.streakStartText}>Start today!</Text>
            </View>
            <Flame color="#FF6B35" fill="#FF6B35" size={36} />
          </View>
          {/* Day squares */}
          <View style={styles.daySquaresRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
              const isToday = i === new Date().getDay();
              return (
                <View key={i} style={styles.daySquareItem}>
                  <Text style={styles.daySquareLabel}>{day}</Text>
                  <View style={[styles.daySquare, isToday && styles.daySquareActive]} />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Time Filter Pills */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = activeDays === f.days;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => handleFilter(f.days)}
            >
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nutrition Trends Card */}
      <View style={styles.fullCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>NUTRITION TRENDS</Text>
          <View style={styles.liveDataBadge}>
            <View style={styles.liveDataDot} />
            <Text style={styles.liveDataText}>Live Data</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : (
            <Chart data={data.chartData} color="#3B82F6" height={200} />
          )}
        </View>
        {/* Motivational box */}
        <View style={styles.promoBox}>
          <Flame color="#FF6B35" fill="#FF6B35" size={18} />
          <Text style={styles.promoText}>
            You're consistently hitting your targets! Keep up the great momentum.
          </Text>
        </View>
      </View>

      {/* BMI Card */}
      <View style={styles.fullCard}>
        <Text style={styles.bmiSectionLabel}>BODY MASS INDEX (BMI)</Text>

        <View style={styles.bmiTopRow}>
          <Text style={styles.bmiValue}>{data.bmi}</Text>
          <View style={styles.bmiRightCol}>
            <Text style={styles.bmiRangeValue}>18.5–24.9</Text>
            <Text style={styles.bmiRangeLabel}>Healthy Range</Text>
          </View>
        </View>

        <View style={styles.bmiCategoryBadge}>
          <Text style={[styles.bmiCategoryText, { color: bmiStyle.color }]}>
            {bmiStyle.label}
          </Text>
        </View>

        {/* Gauge bar */}
        <View style={styles.bmiGaugeWrapper}>
          <LinearGradient
            colors={["#3B82F6", "#22C55E", "#F59E0B", "#EF4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gaugeBar}
          />
          <View
            style={[
              styles.gaugeIndicator,
              {
                left: `${Math.max(2, Math.min(96, ((data.bmi - 15) / (40 - 15)) * 100))}%`,
              },
            ]}
          />
        </View>

        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabel}>Underweight</Text>
          <Text style={styles.gaugeLabel}>Healthy</Text>
          <Text style={styles.gaugeLabel}>Overweight</Text>
          <Text style={styles.gaugeLabel}>Obese</Text>
        </View>

        {/* Tip box */}
        <View style={styles.bmiTipBox}>
          <Text style={styles.bmiTipIcon}>💡</Text>
          <Text style={styles.bmiTipText}>
            Losing ~1.3 kg/month will bring you to a healthy BMI in about 11 months. You've got this!
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEECE8",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  streakBadgeText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },

  // Cards row
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fullCard: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Weight card
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    marginBottom: 10,
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 3,
  },
  goalWeightText: {
    fontSize: 12,
    color: "#1C1C1E",
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
  },
  toGoText: {
    color: "#6B7280",
    fontFamily: Fonts.regular,
    fontWeight: "400",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  nextWeighInText: {
    fontSize: 12,
    color: "#22C55E",
    fontFamily: Fonts.medium,
  },

  // Streak card
  streakTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  streakLeft: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    lineHeight: 40,
  },
  streakStartText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  daySquaresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  daySquareItem: {
    alignItems: "center",
    gap: 4,
  },
  daySquareLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontFamily: Fonts.medium,
  },
  daySquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  daySquareActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },

  // Filter pills
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterPillActive: {
    backgroundColor: "#1C1C1E",
    borderColor: "#1C1C1E",
  },
  filterPillText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: Fonts.medium,
    fontWeight: "500",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontWeight: "700",
  },

  // Chart card
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    fontFamily: Fonts.bold,
  },
  liveDataBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDataDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveDataText: {
    fontSize: 12,
    color: "#22C55E",
    fontFamily: Fonts.medium,
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 12,
  },
  loadingBox: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  promoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    gap: 10,
  },
  promoText: {
    flex: 1,
    color: "#166534",
    fontSize: 13,
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },

  // BMI card
  bmiSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  bmiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  bmiRightCol: {
    alignItems: "flex-end",
  },
  bmiRangeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22C55E",
    fontFamily: Fonts.bold,
  },
  bmiRangeLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  bmiCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  bmiCategoryText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#F59E0B",
  },
  bmiGaugeWrapper: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    position: "relative",
    marginBottom: 8,
  },
  gaugeBar: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  gaugeIndicator: {
    position: "absolute",
    top: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#6B7280",
    marginLeft: -8,
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gaugeLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: Fonts.medium,
  },
  bmiTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  bmiTipIcon: {
    fontSize: 16,
  },
  bmiTipText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },
});