import React, { useState } from "react";
import { View, Button } from "react-native";
import Circles from "./Circles";
import Mesh from "./Mesh";
import Neumorphism from "./Neumorphism";

type Size = {
  width: number;
  height: number;
};

type Show = "Circles" | "Mesh" | "Neumorphism";

export default function App() {
  const [size, setSize] = useState<Size>();
  const [show, setShow] = useState<Show>();

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onLayout={({
          nativeEvent: {
            layout: { width, height },
          },
        }) => setSize({ width, height })}
      >
        {size && show === "Circles" ? (
          <>
            <Circles size={size} />
          </>
        ) : null}
        {size && show === "Mesh" ? (
          <>
            <Mesh size={size} />
          </>
        ) : null}
        {size && show === "Neumorphism" ? (
          <>
            <Neumorphism />
          </>
        ) : null}
        {size && !show ? <View style={{ flex: 1 }} /> : null}
      </View>
      <Button title="Circles" onPress={() => setShow("Circles")} />
      <Button title="Mesh" onPress={() => setShow("Mesh")} />
      <Button title="Neumorphism" onPress={() => setShow("Neumorphism")} />
      <Button title="" onPress={() => {}} />
    </View>
  );
}
