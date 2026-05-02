import CalorieProgress from "@/src/components/CalorieProgress";
import Card from "@/src/components/Card";
import CustomSplashScreen from "@/src/components/CustomSplashScreen";
import EmptyState from "@/src/components/EmptyState";
import ProgressRing from "@/src/components/ProgressRing";
import ScannerOverlay from "@/src/components/ScannerOverlay";
import { api } from "@/src/services/api";
import { Colors, Fonts } from "@/src/theme/colors";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Flame,
  Image as LucideImage,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TrendingUp,
  Zap
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

type ViewState = "dashboard" | "onboarding" | "profile" | "add-meal";

import { useTaskStore } from "@/src/store/useTaskStore";

// --- Conversion Utilities ---
const lbsToKg = (lbs: string) => {
  const val = parseFloat(lbs);
  return isNaN(val) ? 0 : Math.round((val / 2.20462) * 10) / 10;
};
const kgToLbs = (kg: number | string) => {
  const val = typeof kg === "string" ? parseFloat(kg) : kg;
  return isNaN(val) ? "" : Math.round(val * 2.20462).toString();
};

const ftInToCm = (ftIn: string) => {
  const match = ftIn.match(/(\d+)'(\d+)/);
  if (!match) return 0;
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

const cmToFtIn = (cm: number | string) => {
  const val = typeof cm === "string" ? parseFloat(cm) : cm;
  if (isNaN(val)) return "6'10";
  const totalInches = val / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}`;
};

export default function CalorieScreen() {
  const calAiProfile = useTaskStore((s) => s.calAiProfile);
  const calAiDashboard = useTaskStore((s) => s.calAiDashboard);
  const calAiLoading = useTaskStore((s) => s.calAiLoading);
  const loadCalAiData = useTaskStore((s) => s.loadCalAiData);
  const hasCalAiLoaded = useTaskStore((s) => s.hasCalAiLoaded);
  const setCalAiLoaded = useTaskStore((s) => s.setCalAiLoaded);
  const user = useTaskStore((s) => s.user);
  const calorieProgress = useTaskStore((s) => s.calorieProgress);
  const loadCalAiProgress = useTaskStore((s) => s.loadCalAiProgress);
  const subscriptionStatus = useTaskStore((s) => s.subscriptionStatus);
  const isAuthReady = useTaskStore((s) => s.isAuthReady);
  const isSubscriptionLoading = useTaskStore((s) => s.isSubscriptionLoading);

  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewState | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dashboardPageIndex, setDashboardPageIndex] = useState(0);
  const horizontalPagerRef = useRef<ScrollView>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Generate 7-day window anchored to selectedDate's week (Mon–Sun)
  const weekDays = React.useMemo(() => {
    const days = [];
    const ref = new Date(selectedDate);
    const dayOfWeek = ref.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    ref.setDate(ref.getDate() + diffToMon);
    for (let i = 0; i < 7; i++) {
      const d = new Date(ref);
      d.setDate(ref.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Form State for Onboarding/Profile
  const [formData, setFormData] = useState({
    goalWeight: "",
    currentWeight: "",
    height: "6'10",
    dateOfBirth: "1995-01-01",
    gender: "Male",
    dailyStepGoal: "10000",
    weightUnit: "lbs" as "lbs" | "kg",
    heightUnit: "ft'in" as "ft'in" | "cm",
  });

  // Add Meal State
  const [mealDescription, setMealDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const loadingFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (currentView === "add-meal" && !permission?.granted) {
      requestPermission();
    }
  }, [currentView, permission?.granted]);

  useEffect(() => {
    if (currentView === "add-meal") {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      scanLoop.start();
      return () => scanLoop.stop();
    }
  }, [currentView, scanLineAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim]);

  const handleScannerCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });
      if (photo) {
        setSelectedImage(photo.uri);
        setImageBase64(photo.base64 || null);
      }
    } catch (e) {
      console.error("Capture failed:", e);
      Alert.alert("Error", "Failed to capture photo");
    }
  };

  const handlePress = () => {
    if (!isAuthReady || isSubscriptionLoading) {
      console.log("⏳ Still initializing, ignore tap");
      return <CustomSplashScreen />;
    }

    if (subscriptionStatus === "FREE") {
      router.push("/subscription");
    } else {
      setCurrentView("add-meal");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentView !== "dashboard" && currentView !== "onboarding") {
          setCurrentView("dashboard");
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [currentView]),
  );

  const [activeDays, setActiveDays] = useState(7);

  const fetchProgressData = useCallback(
    async (days: number) => {
      if (!user?.id) return;
      setActiveDays(days);
      setChartLoading(true);
      await loadCalAiProgress(user.id, days);
      setChartLoading(false);
    },
    [user?.id, loadCalAiProgress],
  );

  useEffect(() => {
    if (user?.id) {
      loadCalAiData(user.id);
    }
  }, [user?.id, loadCalAiData]);

  useEffect(() => {
    if (hasCalAiLoaded && !calAiLoading) {
      if (calAiProfile) {
        if (currentView === null || currentView === "onboarding") {
          setCurrentView("dashboard");
        }
      } else {
        if (currentView === null || currentView === "dashboard") {
          setCurrentView("onboarding");
        }
      }
    }
  }, [hasCalAiLoaded, calAiLoading, calAiProfile, currentView]);

  useEffect(() => {
    if (
      calAiProfile &&
      (currentView === "profile" || currentView === "onboarding")
    ) {
      const newGoalWeight = kgToLbs(calAiProfile.goalWeight);
      const newCurrentWeight = kgToLbs(calAiProfile.currentWeight);
      const newHeight = cmToFtIn(calAiProfile.height);
      const newDob = new Date(calAiProfile.dateOfBirth)
        .toISOString()
        .split("T")[0];
      const newStepGoal = calAiProfile.dailyStepGoal?.toString() || "10000";

      if (
        formData.goalWeight !== newGoalWeight ||
        formData.currentWeight !== newCurrentWeight ||
        formData.height !== newHeight ||
        formData.dateOfBirth !== newDob ||
        formData.gender !== calAiProfile.gender ||
        formData.dailyStepGoal !== newStepGoal
      ) {
        setFormData((prev) => ({
          ...prev,
          goalWeight: newGoalWeight,
          currentWeight: newCurrentWeight,
          height: newHeight,
          dateOfBirth: newDob,
          gender: calAiProfile.gender,
          dailyStepGoal: newStepGoal,
        }));
      }
    }
  }, [calAiProfile, currentView, formData]);

  useEffect(() => {
    if (isOnboardingLoading) {
      Animated.parallel([
        Animated.timing(loadingFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(loadingRotation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    } else {
      Animated.timing(loadingFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnboardingLoading]);

  const isFormValid =
    formData.goalWeight.trim() !== "" &&
    formData.currentWeight.trim() !== "" &&
    formData.height.trim() !== "" &&
    formData.dailyStepGoal.trim() !== "";

  useEffect(() => {
    if (user?.id && currentView === "dashboard") {
      fetchProgressData(activeDays);
    }
  }, [user?.id, activeDays, fetchProgressData, currentView]);

  const handleSaveProfile = async () => {
    if (!isFormValid) return;

    try {
      setIsOnboardingLoading(true);

      const goalWeightKg =
        formData.weightUnit === "lbs"
          ? lbsToKg(formData.goalWeight)
          : parseFloat(formData.goalWeight);

      const currentWeightKg =
        formData.weightUnit === "lbs"
          ? lbsToKg(formData.currentWeight)
          : parseFloat(formData.currentWeight);

      const heightCm =
        formData.heightUnit === "ft'in"
          ? ftInToCm(formData.height).toString()
          : formData.height;

      const payload = {
        goalWeight: goalWeightKg,
        currentWeight: currentWeightKg,
        height: heightCm,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
      };

      const [updated] = await Promise.all([
        api.updateCalAiProfile(user.id, payload),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      await loadCalAiData(user.id);

      Animated.timing(screenFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        loadCalAiData(user.id);
        setCurrentView("dashboard");
        setIsOnboardingLoading(false);
        Animated.timing(screenFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } catch (e) {
      setIsOnboardingLoading(false);
      Alert.alert("Error", "Failed to save profile");
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealDescription && !imageBase64) {
      Alert.alert("Input required", "Please add a description or a photo");
      return;
    }
    try {
      setIsScanning(true);
      await api.analyzeMeal(user.id, mealDescription, imageBase64 || undefined);
      setMealDescription("");

      setTimeout(async () => {
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(async () => {
          setSelectedImage(null);
          setImageBase64(null);
          await loadCalAiData(user.id);
          setCurrentView("dashboard");
          setIsScanning(false);
          Animated.timing(screenFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });
      }, 1000);
    } catch (e) {
      setIsScanning(false);
      Alert.alert("Error", "Failed to analyze meal");
    }
  };

  const handleResetTarget = async () => {
    Alert.alert(
      "Reset Target",
      "Are you sure you want to clear today's meals and start a new target?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await api.resetCalAiDashboard(user.id);
              await loadCalAiData(user.id);
            } catch (e) {
              Alert.alert("Error", "Failed to reset");
            }
          },
        },
      ],
    );
  };

  if (calAiLoading && !calAiProfile && currentView === "dashboard") {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color={Colors.card} />
        <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
          Loading data...
        </Text>
      </View>
    );
  }

  // --- Sub-Views ---

  const renderOnboarding = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.onboardingContent}
    >
      <Text style={styles.onboardingTitle}>Welcome to Calorie AI</Text>
      <Text style={styles.onboardingSubtitle}>
        Let's set up your personal nutrition profile.
      </Text>

      <Card style={styles.formCard}>
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Goal Weight ({formData.weightUnit})
          </Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "lbs" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "lbs" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "lbs" && styles.unitBtnTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "kg" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "kg" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "kg" && styles.unitBtnTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={formData.weightUnit === "lbs" ? "e.g. 154" : "e.g. 70"}
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Current Weight ({formData.weightUnit})
          </Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={formData.weightUnit === "lbs" ? "e.g. 187" : "e.g. 85"}
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>Height ({formData.heightUnit})</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "ft'in" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "ft'in" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "ft'in" && styles.unitBtnTextActive,
                ]}
              >
                ft'in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "cm" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "cm" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "cm" && styles.unitBtnTextActive,
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={
            formData.heightUnit === "ft'in" ? "e.g. 6'10" : "e.g. 180"
          }
          keyboardType={formData.heightUnit === "cm" ? "numeric" : "default"}
          value={formData.height}
          onChangeText={(val) => setFormData({ ...formData, height: val })}
        />

        <Text style={styles.inputLabel}>Daily Step Goal</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10000"
          keyboardType="numeric"
          value={formData.dailyStepGoal}
          onChangeText={(val) =>
            setFormData({ ...formData, dailyStepGoal: val })
          }
        />

        <TouchableOpacity
          style={[styles.primaryBtn, !isFormValid && styles.disabledBtn]}
          onPress={handleSaveProfile}
          disabled={!isFormValid}
        >
          <Text
            style={[
              styles.primaryBtnText,
              !isFormValid && styles.disabledBtnText,
            ]}
          >
            Get Started
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderDashboard = () => (
    <View style={styles.mainContainer}>

      {/* ── Fixed Header ── */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.dashHeader}>
          <View style={styles.titleRow}>
            <View style={styles.lightningCircle}>
              <Zap color="#3B82F6" fill="#3B82F6" size={20} />
            </View>
            <View>
              <Text style={styles.dashTitle}>Calorie AI</Text>
              <Text style={styles.dashSubtitleText}>Nutrition Tracker</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Flame color="#FF6B35" fill="#FF6B35" size={18} />
            <Text style={styles.streakText}>
              {calAiDashboard?.streak || 0}
            </Text>
          </View>
        </View>

        {/* Month label + arrows */}
        <View style={styles.calendarHeader}>
          <Text style={styles.monthLabel}>
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
          </Text>
          <View style={styles.arrowRow}>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 7);
                setSelectedDate(prev);
              }}
            >
              <ChevronLeft size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 7);
                setSelectedDate(next);
              }}
            >
              <ChevronRight size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStrip}
        >
          {weekDays.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = date.getDate().toString();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayCell, isSelected && styles.daySelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.calDayName, isSelected && styles.calDayNameSel]}>
                  {dayName}
                </Text>
                <Text style={[styles.calDayNum, isSelected && styles.calDayNumSel]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Horizontal Pager ── */}
      <ScrollView
        ref={horizontalPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalPager}
        contentOffset={{ x: dashboardPageIndex * width, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setDashboardPageIndex(index);
        }}
      >
        {/* Page 1: Main Dashboard */}
        <ScrollView
          style={[styles.scrollContainer, { width }]}
          contentContainerStyle={styles.dashboardContent}
        >
          {/* TODAY'S BUDGET Section */}
          <Text style={styles.sectionLabel}>TODAY'S BUDGET</Text>
          {calAiDashboard && calAiDashboard.caloriesLeft <= 0 ? (
            <View style={styles.celebrationContainer}>
              <LinearGradient
                colors={["rgba(252, 163, 17, 0.2)", "rgba(255, 69, 0, 0.2)"]}
                style={styles.celebrationGradient}
              >
                <TrendingUp color={Colors.secondary} size={48} />
                <Text style={styles.celebrationTitle}>Goal Reached! 🥳</Text>
                <Text style={styles.celebrationText}>
                  You've completed your daily target. Amazing job!
                </Text>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={handleResetTarget}
                >
                  <Text style={styles.resetBtnText}>Start New Target</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.budgetCard}>
              <LinearGradient
                colors={["#0D1B2A", "#1A2D42"]}
                style={styles.budgetCardGradient}
              >
                {/* Left: calorie count */}
                <View style={styles.budgetLeft}>
                  <View style={styles.budgetCalorieRow}>
                    <Text style={styles.budgetCalorieNumber}>
                      {calAiDashboard ? Math.max(0, calAiDashboard.caloriesLeft) : "0"}
                    </Text>
                    <Text style={styles.budgetCalorieLabel}> Calories Left</Text>
                  </View>
                  <Text style={styles.budgetGoalText}>
                    Goal:{" "}
                    <Text style={styles.budgetGoalHighlight}>
                      {calAiDashboard?.dailyTarget || 2500} kcal
                    </Text>
                    {" · "}
                    {calAiDashboard
                      ? Math.round(((calAiDashboard.dailyTarget - calAiDashboard.caloriesLeft) / calAiDashboard.dailyTarget) * 100)
                      : 0}
                    % used
                  </Text>
                </View>

                {/* Right: ring */}
                <View style={styles.budgetRight}>
                  <ProgressRing
                    progress={
                      calAiDashboard
                        ? Math.min(1, Math.max(0,
                          1 - calAiDashboard.caloriesLeft / (calAiDashboard.dailyTarget || 2500),
                        ))
                        : 0
                    }
                    size={80}
                    strokeWidth={7}
                    color="#FF6B35"
                    trackColor="rgba(255,255,255,0.15)"
                  >
                    <Flame color="#FF6B35" fill="#FF6B35" size={22} />
                  </ProgressRing>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* TODAY PROGRESS section */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>TODAY PROGRESS</Text>
          <View style={styles.macroRow}>
            {/* Protein */}
            <View style={styles.macroCard}>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(1, (calAiDashboard.totalProtein || 0) / (calAiDashboard.proteinTarget || 150))
                    : 0
                }
                size={72}
                strokeWidth={5}
                color="#E05A5A"
                trackColor="#F5E8E8"
              >
                {/* Icon placeholder — replace with actual emoji/image */}
                <Image style={{ width: 22, height: 22 }} resizeMode="contain" source={require("../../assets/images/icons_home_screen/protien.svg")} />
              </ProgressRing>
              <Text style={styles.macroCardValue}>
                {Math.max(0, (calAiDashboard?.proteinTarget || 150) - (calAiDashboard?.totalProtein || 0))}g
              </Text>
              <Text style={styles.macroCardName}>Protein</Text>
              <View style={[styles.macroPercentBadge, { backgroundColor: "#FDE8E8" }]}>
                <Text style={[styles.macroPercentText, { color: "#E05A5A" }]}>
                  {calAiDashboard
                    ? Math.round((1 - (calAiDashboard.totalProtein || 0) / (calAiDashboard.proteinTarget || 150)) * 100)
                    : 96}% left
                </Text>
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroCard}>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(1, (calAiDashboard.totalCarbs || 0) / (calAiDashboard.carbsTarget || 250))
                    : 0
                }
                size={72}
                strokeWidth={5}
                color="#3B82F6"
                trackColor="#E8F0FE"
              >
                <Image style={{ width: 22, height: 22 }} resizeMode="contain" source={require("../../assets/images/icons_home_screen/carbs.svg")} />

              </ProgressRing>
              <Text style={styles.macroCardValue}>
                {Math.max(0, (calAiDashboard?.carbsTarget || 250) - (calAiDashboard?.totalCarbs || 0))}g
              </Text>
              <Text style={styles.macroCardName}>Carbs</Text>
              <View style={[styles.macroPercentBadge, { backgroundColor: "#EBF2FF" }]}>
                <Text style={[styles.macroPercentText, { color: "#3B82F6" }]}>
                  {calAiDashboard
                    ? Math.round((1 - (calAiDashboard.totalCarbs || 0) / (calAiDashboard.carbsTarget || 250)) * 100)
                    : 96}% left
                </Text>
              </View>
            </View>

            {/* Fats */}
            <View style={styles.macroCard}>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(1, (calAiDashboard.totalFats || 0) / (calAiDashboard.fatsTarget || 70))
                    : 0
                }
                size={72}
                strokeWidth={5}
                color="#F59E0B"
                trackColor="#FEF3E0"
              >
                <Image style={{ width: 22, height: 22 }} resizeMode="contain" source={require("../../assets/images/icons_home_screen/fats.svg")} />
              </ProgressRing>
              <Text style={styles.macroCardValue}>
                {Math.max(0, (calAiDashboard?.fatsTarget || 70) - (calAiDashboard?.totalFats || 0))}g
              </Text>
              <Text style={styles.macroCardName}>Fats</Text>
              <View style={[styles.macroPercentBadge, { backgroundColor: "#FEF5E0" }]}>
                <Text style={[styles.macroPercentText, { color: "#F59E0B" }]}>
                  {calAiDashboard
                    ? Math.round((1 - (calAiDashboard.totalFats || 0) / (calAiDashboard.fatsTarget || 70)) * 100)
                    : 96}% left
                </Text>
              </View>
            </View>
          </View>

          {/* Swipe for Progress pill */}
          <TouchableOpacity
            style={styles.swipePill}
            onPress={() => {
              horizontalPagerRef.current?.scrollTo({ x: width, animated: true });
              setDashboardPageIndex(1);
            }}
          >
            <Text style={styles.swipePillText}>Swipe for Progress</Text>
            <View style={styles.swipeArrows}>
              <ChevronRight size={14} color="#22C55E" />
              <ChevronRight size={14} color="#22C55E" />
              <ChevronRight size={14} color="#22C55E" />
              <ChevronRight size={14} color="#22C55E" />
            </View>
          </TouchableOpacity>

          {/* Recent Meals header */}
          <View style={styles.recentMealsHeader}>
            <Text style={styles.recentMealsTitle}>Recent Meals</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Meal list */}
          {calAiDashboard?.meals && calAiDashboard.meals.length > 0 ? (
            calAiDashboard.meals.map((meal: any, idx: number) => {
              const borderColors = ["#22C55E", "#F59E0B", "#EF4444", "#3B82F6"];
              const borderColor = borderColors[idx % borderColors.length];
              return (
                <View key={meal.id} style={styles.mealCard}>
                  {/* Short rounded accent bar on left */}
                  <View style={[styles.mealAccentBar, { backgroundColor: borderColor }]} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealDesc}>{meal.description}</Text>
                    <View style={styles.mealMacroRow}>
                      <View style={[styles.mealMacroPill, { backgroundColor: "#FDE8E8" }]}>
                        <Text style={[styles.mealMacroPillText, { color: "#E05A5A" }]}>• P: {meal.protein}g</Text>
                      </View>
                      <View style={[styles.mealMacroPill, { backgroundColor: "#EBF2FF" }]}>
                        <Text style={[styles.mealMacroPillText, { color: "#3B82F6" }]}>• C: {meal.carbs}g</Text>
                      </View>
                      <View style={[styles.mealMacroPill, { backgroundColor: "#FEF5E0" }]}>
                        <Text style={[styles.mealMacroPillText, { color: "#F59E0B" }]}>• F: {meal.fats}g</Text>
                      </View>
                    </View>
                    <Text style={styles.mealTimeText}>
                      Today{meal.time ? ` · ${meal.time}` : ""} · {meal.mealType || "Meal"}
                    </Text>
                  </View>
                  <View style={styles.mealCalContainer}>
                    <Flame color="#FF6B35" fill="#FF6B35" size={15} />
                    <Text style={styles.mealCals}>{meal.calories} kcal</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              imageSource={require("@/assets/images/salad_bowl_3d.png")}
              message="Tap + to add your first meal of the day"
            />
          )}
        </ScrollView>

        {/* Page 2: Progress Section */}
        <View style={{ width }}>
          {calorieProgress ? (
            <CalorieProgress
              data={calorieProgress}
              activeDays={activeDays}
              loading={chartLoading}
              onFilterChange={fetchProgressData}
              onProfilePress={() => setCurrentView("profile")}
            />
          ) : (
            <View style={[styles.mainContainer, styles.center]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
                Loading progress...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handlePress}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </View>
  );

  const renderAddMeal = () => (
    <View style={styles.scannerContainer}>
      {/* Scanner Body: Live Camera or Selected Image */}
      <View style={styles.scannerBody}>
        {!selectedImage ? (
          permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
            />
          ) : (
            <View style={styles.permissionContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.permissionText}>Opening camera...</Text>
            </View>
          )
        ) : (
          <Image
            source={{ uri: selectedImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}

        {!selectedImage && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.8)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.scannerFrameContainer}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <Animated.View
                  style={[
                    styles.scannerScanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, width * 0.8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      <SafeAreaView
        style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
        pointerEvents="box-none"
      >
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            onPress={() => setCurrentView("dashboard")}
            style={styles.scannerBackBtn}
          >
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
          <Text style={styles.scannerTitleText}>Scanner</Text>
          <TouchableOpacity style={styles.scannerMoreBtn}>
            <MoreHorizontal color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        <View style={styles.scannerFooter}>
          <View style={styles.scannerModes}>
            <TouchableOpacity
              style={[styles.scannerModeItem, styles.activeModeItem]}
            >
              <View style={styles.modeIconCircle}>
                <Apple color="#000" size={20} />
              </View>
              <Text style={styles.activeModeText}>Scan food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scannerModeItem}
              onPress={pickImage}
            >
              <View
                style={[styles.modeIconCircle, { backgroundColor: "#FFF" }]}
              >
                <LucideImage color="#000" size={20} />
              </View>
              <Text style={styles.modeText}>Library</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scannerCaptureRow}>
            <View style={{ width: 44 }} />
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleScannerCapture}
            >
              <View style={styles.captureBtnInner}>
                <View style={styles.captureBtnCore} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyBtn} onPress={pickImage}>
              <View style={styles.historyBtnInner}>
                <LucideImage color="#FFF" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {selectedImage && (
        <View style={styles.analysisOverlay}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ width: "100%", gap: 12 }}>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleAnalyzeMeal}
            >
              <LinearGradient
                colors={[Colors.primary, "#24243e"]}
                style={styles.analyzeButtonGradient}
              >
                <Zap color="#FFF" size={20} />
                <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setSelectedImage(null);
                setImageBase64(null);
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderProfile = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.onboardingContent}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => setCurrentView("dashboard")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Calorie AI Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <Card style={styles.formCard}>
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Goal Weight ({formData.weightUnit})
          </Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "lbs" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "lbs" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "lbs" && styles.unitBtnTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "kg" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "kg" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "kg" && styles.unitBtnTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Current Weight ({formData.weightUnit})
          </Text>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>Height ({formData.heightUnit})</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "ft'in" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "ft'in" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "ft'in" && styles.unitBtnTextActive,
                ]}
              >
                ft'in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "cm" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "cm" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "cm" && styles.unitBtnTextActive,
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType={formData.heightUnit === "cm" ? "numeric" : "default"}
          value={formData.height}
          onChangeText={(val) => setFormData({ ...formData, height: val })}
        />

        <Text style={styles.inputLabel}>Daily Step Goal</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.dailyStepGoal}
          onChangeText={(val) =>
            setFormData({ ...formData, dailyStepGoal: val })
          }
        />

        <TouchableOpacity
          style={[styles.primaryBtn, calAiLoading && { opacity: 0.7 }]}
          onPress={handleSaveProfile}
          disabled={calAiLoading}
        >
          {calAiLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#EEECE8", "#F0EDE8", "#EDE9E4"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenFade }]}>
        {!currentView ? (
          <View style={[styles.mainContainer, styles.center]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {currentView === "dashboard" && renderDashboard()}
            {currentView === "onboarding" && renderOnboarding()}
            {currentView === "add-meal" && renderAddMeal()}
            {currentView === "profile" && renderProfile()}
          </>
        )}
      </Animated.View>

      {isOnboardingLoading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.loadingOverlay,
            { opacity: loadingFade },
          ]}
        >
          <LinearGradient
            colors={["#6366F1", "#A855F7", "#EC4899"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.loadingInner}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: loadingRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <RefreshCw color="#FFF" size={48} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Configuring Your Profile</Text>
            <Text style={styles.loadingSubtitle}>
              Personalizing your nutrition plan and setting your goals...
            </Text>
          </View>
        </Animated.View>
      )}

      <ScannerOverlay isVisible={isScanning} imageUri={selectedImage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#EEECE8",
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: "#EEECE8",
  },
  horizontalPager: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  onboardingContent: {
    padding: 24,
    paddingTop: 40,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  formCard: {
    padding: 20,
    backgroundColor: "transparent",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 0,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  inputHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unitBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  unitBtnTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  primaryBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    flexDirection: "row",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  disabledBtn: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  disabledBtnText: {
    color: Colors.textMuted,
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingInner: {
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    color: "#FFF",
    fontFamily: Fonts.bold,
    marginTop: 24,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontFamily: Fonts.regular,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
  },

  // ── Dashboard Styles ──
  dashboardContent: {
    padding: 20,
    paddingBottom: 140,
    backgroundColor: "#EEECE8",
  },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lightningCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  dashTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3B82F6",
    fontFamily: Fonts.bold,
    lineHeight: 26,
  },
  dashSubtitleText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },

  // Calendar
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  arrowRow: { flexDirection: "row", gap: 6 },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
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
    gap: 8,
    paddingRight: 20,
    marginBottom: 8,
  },
  dayCell: {
    width: 52,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  daySelected: {
    backgroundColor: "#1C1C1E",
    elevation: 6,
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  calDayName: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  calDayNameSel: { color: "rgba(255,255,255,0.6)" },
  calDayNum: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  calDayNumSel: { color: "#FFFFFF" },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: Fonts.bold,
    marginBottom: 10,
  },

  // Budget card
  budgetCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#0D1B2A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginBottom: 4,
  },
  budgetCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  budgetLeft: {
    flex: 1,
  },
  budgetCalorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  budgetCalorieNumber: {
    fontSize: 46,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    fontWeight: "900",
    lineHeight: 52,
  },
  budgetCalorieLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.regular,
    marginLeft: 4,
  },
  budgetGoalText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: Fonts.regular,
    marginTop: 6,
  },
  budgetGoalHighlight: {
    color: "#22C55E",
    fontFamily: Fonts.semiBold,
  },
  budgetRight: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },

  // Macro cards
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  macroCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 6,
  },
  macroCardValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
    marginTop: 4,
  },
  macroCardSubLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  macroCardName: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: Fonts.medium,
  },
  macroPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  macroPercentText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
  },

  // Swipe pill
  swipePill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  swipePillText: {
    fontSize: 14,
    color: "#1C1C1E",
    fontFamily: Fonts.medium,
  },
  swipeArrows: {
    flexDirection: "row",
    gap: -4,
  },

  // Recent meals
  recentMealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 12,
  },
  recentMealsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  viewAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontFamily: Fonts.medium,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mealAccentBar: {
    width: 4,
    height: 36,
    borderRadius: 4,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  mealDesc: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },
  mealMacroRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  mealMacroPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mealMacroPillText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
  },
  mealTimeText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Fonts.regular,
  },
  mealCalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 12,
  },
  mealCals: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: Fonts.bold,
  },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },

  // Celebration
  celebrationContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  celebrationGradient: {
    width: "100%",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(252, 163, 17, 0.3)",
  },
  celebrationTitle: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: 15,
  },
  celebrationText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  resetBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  // Modal header
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 23,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },

  // Scanner
  scannerBody: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: Platform.OS === "ios" ? 0 : 25,
  },
  scannerBackBtn: {
    padding: 8,
  },
  scannerMoreBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  scannerTitleText: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  scannerFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFF",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 32,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 32,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 32,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 32,
  },
  scannerScanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 3,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scannerFooter: {
    paddingBottom: 40,
  },
  scannerModes: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 30,
  },
  scannerModeItem: {
    width: 90,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  activeModeItem: {
    backgroundColor: "#DAF062",
  },
  modeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  modeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: "#666",
  },
  activeModeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: "#000",
  },
  scannerCaptureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
    padding: 4,
  },
  captureBtnCore: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#FF5E4D",
  },
  historyBtn: {
    padding: 10,
  },
  historyBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  analysisOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 2000,
  },
  analyzeButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  analyzeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  retakeButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  retakeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
});