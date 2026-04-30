import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LocofyTheme } from "../theme/locofyTheme";
import Svg, { Circle } from "react-native-svg";

export type LocofyProgressCardProps = {
  percentage: number;
  label: string;
  subLabel: string;
  colors?: string[];
};

const LocofyProgressCard = ({
  percentage,
  label,
  subLabel,
  colors = ["#0bb3ff", LocofyTheme.Colors.colorDarkorange],
}: LocofyProgressCardProps) => {
  const radius = 35;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <LinearGradient style={styles.container} locations={[0, 1]} colors={colors}>
      <View style={styles.chartContainer}>
        <Svg height={radius * 2} width={radius * 2}>
          {/* Background Circle */}
          <Circle
            stroke="rgba(255, 255, 255, 0.2)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Circle */}
          <Circle
            stroke="#fff"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </Svg>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subLabel}>{subLabel}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 181,
    borderRadius: LocofyTheme.Border.br_16,
    padding: LocofyTheme.Padding.padding_16,
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: LocofyTheme.Colors.primaryBaseWhite,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  percentageText: {
    position: "absolute",
    fontSize: LocofyTheme.FontSize.fs_16,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    fontWeight: "800",
    color: LocofyTheme.Colors.colorGray400,
  },
  textContainer: {
    gap: 4,
  },
  label: {
    fontSize: LocofyTheme.FontSize.fs_20,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    fontWeight: "800",
    color: LocofyTheme.Colors.colorGray400,
  },
  subLabel: {
    fontSize: LocofyTheme.FontSize.fs_12,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    color: LocofyTheme.Colors.colorGray200,
  },
});

export default LocofyProgressCard;
