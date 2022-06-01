import React, { useEffect } from "react";
import type { Size, SkiaMutableValue } from "@shopify/react-native-skia";
import {
  Group,
  Canvas,
  Circle,
  Rect,
  useDerivedValue,
  useValue,
  runTiming,
} from "@shopify/react-native-skia";

type Props = {
  size: Size;
};

function randIn(lower: number, upper: number) {
  return Math.round(lower + Math.random() * (upper - lower));
}

function startAnimation(
  value: SkiaMutableValue<number>,
  randColor: () => number
) {
  runTiming(value, randColor(), { duration: randIn(2000, 4000) }, () => {
    startAnimation(value, randColor);
  });
}

function useRGB(randColor: () => number) {
  const red = useValue(randColor());
  const green = useValue(randColor());
  const blue = useValue(randColor());

  useEffect(() => {
    startAnimation(red, randColor);
    startAnimation(green, randColor);
    startAnimation(blue, randColor);
  }, []);

  return useDerivedValue(
    () => `rgb(${red.current}, ${green.current}, ${blue.current})`,
    [red, green, blue]
  );
}

export default function Circles({ size }: Props) {
  const { width, height } = size;
  const offset = 50;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 4;

  const bg = useRGB(() => randIn(200, 255));
  const color0 = useRGB(() => randIn(0, 255));
  const color1 = useRGB(() => randIn(0, 255));
  const color2 = useRGB(() => randIn(0, 255));

  return (
    <Canvas style={{ flex: 1 }}>
      <Rect x={0} y={0} width={width} height={height} color={bg} />
      <Group blendMode="multiply">
        <Circle cx={cx} cy={cy - offset} r={r} color={color0} />
        <Circle cx={cx - offset} cy={cy + offset} r={r} color={color1} />
        <Circle cx={cx + offset} cy={cy + offset} r={r} color={color2} />
      </Group>
    </Canvas>
  );
}
