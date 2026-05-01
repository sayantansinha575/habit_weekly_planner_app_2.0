import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Modal,
  Image,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Plus,
  Signal,
  Wifi,
  Battery,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import * as Location from "expo-location";
import { LocofyTheme } from "@/src/theme/locofyTheme";
import GoalModal from "@/src/components/GoalModal";
import { useTaskStore } from "@/src/store/useTaskStore";
import EmptyState from "@/src/components/EmptyState";
import { useRouter } from "expo-router";
import CustomSplashScreen from "@/src/components/CustomSplashScreen";
import {
  Color,
  FontFamily,
  FontSize,
  Gap,
  Padding,
  Border,
  Height,
  Width,
  LineHeight,
  LetterSpacing,
  BoxShadow,
} from "@/src/theme/LocofyTokens";

/* ─────────────── Circular Progress Ring ─────────────── */
function ProgressRing({
  percentage,
  color = "#3b82f6",
}: {
  percentage: number;
  color?: string;
}) {
  const radius = 38;
  const stroke = 6;
  const norm = radius - stroke;
  const circumference = norm * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          stroke="#E8E8E8"
          fill="transparent"
          strokeWidth={stroke}
          r={norm}
          cx={radius}
          cy={radius}
        />
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={norm}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </Svg>
      <Text style={ringStyles.pct}>{Math.round(percentage)}%</Text>
    </View>
  );
}
const ringStyles = StyleSheet.create({
  pct: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.dMSans,
    fontWeight: "800",
    color: Color.colorGray400,
    lineHeight: 76,
  },
});

/* ─────────────── Progress Card ─────────────── */
function ProgressCard({
  label,
  subLabel,
  percentage,
  ringColor,
}: {
  label: string;
  subLabel: string;
  percentage: number;
  ringColor: string;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.ring}>
        <ProgressRing percentage={percentage} color={ringColor} />
      </View>
      <Text style={cardStyles.label}>{label}</Text>
      <Text style={cardStyles.sub}>{subLabel}</Text>
    </View>
  );
}
const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Color.primaryBaseWhite,
    borderRadius: Border.br_16,
    padding: Padding.padding_16,
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    alignItems: "flex-start",
    gap: Gap.gap_5,
  },
  ring: { marginBottom: 4 },
  label: {
    fontSize: FontSize.fs_22,
    fontFamily: FontFamily.dMSans,
    fontWeight: "800",
    color: Color.colorGray400,
  },
  sub: {
    fontSize: FontSize.fs_12,
    fontFamily: FontFamily.dMSans,
    color: Color.colorGray200,
  },
});

/* ─────────────── Task Item (matches index.tsx) ─────────────── */
function TaskItem({
  task,
  isEditMode,
  isSelected,
  onToggle,
  onSelect,
  onEdit,
}: {
  task: any;
  isEditMode: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const isCompleted = task.isCompleted;

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
    return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const formattedDate = task.scheduledDate
    ? new Date(task.scheduledDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
  const formattedTime = formatTo12Hour(task.scheduledTime);
  const displayTime = isCompleted
    ? `${formattedDate}${formattedTime ? ", " + formattedTime : ""}`
    : task.scheduledTime
      ? `${formattedDate}${formattedTime ? ", " + formattedTime : ""}`
      : formattedDate || "No time set";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[taskStyles.card, isSelected && taskStyles.selectedCard]}
      onPress={isEditMode ? onSelect : onEdit}
      onLongPress={onSelect}
    >
      {/* Left green sidebar bar */}
      <View
        style={[
          taskStyles.taskSideBar,
          { backgroundColor: isCompleted ? "#63D568" : "#63D568" },
        ]}
      />

      {/* Card content */}
      <View style={taskStyles.taskCardContent}>
        <View style={taskStyles.taskCardLeft}>
          {/* Custom toggle matching index.tsx */}
          <TouchableOpacity
            style={[
              taskStyles.taskToggle,
              isCompleted && taskStyles.taskToggleActive,
            ]}
            onPress={onToggle}
          >
            <View
              style={[
                taskStyles.taskToggleDot,
                isCompleted && taskStyles.taskToggleDotActive,
              ]}
            />
          </TouchableOpacity>

          {/* Task info */}
          <View style={taskStyles.taskInfo}>
            <Text
              style={[
                taskStyles.taskTitle,
                isCompleted && taskStyles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <View style={taskStyles.taskMetaRow}>
              <Text style={taskStyles.taskTime}>{displayTime}</Text>
              <View style={taskStyles.metaDot} />
              <View
                style={[
                  taskStyles.statusTag,
                  isCompleted
                    ? taskStyles.statusTagDone
                    : taskStyles.statusTagPending,
                ]}
              >
                <Text
                  style={[
                    taskStyles.statusTagText,
                    isCompleted
                      ? taskStyles.statusTagTextDone
                      : taskStyles.statusTagTextPending,
                  ]}
                >
                  {isCompleted ? "Done" : "Pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Complete icon */}
        {isCompleted && (
          <Image
            source={require("@/assets/images/icons_home_screen/task_complte_icon.png")}
            style={taskStyles.taskCompleteIcon}
            resizeMode="contain"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const taskStyles = StyleSheet.create({
  card: {
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
  selectedCard: {
    borderWidth: 2,
    borderColor: Color.colorDodgerblue,
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
    fontFamily: FontFamily.dMSans,
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
    fontFamily: FontFamily.dMSans,
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
    backgroundColor: "#E8FFE8",
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: FontFamily.dMSans,
  },
  statusTagTextDone: {
    color: "#63D568",
  },
  statusTagTextPending: {
    color: "#63D568",
  },
  taskCompleteIcon: {
    width: 32,
    height: 32,
  },
});

/* ─────────────── Main Screen ─────────────── */
export default function PlannerScreen() {
  const router = useRouter();
  const user = useTaskStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const subscriptionStatus = useTaskStore((state) => state.subscriptionStatus);
  const loading = useTaskStore((state) => state.loading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTasks = useTaskStore((state) => state.deleteTasks);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const isSubscriptionLoading = useTaskStore(
    (state) => state.isSubscriptionLoading,
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const isFetchingTasksRef = React.useRef(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<"All" | "Pending" | "Done">("All");

  // Weather state (same as index.tsx)
  const [weather, setWeather] = useState<{
    temp: number | null;
    condition: string | null;
    city: string | null;
  }>({ temp: null, condition: null, city: null });
  const [weatherLoading, setWeatherLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeatherLoading(false);
        return;
      }
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        location = await Location.getLastKnownPositionAsync({});
      }
      if (!location) {
        setWeatherLoading(false);
        return;
      }
      const { latitude: lat, longitude: lon } = location.coords;
      let city = null;
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        city = geo[0]?.city || geo[0]?.region || geo[0]?.subregion;
      } catch {}
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      );
      const weatherData = await weatherRes.json();
      setWeather({
        temp: Math.round(weatherData.current_weather.temperature),
        condition: "Cloudy",
        city: city || "--",
      });
    } catch (e) {
      console.error("Weather fetch failed:", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWeather();
  }, []);

  const weekDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    return days;
  }, []);

  const handleLoadTasks = React.useCallback(async () => {
    if (isFetchingTasksRef.current || !user?.id) return;
    isFetchingTasksRef.current = true;
    try {
      await loadTasks(user.id);
    } catch (e) {
      console.error("Planner loadTasks failed", e);
    } finally {
      isFetchingTasksRef.current = false;
    }
  }, [loadTasks, user?.id]);

  React.useEffect(() => {
    handleLoadTasks();
  }, [handleLoadTasks]);

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    if (!user?.id) return;
    setModalVisible(false);
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, goalData);
      } else {
        await addTask(user.id, goalData);
      }
      setSelectedTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (task: any) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${selectedTaskIds.size} goal(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTasks(Array.from(selectedTaskIds));
              setSelectedTaskIds(new Set());
              setIsEditMode(false);
            } catch (e) {
              Alert.alert("Error", "Failed to delete goals.");
            }
          },
        },
      ],
    );
  };

  const handlePressFab = () => {
    if (!isAuthReady || isSubscriptionLoading) return;
    if (subscriptionStatus === "FREE" && tasks.length >= 2) {
      router.push("/subscription");
    } else {
      setSelectedTask(null);
      setModalVisible(true);
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const completedPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredTasks = tasks.filter((t) => {
    const isSameDay =
      new Date(t.scheduledDate).toDateString() === selectedDate.toDateString();
    if (!isSameDay) return false;
    if (filter === "Pending") return !t.isCompleted;
    if (filter === "Done") return t.isCompleted;
    return true;
  });

  // username from user profile
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  if (!isAuthReady || isSubscriptionLoading) {
    return <CustomSplashScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ─── Background ─── */}
      <LinearGradient
        colors={["#F4F2ED", "#F4F2ED"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/icons_home_screen/profile_image.png")}
            style={styles.profileImage}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Good morning, {user?.full_name?.split(" ")[0] || "there"} 👋
            </Text>
            <Text style={styles.welcomeBackText}>Welcome Back</Text>
          </View>
        </View>

        <View style={styles.weatherCard}>
          <Text style={styles.weatherTemp}>
            {weather.temp ?? "--"}
            {"\u00B0"}
          </Text>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherCondition}>
              {weather.condition || "Cloudy"}
            </Text>
            <Text style={styles.weatherCity}>{weather.city || "--"}</Text>
          </View>
        </View>
      </View>

      {/* ─── Calendar Strip ─── */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Text style={styles.monthLabel}>
            {selectedDate
              .toLocaleDateString("en-US", { month: "long", year: "numeric" })
              .toUpperCase()}
          </Text>
          <View style={styles.arrowRow}>
            <TouchableOpacity style={styles.arrowBtn}>
              <ChevronLeft size={14} color={Color.labelsPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn}>
              <ChevronRight size={14} color={Color.labelsPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStrip}
        >
          {weekDays.map((date, i) => {
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dayNum = date.getDate().toString();
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isSelected && styles.daySelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSel]}>
                  {dayName}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSel]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Progress */}
        <Text style={styles.sectionLabel}>TODAY PROGRESS</Text>
        <View style={styles.progressRow}>
          <ProgressCard
            label="Completed"
            subLabel={`${completedCount}/${totalCount} Goals`}
            percentage={completedPct}
            ringColor={Color.colorDodgerblue}
          />
          <ProgressCard
            label="Efficiency"
            subLabel="On Track"
            percentage={completedPct}
            ringColor={Color.colorLightgreen}
          />
        </View>

        {/* Main Goals Header */}
        <View style={styles.goalsHeaderRow}>
          <Text style={styles.goalsTitle}>Main Goals</Text>
          <View style={styles.goalsHeaderRight}>
            {!isEditMode && (
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            )}
            {!isEditMode && (
              <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
                <MoreVertical color={Color.colorGray100} size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(["All", "Pending", "Done"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabOn]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f && styles.filterTabTextOn,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Edit Actions */}
        {isEditMode && (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.editAction}>
                {selectedTaskIds.size === tasks.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsEditMode(false);
                setSelectedTaskIds(new Set());
              }}
            >
              <Text style={[styles.editAction, { color: "#FF4444" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Task List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Color.colorDodgerblue} />
            <Text style={styles.loadingTxt}>Loading goals...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            imageSource={require("@/assets/images/planner_checklist_3d.png")}
            message="Tap + to add your first goal for today"
          />
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isEditMode={isEditMode}
                isSelected={selectedTaskIds.has(task.id)}
                onToggle={() => handleToggleTask(task.id)}
                onSelect={() => toggleSelection(task.id)}
                onEdit={() => openEditModal(task)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 220 }} />
      </ScrollView>

      {/* ─── FAB ─── */}
      <TouchableOpacity style={styles.fab} onPress={handlePressFab}>
        <Plus color="#FFF" size={28} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ─── Delete FAB ─── */}
      {isEditMode && selectedTaskIds.size > 0 && (
        <TouchableOpacity
          style={styles.deleteFab}
          onPress={handleDeleteSelected}
        >
          <Trash2 color="#FFF" size={20} />
          <Text style={styles.deleteFabTxt}>
            Delete ({selectedTaskIds.size})
          </Text>
        </TouchableOpacity>
      )}

      {/* ─── Dropdown Menu ─── */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.overlay}>
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsEditMode(true);
                  setIsMenuOpen(false);
                }}
              >
                <Text style={styles.menuItemTxt}>Edit Goals</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Goal Modal ─── */}
      <GoalModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
        initialData={selectedTask}
      />
    </SafeAreaView>
  );
}

/* ─────────────── Styles ─────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F2ED",
  },

  /* ── Header (matches index.tsx) ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 27,
    paddingHorizontal: 20,
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
    fontFamily: FontFamily.dMSans,
  },
  welcomeBackText: {
    fontSize: 14,
    color: "#8D8D8D",
    fontFamily: FontFamily.dMSans,
    marginTop: -2,
  },
  weatherCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    gap: 8,
  },
  weatherDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  weatherTemp: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1C",
    fontFamily: FontFamily.dMSans,
  },
  weatherInfo: {
    justifyContent: "center",
  },
  weatherCondition: {
    fontSize: 12,
    color: "#0BB3FF",
    fontWeight: "600",
    fontFamily: FontFamily.dMSans,
    lineHeight: 15,
  },
  weatherCity: {
    fontSize: 10,
    color: "#8D8D8D",
    fontFamily: FontFamily.dMSans,
    lineHeight: 14,
  },

  /* ── Calendar ── */
  calendarSection: {
    paddingHorizontal: Padding.padding_20,
    paddingBottom: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: FontSize.fs_14,
    fontFamily: FontFamily.dMSans,
    fontWeight: "600",
    color: Color.colorGray100,
    letterSpacing: LetterSpacing.ls_0_6,
  },
  arrowRow: { flexDirection: "row", gap: 8 },
  arrowBtn: {
    width: 26,
    height: 26,
    borderRadius: Border.br_6,
    backgroundColor: Color.primaryBaseWhite,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  calendarStrip: {
    flexDirection: "row",
    gap: Gap.gap_8,
    paddingRight: Padding.padding_20,
  },
  dayCell: {
    width: 52,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  daySelected: {
    backgroundColor: "#1C1C1E",
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderColor: "transparent",
  },
  dayName: {
    fontSize: 11,
    fontFamily: FontFamily.dMSans,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  dayNameSel: { color: "rgba(255,255,255,0.7)" },
  dayNum: {
    fontSize: 20,
    fontFamily: FontFamily.dMSans,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  dayNumSel: { color: "#FFFFFF" },

  /* ── Scroll ── */
  scroll: { paddingHorizontal: Padding.padding_20, paddingTop: 8 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: FontFamily.dMSans,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },

  /* ── Goals Header ── */
  goalsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  goalsTitle: {
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.dMSans,
    fontWeight: "800",
    color: Color.colorGray400,
  },
  goalsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewAll: {
    fontSize: FontSize.fs_14,
    fontFamily: FontFamily.dMSans,
    color: Color.colorDodgerblue,
  },

  /* ── Filter Tabs ── */
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  filterTabOn: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: FontFamily.dMSans,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterTabTextOn: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Edit ── */
  editActions: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  editAction: {
    fontSize: 14,
    fontFamily: FontFamily.dMSans,
    fontWeight: "600",
    color: Color.colorDodgerblue,
  },

  /* ── Task List ── */
  taskList: { gap: 12 },
  loadingBox: { padding: 40, alignItems: "center" },
  loadingTxt: {
    color: "#9CA3AF",
    marginTop: 12,
    fontFamily: FontFamily.dMSans,
  },

  /* ── FAB ── */
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    zIndex: 100,
  },
  deleteFab: {
    position: "absolute",
    bottom: 200, // above the FAB
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteFabTxt: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: FontFamily.dMSans,
  },

  /* ── Dropdown ── */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.08)" },
  dropdown: {
    position: "absolute",
    top: 200,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  menuItem: { padding: 12 },
  menuItemTxt: {
    color: Color.dark,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FontFamily.dMSans,
  },
});
