import React, { useMemo } from "react";
import type { SkiaClockValue } from "@shopify/react-native-skia";
import {
  Canvas,
  Path,
  useDerivedValue,
  useClockValue,
  Vertices,
} from "@shopify/react-native-skia";
import SimplexNoise from "simplex-noise";

const POINTS = 5;

const palette = [
  "#61dafb",
  "#fb61da",
  "#dafb61",
  "#61fbcf",
  "#cf61fb",
  "#fbcf61",
  "#61dacf",
  "#cf61da",
  "#dacf61",
];

interface Size {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  p0: { point: Point; seed: number };
  p1: { point: Point; seed: number };
  p2: { point: Point; seed: number };
}

function createPoints(size: Size): Point[] {
  const sizeX = size.width / POINTS;
  const sizeY = size.height / POINTS;
  const N = [...Array(POINTS + 1).keys()];
  return N.map((nx) =>
    N.map((ny) => ({ x: nx * sizeX, y: ny * sizeY }))
  ).flat();
}

function createTriangles(points: Point[]): Triangle[] {
  const N = [...Array(POINTS).keys()];
  const index = (nx: number, ny: number) => ny + (POINTS + 1) * nx;
  return N.map((nx) =>
    N.map((ny) => {
      const i0 = index(nx, ny);
      const p0 = points[i0];
      const i1 = index(nx + 1, ny);
      const p1 = points[i1];
      const i2 = index(nx, ny + 1);
      const p2 = points[i2];
      const i3 = index(nx + 1, ny + 1);
      const p3 = points[i3];
      return [
        {
          p0: { point: p0, seed: i0 },
          p1: { point: p1, seed: i1 },
          p2: { point: p2, seed: i2 },
        },
        {
          p0: { point: p3, seed: i3 },
          p1: { point: p2, seed: i2 },
          p2: { point: p1, seed: i1 },
        },
      ];
    }).flat()
  ).flat();
}

const SIMPLEX_FREQ = 5000;
const SIMPLEX_OFFSET = Math.floor(Math.random() * 10000);
const SIMPLEX_AMP = 50;

function pointToSimplex(clock: number, { x, y }: Point, seed: number) {
  if (
    seed % (POINTS + 1) === 0 ||
    seed % (POINTS + 1) === POINTS ||
    seed <= POINTS ||
    seed >= POINTS * (POINTS + 1)
  ) {
    return { x, y };
  }

  const noise = new SimplexNoise(SIMPLEX_OFFSET + seed);
  const noisePoint = {
    x: SIMPLEX_AMP * noise.noise2D(clock / SIMPLEX_FREQ, 0),
    y: SIMPLEX_AMP * noise.noise2D(0, clock / SIMPLEX_FREQ),
  };
  return {
    x: x + noisePoint.x,
    y: y + noisePoint.y,
  };
}

function triangleToSimplex(clock: number, triangle: Triangle) {
  const p0 = pointToSimplex(clock, triangle.p0.point, triangle.p0.seed);
  const p1 = pointToSimplex(clock, triangle.p1.point, triangle.p1.seed);
  const p2 = pointToSimplex(clock, triangle.p2.point, triangle.p2.seed);
  return { p0, p1, p2 };
}

const SVG = {
  move(p: Point) {
    return `M${p.x} ${p.y}`;
  },
  line(p: Point) {
    return `L${p.x} ${p.y}`;
  },
  close() {
    return `Z`;
  },
};

function pointToSvg({ x, y }: Point) {
  const p0 = { x: x - 5, y: y - 5 };
  const p1 = { x: x + 5, y: y - 5 };
  const p2 = { x: x + 5, y: y + 5 };
  const p3 = { x: x - 5, y: y + 5 };
  return [
    SVG.move(p0),
    SVG.line(p1),
    SVG.line(p2),
    SVG.line(p3),
    SVG.close(),
  ].join(" ");
}

function triangleToSvg({ p0, p1, p2 }: { p0: Point; p1: Point; p2: Point }) {
  return [SVG.move(p0), SVG.line(p1), SVG.line(p2), SVG.close()].join(" ");
}

interface Props {
  size: Size;
}

export default function Mesh({ size }: Props) {
  const clock = useClockValue();

  const points = useMemo(() => createPoints(size), [size]);
  const triangles = useMemo(() => createTriangles(points), [points]);

  return (
    <Canvas style={{ flex: 1 }}>
      <Gradient clock={clock} points={points} />
      {triangles.map((triangle, index) => (
        <Triangle key={index} clock={clock} triangle={triangle} seed={index} />
      ))}
      {points.map((point, index) => (
        <Vertex key={index} clock={clock} point={point} seed={index} />
      ))}
    </Canvas>
  );
}

interface VertexProps {
  clock: SkiaClockValue;
  point: Point;
  seed: number;
}

function Vertex({ clock, point, seed }: VertexProps) {
  const pointsSvg = useDerivedValue(() => {
    const simplex = pointToSimplex(clock.current, point, seed);
    return pointToSvg(simplex);
  }, [clock]);

  return <Path path={pointsSvg} color={palette[seed % palette.length]} />;
}

interface TriangleProps {
  clock: SkiaClockValue;
  triangle: Triangle;
  seed: number;
}

function Triangle({ clock, triangle, seed }: TriangleProps) {
  const triangleSvg = useDerivedValue(() => {
    const simplex = triangleToSimplex(clock.current, triangle);
    return triangleToSvg(simplex);
  }, [clock]);

  return (
    <Path
      style="stroke"
      strokeWidth={2}
      path={triangleSvg}
      color={palette[seed % palette.length]}
    />
  );
}

interface GradientProps {
  clock: SkiaClockValue;
  points: Point[];
}

function Gradient({ clock, points }: GradientProps) {
  const pointsSimplex = useDerivedValue(() => {
    return points.map((point, index) => {
      return pointToSimplex(clock.current, point, index);
    });
  }, [clock]);

  const indices: number[] = createTriangles(points)
    .map((triangle) => [triangle.p0.seed, triangle.p1.seed, triangle.p2.seed])
    .flat();
  const colors = indices.map((index) => palette[index % palette.length]);
  return (
    <Vertices vertices={pointsSimplex} indices={indices} colors={colors} />
  );
}
