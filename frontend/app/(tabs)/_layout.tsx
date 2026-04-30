import { Tabs, useRouter, useRootNavigationState } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { HapticTab } from "@/components/haptic-tab";
import { Fonts } from "@/src/theme/colors";
import useColorScheme from "@/hooks/use-color-scheme";
import { useTaskStore } from "@/src/store/useTaskStore";
import { iapService } from "@/src/services/iapService";

const TAB_ICONS = {
  index: require("@/assets/images/navigation_icon/navigation_home_icon.png"),
  planner: require("@/assets/images/navigation_icon/planner_navigation_icon.png"),
  calorie: require("@/assets/images/navigation_icon/calori_ai_navigation_icon.png"),
  templates: require("@/assets/images/navigation_icon/templates_navigation_icon.png"),
  insights: require("@/assets/images/navigation_icon/insights_navigation_icon.png"),
};

function TabIcon({
  name,
  focused,
  title,
}: {
  name: keyof typeof TAB_ICONS;
  focused: boolean;
  title: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Image
        source={TAB_ICONS[name]}
        style={styles.tabIcon}
        tintColor={focused ? "#3B82F6" : "#1D1A23"}
        contentFit="contain"
      />
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const session = useTaskStore((state) => state.session);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const rootNavigationState = useRootNavigationState();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        // Let the navigator show our custom label inside tabBarIcon
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        // Give tabBarIcon a generous size so the wrapper can be taller
        tabBarIconStyle: { width: "100%", height: "100%" } as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="index" focused={focused} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="planner" focused={focused} title="Planner" />
          ),
        }}
      />
      <Tabs.Screen
        name="calorie"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calorie" focused={focused} title="Calorie Ai" />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="templates" focused={focused} title="Templates" />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="insights" focused={focused} title="Insights" />
          ),
        }}
      />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 80;

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 40,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    // Border instead of shadow border
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    paddingTop: 0,
    paddingBottom: 0,
    // ⚠️ NO overflow:hidden — clips shadow on Android and clips content
  },

  // Each tap target fills the full height of the bar
  tabBarItem: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
    marginVertical: 0,
  },

  // The pill-shaped icon+label wrapper
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: "#DDE5FF",
  },

  tabIcon: {
    width: 24,
    height: 24,
  },

  tabLabel: {
    fontSize: 11,
    color: "#1D1A23",
    fontFamily: Fonts.medium,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#3B82F6",
    fontFamily: Fonts.bold,
  },
});
