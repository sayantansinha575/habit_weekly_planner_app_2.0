import { api } from "@/src/services/api";
import { useTaskStore } from "@/src/store/useTaskStore";
import { Colors, Fonts } from "@/src/theme/colors";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
  LogOut,
  Settings,
  Shield
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 50];

// Weekly activity mock data (Mon–Sun)
const WEEKLY_DATA = [
  { day: "MON", value: 6200 },
  { day: "TUE", value: 6200 },
  { day: "WED", value: 6200 },
  { day: "THU", value: 6200 },
  { day: "FRI", value: 6200 },
  { day: "SAT", value: 6200 },
  { day: "SUN", value: 6200 },
];

const MAX_BAR_HEIGHT = 90;

function WeeklyActivityChart() {
  const maxValue = Math.max(...WEEKLY_DATA.map((d) => d.value));
  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>WEEKLY ACTIVITY</Text>
      <View style={chartStyles.barsRow}>
        {WEEKLY_DATA.map((item, index) => {
          const barHeight = (item.value / maxValue) * MAX_BAR_HEIGHT;
          const isHighlighted = index === 3; // THU highlighted darker
          return (
            <View key={item.day} style={chartStyles.barWrapper}>
              <Text style={chartStyles.valueLabel}>
                {item.value >= 1000
                  ? `${(item.value / 1000).toFixed(1)}K`
                  : item.value}
              </Text>
              <View
                style={[
                  chartStyles.bar,
                  { height: barHeight },
                  isHighlighted && chartStyles.barHighlighted,
                  index === 2 && chartStyles.barLight,
                  index === 4 && chartStyles.barLight,
                ]}
              />
              <Text style={chartStyles.dayLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: MAX_BAR_HEIGHT + 40,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  valueLabel: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  bar: {
    width: "65%",
    borderRadius: 6,
    backgroundColor: "#A8B8FF",
  },
  barHighlighted: {
    backgroundColor: "#3B5BDB",
  },
  barLight: {
    backgroundColor: "#D0D9FF",
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user, stats, calorieProgress, signOut } = useTaskStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"badges" | "settings">("badges");

  const [formData, setFormData] = useState({
    goalWeight: "",
    currentWeight: "",
    height: "",
    dailyStepGoal: "",
    dateOfBirth: "1995-01-01",
    gender: "Male",
  });

  // Other settings toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [selectedReason, setSelectedReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletionLoading, setDeletionLoading] = useState(false);

  const DELETION_REASONS = [
    "I no longer use the app",
    "I found a better alternative",
    "Too many notifications",
    "Privacy concerns",
    "Other",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const profileData = await api.getCalAiProfile(user.id);
        if (profileData) {
          setFormData({
            goalWeight: profileData.goalWeight.toString(),
            currentWeight: profileData.currentWeight.toString(),
            height: profileData.height,
            dailyStepGoal: profileData.dailyStepGoal.toString(),
            dateOfBirth: profileData.dateOfBirth
              ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
              : "1995-01-01",
            gender: profileData.gender || "Male",
          });
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleUpdateCalorieProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      await api.updateCalAiProfile(user.id, {
        goalWeight: parseFloat(formData.goalWeight),
        currentWeight: parseFloat(formData.currentWeight),
        height: formData.height,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      });
      await useTaskStore.getState().loadCalAiData(user.id);
      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      console.error("Profile update error:", e);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (selectedReason === "" || deleteConfirmText !== "DELETE") return;

    Alert.alert(
      "Are you sure?",
      "We will delete your account and all associated data within 7 days. This action cannot be undone once processed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Deletion",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletionLoading(true);
              await api.requestAccountDeletion(selectedReason);
              Alert.alert(
                "Request Sent",
                "Your deletion request has been received. You will be logged out now.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      await signOut();
                      router.replace("/login");
                    },
                  },
                ],
              );
            } catch (e) {
              console.error("Deletion request error:", e);
              Alert.alert("Error", "Failed to submit deletion request");
            } finally {
              setDeletionLoading(false);
            }
          },
        },
      ],
    );
  };

  /** Planner badge — app-icon style rounded square */
  const renderPlannerBadge = (milestone: number, currentStreak: number) => {
    const isAchieved = currentStreak >= milestone;
    return (
      <View key={`planner-${milestone}`} style={styles.badgeItem}>
        {isAchieved ? (
          // Achieved: black rounded-square with white Award circle inside
          <View style={styles.plannerAchievedCard}>
            {/* Grey top pill/tab to simulate ribbon */}
            <View style={styles.plannerRibbonTab} />
            {/* White medal circle */}
            <View style={styles.plannerMedalCircle}>
              <Award color="#1C1C1E" size={22} strokeWidth={2} />
            </View>
          </View>
        ) : (
          // Locked: light grey rounded-square, grey Award circle
          <View style={styles.plannerLockedCard}>
            <View style={styles.plannerLockedCircle}>
              <Award color="#BBBBBB" size={22} strokeWidth={2} />
            </View>
          </View>
        )}
        <Text style={[styles.badgeMilestone, isAchieved && { color: "#1C1C1E", fontFamily: Fonts.bold }]}>
          {milestone} Day
        </Text>
        <Text style={styles.badgeType}>Planner</Text>
      </View>
    );
  };

  /** Calorie badge — flame icon rounded-square */
  const renderCalorieBadge = (milestone: number, currentStreak: number) => {
    const isAchieved = currentStreak >= milestone;
    return (
      <View key={`calorie-${milestone}`} style={styles.badgeItem}>
        <View style={[styles.calorieCard, isAchieved && styles.calorieCardAchieved]}>
          <Flame
            color={isAchieved ? "#FF4D2B" : "#C8C8C8"}
            fill={isAchieved ? "#FF4D2B" : "transparent"}
            size={34}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[styles.badgeMilestone, isAchieved && { color: "#1C1C1E", fontFamily: Fonts.bold }]}>
          {milestone} Day
        </Text>
        <Text style={styles.badgeType}>Calorie</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${user?.username || user?.email}&background=random&size=200`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.username || "Eco Warrior"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "Eco Warrior"}
              </Text>
            </View>
          </View>

          {/* Custom Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "badges" && styles.activeTab]}
              onPress={() => setActiveTab("badges")}
            >
              <Award
                color={
                  activeTab === "badges" ? Colors.primary : Colors.textMuted
                }
                size={18}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "badges" && styles.activeTabText,
                ]}
              >
                Badge
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "settings" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("settings")}
            >
              <Settings
                color={
                  activeTab === "settings" ? Colors.primary : Colors.textMuted
                }
                size={18}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "settings" && styles.activeTabText,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "badges" ? (
            <>
              {/* Weekly Activity Chart */}
              <WeeklyActivityChart />

              {/* Planner Streaks */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PLANNER STREAKS</Text>
                <View style={styles.badgesCard}>
                  <View style={styles.badgeGrid}>
                    {STREAK_MILESTONES.map((m) =>
                      renderPlannerBadge(m, stats?.dailyStreak || 1),
                    )}
                  </View>
                </View>
              </View>

              {/* Calorie AI Streaks */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CALORIE AI STREAKS</Text>
                <View style={styles.badgesCard}>
                  <View style={styles.badgeGrid}>
                    {STREAK_MILESTONES.map((m) =>
                      renderCalorieBadge(m, calorieProgress?.streak || 0),
                    )}
                  </View>
                </View>
              </View>

              {/* Support */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SUPPORT</Text>
                <View style={styles.linksCard}>
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push("/about")}
                  >
                    <View style={styles.linkIconWrapper}>
                      <Info size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.linkTextGroup}>
                      <Text style={styles.linkText}>About Us</Text>
                      <Text style={styles.linkSubText}>App info &amp; team</Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <View style={styles.separator} />

                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push("/privacy")}
                  >
                    <View style={styles.linkIconWrapper}>
                      <Shield size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.linkTextGroup}>
                      <Text style={styles.linkText}>Privacy Policy</Text>
                      <Text style={styles.linkSubText}>
                        How we use your data
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Calorie AI Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PLANNER STREAKS</Text>
                <View style={styles.settingsCard}>
                  <Text style={styles.settingsCardTitle}>
                    Calorie AI Settings
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Weight</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={formData.currentWeight}
                        onChangeText={(t) =>
                          setFormData({ ...formData, currentWeight: t })
                        }
                        keyboardType="numeric"
                        placeholder="85"
                      />
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>kg</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Goal Weight</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={formData.goalWeight}
                        onChangeText={(t) =>
                          setFormData({ ...formData, goalWeight: t })
                        }
                        keyboardType="numeric"
                        placeholder="70"
                      />
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>kg</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Height</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={formData.height}
                        onChangeText={(t) =>
                          setFormData({ ...formData, height: t })
                        }
                        keyboardType="numeric"
                        placeholder="180"
                      />
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>cm</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Daily Step Goal</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={formData.dailyStepGoal}
                        onChangeText={(t) =>
                          setFormData({ ...formData, dailyStepGoal: t })
                        }
                        keyboardType="numeric"
                        placeholder="180"
                      />
                      <View style={[styles.unitBadge, styles.unitBadgeWide]}>
                        <Text style={styles.unitText}>steps</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.updateBtn}
                    onPress={handleUpdateCalorieProfile}
                    disabled={loading}
                  >
                    <View style={styles.updateBtnInner}>
                      <Text style={styles.updateBtnText}>
                        {loading ? "Updating..." : "Update Settings"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Other Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>OTHER SETTINGS</Text>
                <View style={styles.linksCard}>
                  <View style={styles.toggleRow}>
                    <View style={styles.linkIconWrapper}>
                      <Info size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.toggleTextGroup}>
                      <Text style={styles.linkText}>Push Notifications</Text>
                      <Text style={styles.linkSubText}>
                        Daily reminders &amp; streaks
                      </Text>
                    </View>
                    <Switch
                      value={pushNotifications}
                      onValueChange={setPushNotifications}
                      trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.toggleRow}>
                    <View style={styles.linkIconWrapper}>
                      <Info size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.toggleTextGroup}>
                      <Text style={styles.linkText}>Email Reports</Text>
                      <Text style={styles.linkSubText}>
                        Weekly progress digest
                      </Text>
                    </View>
                    <Switch
                      value={emailReports}
                      onValueChange={setEmailReports}
                      trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.toggleRow}>
                    <View style={styles.linkIconWrapper}>
                      <Shield size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.toggleTextGroup}>
                      <Text style={styles.linkText}>Dark Mode</Text>
                      <Text style={styles.linkSubText}>Auto / Manual</Text>
                    </View>
                    <Switch
                      value={darkMode}
                      onValueChange={setDarkMode}
                      trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              {/* Support */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SUPPORT</Text>
                <View style={styles.linksCard}>
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push("/about")}
                  >
                    <View style={styles.linkIconWrapper}>
                      <Info size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.linkTextGroup}>
                      <Text style={styles.linkText}>About Us</Text>
                      <Text style={styles.linkSubText}>App info &amp; team</Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <View style={styles.separator} />

                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push("/privacy")}
                  >
                    <View style={styles.linkIconWrapper}>
                      <Shield size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.linkTextGroup}>
                      <Text style={styles.linkText}>Privacy Policy</Text>
                      <Text style={styles.linkSubText}>
                        How we use your data
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Account Deletion */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: "#FF4D4D" }]}>
                  ACCOUNT DELETION
                </Text>
                <View style={styles.deletionCard}>
                  <View style={styles.cautionBanner}>
                    <AlertTriangle size={16} color="#FF9800" />
                    <Text style={styles.cautionText}>
                      This action is permanent and cannot be undone. All your
                      data will be lost.
                    </Text>
                  </View>

                  <Text style={styles.deletionInstruction}>
                    Why are you leaving?
                  </Text>

                  {DELETION_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={styles.reasonRow}
                      onPress={() => setSelectedReason(reason)}
                    >
                      {/* Radio button style */}
                      <View
                        style={[
                          styles.radioOuter,
                          selectedReason === reason &&
                          styles.radioOuterSelected,
                        ]}
                      >
                        {selectedReason === reason && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.reasonText,
                          selectedReason === reason && styles.reasonTextActive,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.confirmInputWrapper}>
                    <Text style={styles.confirmLabel}>
                      Type DELETE to confirm
                    </Text>
                    <TextInput
                      style={styles.confirmInput}
                      value={deleteConfirmText}
                      onChangeText={setDeleteConfirmText}
                      placeholder="type DELETE here"
                      placeholderTextColor="#CCCCCC"
                      autoCapitalize="characters"
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.deleteSubmitBtn,
                      (selectedReason === "" ||
                        deleteConfirmText !== "DELETE") &&
                      styles.deleteSubmitBtnDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={
                      selectedReason === "" ||
                      deleteConfirmText !== "DELETE" ||
                      deletionLoading
                    }
                  >
                    <Text
                      style={[
                        styles.deleteSubmitText,
                        (selectedReason === "" ||
                          deleteConfirmText !== "DELETE") && { color: "#CCC" },
                      ]}
                    >
                      {deletionLoading ? "Processing..." : "Delete My Account"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#FF4D4D" size={20} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0EEE9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 20,
    paddingTop: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E8E6E1",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    gap: 6,
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#9CA3AF",
  },
  activeTabText: {
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  // Section label (uppercase small caps style)
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  // Badges
  badgesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  badgeItem: {
    width: (width - 112) / 3,
    alignItems: "center",
  },
  // Planner achieved: black app-icon style card
  plannerAchievedCard: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  plannerRibbonTab: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 40,
    height: 16,
    backgroundColor: "#3A3A3A",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  plannerMedalCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  // Planner locked: light grey card with grey circle
  plannerLockedCard: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  plannerLockedCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  // Calorie badge card
  calorieCard: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  calorieCardAchieved: {
    backgroundColor: "#FFF0ED",
  },
  badgeMilestone: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#9E9E9E",
  },
  badgeType: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: "#BBBBBB",
    marginTop: 2,
  },
  // Settings card
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  settingsCardTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  unitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F0F4FF",
    borderLeftWidth: 1,
    borderLeftColor: "#E0E8FF",
  },
  unitBadgeWide: {
    paddingHorizontal: 10,
  },
  unitText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  updateBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.primary,
  },
  updateBtnInner: {
    padding: 16,
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  updateBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  // Links / support
  linksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  linkIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F4F2ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkTextGroup: {
    flex: 1,
  },
  toggleTextGroup: {
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  linkSubText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  // Deletion
  deletionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cautionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,243,224,0.9)",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 18,
  },
  cautionText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: "#E65100",
    flex: 1,
    lineHeight: 17,
  },
  deletionInstruction: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: 12,
  },
  // Radio button
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  reasonTextActive: {
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  confirmInputWrapper: {
    marginTop: 16,
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  confirmInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  deleteSubmitBtn: {
    backgroundColor: "#FF8FAB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteSubmitBtnDisabled: {
    backgroundColor: "#FFD6E0",
  },
  deleteSubmitText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: "#FF4D4D",
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});