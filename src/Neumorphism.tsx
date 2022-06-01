import React from "react";
import { Dimensions } from "react-native";
import type { SkiaValue } from "@shopify/react-native-skia";
import {
  Box,
  BoxShadow,
  Canvas,
  Circle,
  Fill,
  FitBox,
  Group,
  mix,
  rect,
  rrect,
  runTiming,
  useDerivedValue,
  useTouchHandler,
  useValue,
} from "@shopify/react-native-skia";

type RGB = [number, number, number];
type RGBA = [number, number, number, number];

const Theme = {
  whiteBackground: [240, 240, 243] as RGB,
  whiteForeground: [238, 238, 238] as RGB,
  shadowLight: [174, 174, 192] as RGB,
  shadowDark: [255, 255, 255] as RGB,
  dotOff: [238, 238, 238, 0] as RGBA,
  dotOn: [95, 242, 147, 0.2] as RGBA,
};

function rgb([r, g, b]: RGB) {
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

function rgba([r, g, b, a]: RGBA | RGB, a0?: number) {
  return `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${
    a0 ?? a
  })`;
}

function rgbMix(normal: number, color0: RGB | RGBA, color1: RGB | RGBA) {
  const r = Math.floor(mix(normal, color0[0], color1[0]));
  const g = Math.floor(mix(normal, color0[1], color1[1]));
  const b = Math.floor(mix(normal, color0[2], color1[2]));
  if (color0[3] !== undefined && color1[3] !== undefined) {
    const a = mix(normal, color0[3] ?? 1, color1[3] ?? 1);
    return rgba([r, g, b, a]);
  }
  return rgb([r, g, b]);
}

export default function Neumorphism() {
  const pressed = useValue(0);
  const onTouch = useTouchHandler({
    onStart: () => {
      runTiming(pressed, pressed.current > 0.5 ? 0 : 1, { duration: 150 });
    },
  });

  return (
    <Canvas style={{ flex: 1 }} onTouch={onTouch}>
      <Fill color={rgb(Theme.whiteBackground)} />
      <Switch pressed={pressed} />
    </Canvas>
  );
}

const { width: screenWidth } = Dimensions.get("window");
const PADDING = 8;
const width = screenWidth - PADDING * 2;
const x = screenWidth - PADDING * 2 - width;
const y = 0;

const FRAME = rect(0, 0, 48, 24);
const border = rrect(FRAME, 12, 12);
const container = rrect(rect(1, 1, 46, 22), 12, 12);
const dot = rrect(rect(6, 6, 12, 12), 12, 12);
const dotRadius = (dot.rect.width + dot.rect.height) / 4;

interface SwitchProps {
  pressed: SkiaValue<number>;
}

const Switch = ({ pressed }: SwitchProps) => {
  const transform = useDerivedValue(
    () => [{ translateX: mix(pressed.current, 0, 24) }],
    [pressed]
  );
  const r = useDerivedValue(
    () => mix(pressed.current, dotRadius / 2, dotRadius),
    [pressed]
  );
  const innerShadow = useDerivedValue(() => {
    return rgbMix(pressed.current, Theme.dotOff, Theme.dotOn);
  }, [pressed]);

  return (
    <FitBox src={FRAME} dst={rect(x, y, width, width * 2)}>
      <Box box={border} color={rgb(Theme.whiteBackground)}>
        <BoxShadow dx={-1} dy={-1} blur={3} color="white" />
        <BoxShadow
          dx={1.5}
          dy={1.5}
          blur={3}
          color={rgba(Theme.shadowLight, 0.6)}
        />
      </Box>
      <Box box={container} color={rgb(Theme.whiteForeground)}>
        <BoxShadow
          dx={-1}
          dy={-1}
          blur={3}
          color={rgba(Theme.shadowDark, 0.6)}
          inner
        />
        <BoxShadow
          dx={1.5}
          dy={1.5}
          blur={3}
          color={rgba(Theme.shadowLight, 0.4)}
          inner
        />
      </Box>
      <Box box={container} color={innerShadow} />
      <Group transform={transform}>
        <Box box={dot} color={rgb(Theme.whiteBackground)}>
          <BoxShadow
            dx={0}
            dy={1}
            blur={4}
            color={rgba(Theme.shadowLight, 0.25)}
          />
          <BoxShadow
            dx={2}
            dy={2}
            blur={3}
            color={rgba(Theme.shadowLight, 0.25)}
          />
        </Box>
        <Circle
          cx={12}
          cy={12}
          r={r}
          color={rgba(Theme.dotOn)}
          opacity={pressed}
        />
      </Group>
    </FitBox>
  );
};
