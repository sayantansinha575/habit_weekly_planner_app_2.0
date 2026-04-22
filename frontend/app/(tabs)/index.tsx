import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Flame, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import GoalModal from "@/src/components/GoalModal";
import ProgressRing from "@/src/components/ProgressRing";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useTaskStore } from "@/src/store/useTaskStore";
import * as Location from "expo-location";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useTaskStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const stats = useTaskStore((state) => state.stats);
  const loading = useTaskStore((state) => state.loading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadStats = useTaskStore((state) => state.loadStats);
  const addTask = useTaskStore((state) => state.addTask);
  const subscriptionStatus = useTaskStore((state) => state.subscriptionStatus);
  const checkSubscription = useTaskStore((state) => state.checkSubscription);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const isSubscriptionLoading = useTaskStore(
    (state) => state.isSubscriptionLoading,
  );

  const [selectedDate] = useState(new Date());
  const [weather, setWeather] = useState<{
    temp: number | null;
    condition: string | null;
    city: string | null;
  }>({ temp: null, condition: null, city: null });
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const isFetchingRef = React.useRef(false);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeatherLoading(false);
        return;
      }

      // Try to get current position with a timeout, or use last known position
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (e) {
        console.warn("Could not get current position, trying last known:", e);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        setWeatherLoading(false);
        return;
      }

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      // Geocoding can be flaky on Android, so we wrap it separately
      let city = null;
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        city = geo[0]?.city || geo[0]?.region || geo[0]?.subregion;
      } catch (geoError) {
        console.warn("Geocoding failed:", geoError);
        // We continue anyway, as we have lat/lon for the weather API
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      );
      const weatherData = await weatherRes.json();

      setWeather({
        temp: Math.round(weatherData.current_weather.temperature),
        condition: "Cloudy", // Simplified for design
        city: city || "Haridwar", // Fallback to Haridwar if city name fails
      });
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWeather();
  }, []);

  const loadData = React.useCallback(async () => {
    if (isFetchingRef.current || !user?.id) return;
    isFetchingRef.current = true;
    try {
      await Promise.all([loadTasks(user.id), loadStats(user.id)]);
    } catch (e) {
      console.error("Dashboard loadData failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadTasks, loadStats, user?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        checkSubscription();
      }
    }, [user?.id, checkSubscription]),
  );

  const handleSaveGoal = async (goalData: any) => {
    if (!user?.id) return;
    setModalVisible(false);
    try {
      await addTask(user.id, goalData);
      loadStats(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePressPlus = () => {
    if (!isAuthReady || isSubscriptionLoading) return;
    if (subscriptionStatus === "FREE" && tasks.length >= 2) {
      router.push("/subscription");
    } else {
      setModalVisible(true);
    }
  };

  // Filter tasks for today
  const todayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.scheduledDate);
    return taskDate.toDateString() === new Date().toDateString();
  });
  const todayTasksCount = todayTasks.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#F4F2ED", "#F4F2ED"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/icons_home_screen/profile_image.png")}
              style={styles.profileImage}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                Good morning, {user?.full_name?.split(" ")[0] || "Alexa"} 👋
              </Text>
              <Text style={styles.welcomeBackText}>Welcome Back</Text>
            </View>
          </View>

          <View style={styles.weatherCard}>
            <Text style={styles.weatherTemp}>{weather.temp ?? "--"}°</Text>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherCondition}>
                {weather.condition || "Cloudy"}
              </Text>
              <Text style={styles.weatherCity}>
                {weather.city || "Haridwar"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Access Section */}
        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
        <View style={styles.quickAccessRow}>
          {/* Planner Card */}
          <TouchableOpacity
            style={styles.quickAccessCardContainer}
            onPress={() => router.push("/planner")}
          >
            <LinearGradient
              colors={["#0BB3FF", "#F79219"]}
              style={styles.motivationGradientBackground}
            />
            <View style={styles.quickAccessGlassOverlay}>
              <Image
                source={require("@/assets/images/icons_home_screen/planner_quick_acess.png")}
                style={styles.quickAccessIcon}
                resizeMode="contain"
              />
              <Text style={[styles.quickAccessTitle, { color: "#F79219" }]}>
                Planner
              </Text>
              <Text style={styles.quickAccessSubtitle}>
                {todayTasksCount} Tasks Today
              </Text>
            </View>
          </TouchableOpacity>

          {/* Calorie AI Card */}
          <TouchableOpacity
            style={styles.quickAccessCardContainer}
            onPress={() => router.push("/calorie")}
          >
            <LinearGradient
              colors={["#0BB3FF", "#F79219"]}
              style={styles.motivationGradientBackground}
            />
            <View style={styles.quickAccessGlassOverlay}>
              <Image
                source={require("@/assets/images/icons_home_screen/calori_quick_acess.png")}
                style={styles.quickAccessIcon}
                resizeMode="contain"
              />
              <Text style={[styles.quickAccessTitle, { color: "#0BB3FF" }]}>
                Calorie AI
              </Text>
              <Text style={styles.quickAccessSubtitle}>1,840 / 2,000 kcal</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Streaks Section */}
        <Text style={styles.sectionTitle}>STREAKS</Text>
        <TouchableOpacity style={styles.streakCardMain}>
          <LinearGradient
            colors={["#021025", "#021025"]}
            style={styles.streakGradient}
          >
            {/* Corner Glows */}
            <LinearGradient
              colors={["rgba(209, 0, 40, 0.3)", "transparent"]}
              style={[styles.cornerGlow, { top: -20, right: -20 }]}
            />
            <LinearGradient
              colors={["rgba(247, 146, 25, 0.2)", "transparent"]}
              style={[styles.cornerGlow, { bottom: -20, left: -20 }]}
            />

            <View style={styles.streakContent}>
              <View>
                <Text style={styles.streakType}>PLANNING STREAK</Text>
                <Text style={styles.streakDays}>
                  {stats?.dailyStreak || 0} Day
                </Text>
                <Text style={styles.activeNow}>Active Now</Text>
              </View>
              <View style={styles.streakCircleContainer}>
                <ProgressRing
                  progress={(stats?.completionRate || 0) / 100}
                  size={80}
                  strokeWidth={4}
                  gradientColors={["#F79219", "#D10028"]}
                  trackColor="#FFFFFF"
                >
                  <Image
                    source={require("@/assets/images/icons_home_screen/planner_streak.png")}
                    style={{ width: 45, height: 45 }}
                    resizeMode="contain"
                  />
                </ProgressRing>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.streakCardMain}>
          <LinearGradient
            colors={["#021025", "#021025"]}
            style={styles.streakGradient}
          >
            {/* Corner Glows */}
            <LinearGradient
              colors={["rgba(85, 88, 255, 0.3)", "transparent"]}
              style={[styles.cornerGlow, { top: -20, right: -20 }]}
            />
            <LinearGradient
              colors={["rgba(0, 192, 255, 0.2)", "transparent"]}
              style={[styles.cornerGlow, { bottom: -20, left: -20 }]}
            />

            <View style={styles.streakContent}>
              <View>
                <Text style={styles.streakType}>CALORIE AI</Text>
                <Text style={styles.streakDays}>7 Day</Text>
                <Text style={styles.activeNow}>Active Now</Text>
              </View>
              <View style={styles.streakCircleContainer}>
                <ProgressRing
                  progress={0.8}
                  size={80}
                  strokeWidth={4}
                  gradientColors={["#00C0FF", "#5558FF"]}
                  trackColor="#FFFFFF"
                >
                  <Image
                    source={require("@/assets/images/icons_home_screen/calori_strak.png")}
                    style={{ width: 45, height: 45 }}
                    resizeMode="contain"
                  />
                </ProgressRing>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Motivation Card */}
        <View style={styles.motivationCardContainer}>
          <LinearGradient
            colors={["#0BB3FF", "#F79219"]}
            style={styles.motivationGradientBackground}
          />
          <View style={styles.motivationGlassOverlay}>
            <View style={styles.motivationCard}>
              <View style={styles.motivationIconContainer}>
                <Image
                  source={require("@/assets/images/icons_home_screen/planner_streak.png")}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.motivationTextContainer}>
                <Text style={styles.motivationTitle}>
                  Don't break the chain!
                </Text>
                <Text style={styles.motivationSubtitle}>
                  You're on a 7-day roll - keep the streak alive today.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Stats Section */}
        <Text style={styles.sectionTitle}>TODAY'S STATS</Text>
        <View style={styles.statsRow}>
          {/* Tasks Completion Card */}
          <View style={styles.statCardContainer}>
            <LinearGradient
              colors={["#0BB3FF", "#F79219"]}
              style={styles.motivationGradientBackground}
            />
            <View style={styles.statCardGlassOverlay}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statValue}>
                  {Math.round(stats?.completionRate || 0)}%
                </Text>
                <Image
                  source={require("@/assets/images/icons_home_screen/planner_today_stats.png")}
                  style={styles.statIcon}
                />
              </View>
              <Text style={styles.statLabel}>Tasks Today</Text>
              <View style={styles.perfectDayTag}>
                <View style={styles.perfectDayDot} />
                <Text style={styles.perfectDayText}>Perfect Day</Text>
              </View>
            </View>
          </View>

          {/* Calorie Progress Card */}
          <View style={styles.statCardContainer}>
            <LinearGradient
              colors={["#0BB3FF", "#F79219"]}
              style={styles.motivationGradientBackground}
            />
            <View style={styles.statCardGlassOverlay}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statValue}>1,840</Text>
                <Image
                  source={require("@/assets/images/icons_home_screen/calori_today_stats.png")}
                  style={styles.statIcon}
                />
              </View>
              <Text style={styles.statLabel}>Kcal • On Target</Text>
              <View style={styles.onTrackTag}>
                <Text style={styles.onTrackText}>On Track</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Goal Section */}
        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.weeklyGoalTitle}>Weekly Goal</Text>
            <Text style={styles.weeklyGoalPercentage}>78%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "78%" }]} />
          </View>
          <View style={styles.weeklyGoalFooter}>
            <Text style={styles.weeklyGoalSub}>14 of 18 tasks done</Text>
            <Text style={styles.weeklyGoalSub}>4 remaining</Text>
          </View>
        </View>

        {/* Today's Plan Section */}
        <View style={styles.todayPlanHeader}>
          <Text style={styles.sectionTitle}>TODAY'S PLAN</Text>
          <TouchableOpacity onPress={() => router.push("/planner")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.map((task) => {
          const taskDate = new Date(task.scheduledDate);
          const formattedDate = taskDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          // Helper to format 24h to 12h
          const formatTo12Hour = (timeStr?: string) => {
            if (!timeStr) return "";
            if (
              timeStr.toUpperCase().includes("AM") ||
              timeStr.toUpperCase().includes("PM")
            )
              return timeStr;
            const [hours, minutes] = timeStr.split(":").map(Number);
            if (isNaN(hours) || isNaN(minutes)) return timeStr;
            const ampm = hours >= 12 ? "PM" : "AM";
            const h12 = hours % 12 || 12;
            const mStr = minutes.toString().padStart(2, "0");
            return `${h12}:${mStr} ${ampm}`;
          };

          const formattedTime = formatTo12Hour(task.scheduledTime);
          const displayTime = task.isCompleted
            ? `${formattedDate}, ${formattedTime}`
            : task.scheduledTime
              ? `${formattedDate}, ${formattedTime}`
              : "No time set";

          return (
            <View key={task.id} style={styles.taskCard}>
              <View
                style={[
                  styles.taskSideBar,
                  { backgroundColor: task.isCompleted ? "#63D568" : "#63D568" },
                ]}
              />
              <View style={styles.taskCardContent}>
                <View style={styles.taskCardLeft}>
                  <TouchableOpacity
                    style={[
                      styles.taskToggle,
                      task.isCompleted && styles.taskToggleActive,
                    ]}
                    onPress={() => useTaskStore.getState().toggleTask(task.id)}
                  >
                    <View
                      style={[
                        styles.taskToggleDot,
                        task.isCompleted && styles.taskToggleDotActive,
                      ]}
                    />
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.isCompleted && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMetaRow}>
                      <Text style={styles.taskTime}>{displayTime}</Text>
                      <View style={styles.metaDot} />
                      <View
                        style={[
                          styles.statusTag,
                          task.isCompleted
                            ? styles.statusTagDone
                            : styles.statusTagPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusTagText,
                            task.isCompleted
                              ? styles.statusTagTextDone
                              : styles.statusTagTextDone,
                          ]}
                        >
                          {task.isCompleted ? "Done" : "Pending"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {task.isCompleted && (
                  <Image
                    source={require("@/assets/images/icons_home_screen/task_complte_icon.png")}
                    style={styles.taskCompleteIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          );
        })}
        {todayTasks.length === 0 && (
          <View style={styles.emptyStateWrapper}>
            {/* Glow/Fade effect behind card */}
            <View style={styles.emptyStateGlow} />

            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateContent}>
                <Image
                  source={require("@/assets/images/planner_checklist_3d.png")}
                  style={styles.emptyStateImage}
                  resizeMode="contain"
                />
                <View style={styles.skeletonContainer}>
                  <View style={[styles.skeletonBar, { width: "90%" }]} />
                  <View style={[styles.skeletonBar, { width: "60%" }]} />
                </View>
              </View>
            </View>
            <Text style={styles.emptyStateCTA}>
              Tap + to add your first goal for today
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handlePressPlus}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <GoalModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
      />
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
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  greetingContainer: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1C",
    fontFamily: Fonts.semiBold,
  },
  welcomeBackText: {
    fontSize: 14,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  weatherCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 8,
    fontFamily: Fonts.bold,
  },
  weatherInfo: {
    justifyContent: "center",
  },
  weatherCondition: {
    fontSize: 12,
    color: "#0BB3FF",
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  weatherCity: {
    fontSize: 10,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8D8D8D",
    letterSpacing: 1.2,
    marginBottom: 15,
    marginTop: 10,
    fontFamily: Fonts.bold,
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  quickAccessCardContainer: {
    width: "48%",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  quickAccessGlassOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },
  quickAccessTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: Fonts.bold,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  streakCardMain: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: "hidden",
  },
  streakGradient: {
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  cornerGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  streakContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakType: {
    color: "#8D8D8D",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  streakDays: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  activeNow: {
    color: "#63D568",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
    fontFamily: Fonts.semiBold,
  },
  streakCircleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  motivationCardContainer: {
    marginVertical: 15,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  motivationGradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  motivationGlassOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  motivationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 75, 43, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  motivationTextContainer: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1C",
    fontFamily: Fonts.bold,
  },
  motivationSubtitle: {
    fontSize: 12,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCardContainer: {
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  statCardGlassOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1C1C1C",
    fontFamily: Fonts.bold,
  },
  statIcon: {
    width: 32,
    height: 32,
  },
  statLabel: {
    fontSize: 14,
    color: "#8D8D8D",
    marginBottom: 10,
    fontFamily: Fonts.medium,
  },
  perfectDayTag: {
    backgroundColor: "#E8FFE8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  perfectDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#63D568",
    marginRight: 6,
  },
  perfectDayText: {
    fontSize: 10,
    color: "#63D568",
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  onTrackTag: {
    backgroundColor: "#DDE5FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  onTrackText: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  weeklyGoalCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  weeklyGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  weeklyGoalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1C",
    fontFamily: Fonts.bold,
  },
  weeklyGoalPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1C",
    fontFamily: Fonts.bold,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 5,
  },
  weeklyGoalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weeklyGoalSub: {
    fontSize: 12,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  todayPlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    height: 85,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  taskSideBar: {
    width: 4,
    height: "50%",
    borderRadius: 2,
    marginLeft: 0,
  },
  taskCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    padding: 16,
    paddingLeft: 12,
  },
  taskCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    padding: 2,
    marginRight: 12,
  },
  taskToggleActive: {
    backgroundColor: "#63D568",
  },
  taskToggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  taskToggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1C",
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#8D8D8D",
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskTime: {
    fontSize: 12,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
    marginHorizontal: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusTagDone: {
    backgroundColor: "#E8FFE8",
  },
  statusTagPending: {
    backgroundColor: "#E8FFE8", // Using the same light green as requested
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  statusTagTextDone: {
    color: "#63D568",
  },
  statusTagTextPending: {
    color: "#3B82F6", // Changed to blue for "Pending" as requested
  },
  taskCompleteIcon: {
    width: 32,
    height: 32,
  },
  emptyStateWrapper: {
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
    position: "relative",
  },
  emptyStateGlow: {
    position: "absolute",
    bottom: 50,
    width: "90%",
    height: 60,
    backgroundColor: "rgba(255, 105, 180, 0.15)", // Pinkish glow
    borderRadius: 30,
    filter: "blur(20px)", // For web, on native we use shadow
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 0,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 120, // Slightly smaller
    borderRadius: 35,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  emptyStateContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emptyStateImage: {
    width: 70, // Slightly smaller
    height: 70,
    marginRight: 15,
  },
  skeletonContainer: {
    flex: 1,
    gap: 12,
  },
  skeletonBar: {
    height: 14,
    backgroundColor: "#F2F2F2",
    borderRadius: 7,
  },
  emptyStateCTA: {
    fontSize: 16,
    color: "#8D9CB5",
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    marginTop: 0,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3B82F6",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
