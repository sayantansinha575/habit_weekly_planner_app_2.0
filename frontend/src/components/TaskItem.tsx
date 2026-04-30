import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, Flame } from "lucide-react-native";
import { Colors, Fonts } from "../theme/colors";

export interface TaskItemProps {
  title: string;
  isCompleted: boolean;
  scheduledDate?: string | Date;
  scheduledTime?: string;
  isAutoRolled?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const TaskItem = ({
  title,
  isCompleted,
  scheduledDate,
  scheduledTime,
  isAutoRolled,
  onToggle,
  onEdit,
  isSelectionMode,
  isSelected,
  onSelect,
}: TaskItemProps) => {
  const formatTaskDate = () => {
    if (!scheduledDate) return "";
    const date = new Date(scheduledDate);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();

    let timeDisplay = "";
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      timeDisplay = `, ${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    return `${month} ${day}${timeDisplay}`;
  };

  const displayText = formatTaskDate();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.statusIndicator,
          isCompleted
            ? styles.statusIndicatorDone
            : styles.statusIndicatorPending,
        ]}
      />
      <View style={styles.leftSection}>
        {isSelectionMode ? (
          <TouchableOpacity
            onPress={onSelect}
            style={styles.selectionIndicator}
          >
            {isSelected ? (
              <CheckCircle2 color={Colors.primary} size={24} />
            ) : (
              <Circle color={Colors.border} size={24} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onToggle}
            style={[styles.taskToggle, isCompleted && styles.taskToggleActive]}
          >
            <View
              style={[
                styles.taskToggleDot,
                isCompleted && styles.taskToggleDotActive,
              ]}
            />
          </TouchableOpacity>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isCompleted && styles.completedText]}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            {displayText ? (
              <Text style={styles.timeText}>{displayText}</Text>
            ) : null}
            {isAutoRolled && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.rolledText}>Auto-rolled</Text>
              </>
            )}
            <View style={styles.metaDot} />
            <View
              style={[
                styles.statusTag,
                isCompleted ? styles.statusTagDone : styles.statusTagPending,
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  isCompleted
                    ? styles.statusTagTextDone
                    : styles.statusTagTextPending,
                ]}
              >
                {isCompleted ? "Done" : "Pending"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Flame color={isCompleted ? Colors.success : "#E0E0E0"} size={20} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    paddingLeft: 22,
    borderRadius: 24,
    marginVertical: 6,
    height: 85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  statusIndicatorDone: {
    backgroundColor: "#63D568",
  },
  statusIndicatorPending: {
    backgroundColor: "#3B82F6",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectionIndicator: {
    marginRight: 12,
  },
  taskToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    padding: 2,
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
    marginLeft: 20,
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    color: "#1C1C1C",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#8D8D8D",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#8D8D8D",
    fontFamily: Fonts.regular,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0BB3FF",
    marginHorizontal: 8,
  },
  rolledText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusTagDone: {
    backgroundColor: "#E8F5E9",
  },
  statusTagPending: {
    backgroundColor: "#E3F2FD",
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  statusTagTextDone: {
    color: "#4CAF50",
  },
  statusTagTextPending: {
    color: "#2196F3",
  },
});

export default TaskItem;
