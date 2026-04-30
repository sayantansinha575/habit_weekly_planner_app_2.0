import * as React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { LocofyTheme } from "../theme/locofyTheme";
import { LucideIcon, Cloud, Wifi, Battery, Signal } from "lucide-react-native";

export type LocofyHeaderProps = {
  username?: string;
  temperature?: string;
  weatherStatus?: string;
  location?: string;
};

const LocofyHeader = ({
  username = "Alexa",
  temperature = "25°",
  weatherStatus = "Cloudy",
  location = "Haridwar",
}: LocofyHeaderProps) => {
  return (
    <View style={styles.systemArea}>
      <View style={styles.statusBar}>
        <View style={styles.time}>
          <Text style={styles.timeText}>9:41</Text>
        </View>
        <View style={styles.levels}>
          <Signal size={16} color={LocofyTheme.Colors.labelsPrimary} />
          <Wifi size={16} color={LocofyTheme.Colors.labelsPrimary} />
          <Battery size={20} color={LocofyTheme.Colors.labelsPrimary} />
        </View>
      </View>

      <View style={styles.applicationSpace}>
        <View style={styles.greetingSection}>
          <Image
            style={styles.profileAvatar}
            contentFit="cover"
            source={require("../../assets/avatar.png")}
          />
          <View style={styles.greetingTextContainer}>
            <Text style={styles.goodMorningText}>
              Good morning, {username} 👋
            </Text>
            <Text style={styles.welcomeBackText}>Welcome Back</Text>
          </View>
        </View>

        <Pressable style={styles.weatherCard}>
          <Text style={styles.tempText}>{temperature}</Text>
          <View style={styles.divider} />
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherStatus}>{weatherStatus}</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  systemArea: {
    paddingTop: 10,
    width: "100%",
    paddingHorizontal: LocofyTheme.Padding.padding_20,
  },
  statusBar: {
    height: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: LocofyTheme.FontSize.fs_17,
    fontFamily: LocofyTheme.FontFamily.sFPro,
    fontWeight: "600",
    color: LocofyTheme.Colors.labelsPrimary,
  },
  levels: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  applicationSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  greetingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingTextContainer: {
    justifyContent: "center",
  },
  goodMorningText: {
    fontSize: LocofyTheme.FontSize.fs_14,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    fontWeight: "500",
    color: LocofyTheme.Colors.dark,
  },
  welcomeBackText: {
    fontSize: LocofyTheme.FontSize.fs_12,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    color: LocofyTheme.Colors.dark,
    opacity: 0.7,
  },
  weatherCard: {
    flexDirection: "row",
    backgroundColor: LocofyTheme.Colors.colorGhostwhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  tempText: {
    fontSize: LocofyTheme.FontSize.fs_20,
    fontFamily: LocofyTheme.FontFamily.dMSans,
    fontWeight: "500",
    color: LocofyTheme.Colors.labelsPrimary,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: LocofyTheme.Colors.colorLightgray,
  },
  weatherDetails: {
    justifyContent: "center",
  },
  weatherStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: LocofyTheme.Colors.colorDodgerblue,
  },
  locationText: {
    fontSize: 10,
    color: LocofyTheme.Colors.colorGray200,
  },
});

export default LocofyHeader;
