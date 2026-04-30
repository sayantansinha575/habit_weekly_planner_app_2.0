import * as React from "react";
import { StyleSheet, Text, View, Switch, Pressable } from "react-native";
import { LocofyTheme } from "../theme/locofyTheme";

export type LocofyTaskItemProps = {
  id: string;
  title: string;
  time: string;
  status: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onLongPress?: (id: string) => void;
  onPress?: (id: string) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  priorityColor?: string;
};

const LocofyTaskItem = ({
  id,
  title,
  time,
  status,
  completed,
  onToggle,
  onLongPress,
  onPress,
  isSelected,
  selectionMode,
  priorityColor = LocofyTheme.Colors.colorLightgreen,
}: LocofyTaskItemProps) => {
  return (
    <Pressable
      onPress={() => (selectionMode ? onPress?.(id) : null)}
      onLongPress={() => onLongPress?.(id)}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      {/* Selection Border Indicator (Left) */}
      <View style={[styles.indicator, { backgroundColor: priorityColor }]} />

      <View style={styles.contentRow}>
        <Switch
          value={completed}
          onValueChange={() => onToggle(id)}
          thumbColor="#fff"
          trackColor={{ false: "#939393", true: "#63d568" }}
        />

        <View style={styles.taskInfo}>
          <Text style={[styles.title, completed && styles.completedTitle]}>
            {title}
          </Text>
          <View style={styles.subInfo}>
            <Text style={styles.timeText}>{time}</Text>
            <View style={styles.dot} />
            <View
              style={[
                styles.badge,
                status.toLowerCase() === "done"
                  ? styles.doneBadge
                  : styles.urgentBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  status.toLowerCase() === "done"
                    ? styles.doneBadgeText
                    : styles.urgentBadgeText,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* Highlighting Emoji */}
        <Text style={styles.emoji}>🔥</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: LocofyTheme.Colors.primaryBaseWhite,
    borderRadius: LocofyTheme.Border.br_16,
    padding: LocofyTheme.Padding.padding_16,
    marginBottom: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  selectedContainer: {
    borderColor: LocofyTheme.Colors.colorDodgerblue,
    borderWidth: 2,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: 25,
    width: 2,
    height: 27,
    borderRadius: 20,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: LocofyTheme.FontSize.fs_14,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    fontWeight: "600",
    color: LocofyTheme.Colors.dark,
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: LocofyTheme.Colors.colorGray100,
  },
  subInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: LocofyTheme.FontSize.fs_12,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    color: LocofyTheme.Colors.dark,
    opacity: 0.6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: LocofyTheme.Colors.colorDodgerblue,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 40,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: LocofyTheme.FontFamily.dMSans,
  },
  doneBadge: {
    backgroundColor: LocofyTheme.Colors.colorHoneydew,
  },
  doneBadgeText: {
    color: LocofyTheme.Colors.colorLightgreen,
  },
  urgentBadge: {
    backgroundColor: "#FFEBEB",
  },
  urgentBadgeText: {
    color: "#FF4D4D",
  },
  emoji: {
    fontSize: 24,
  },
});

export default LocofyTaskItem;
