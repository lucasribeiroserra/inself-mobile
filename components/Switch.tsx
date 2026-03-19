import React from "react";
import { Pressable, View } from "react-native";

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 20;
const PADDING = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_OFF = PADDING;
const THUMB_ON = TRACK_WIDTH - THUMB_SIZE - PADDING;

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  trackClass?: string;
  thumbClass?: string;
};

export default function Switch({ value, onValueChange, trackClass = "", thumbClass = "" }: Props) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
      className={`rounded-full ${value ? "bg-primary" : "bg-muted"} ${trackClass}`}
    >
      <View
        style={{
          position: "absolute",
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          top: PADDING,
          left: value ? THUMB_ON : THUMB_OFF,
          backgroundColor: "#fff",
        }}
        className={thumbClass}
      />
    </Pressable>
  );
}
