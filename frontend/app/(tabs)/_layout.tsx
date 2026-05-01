import { Image } from "expo-image";
import { Tabs, useRootNavigationState, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import useColorScheme from "@/hooks/use-color-scheme";
import { useTaskStore } from "@/src/store/useTaskStore";
import { Fonts } from "@/src/theme/colors";

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
            <TabIcon name="calorie" focused={focused} title="Calorie AI" />
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

const TAB_BAR_HEIGHT = 65;

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 8,
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 14,
    borderTopWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginHorizontal: 20,
    width: undefined,
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
    minWidth: 58,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 26,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: "#E0E8FF",
  },

  tabIcon: {
    width: 22,
    height: 22,
  },

  tabLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontFamily: Fonts.medium,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#3B82F6",
    fontFamily: Fonts.bold,
  },
});
