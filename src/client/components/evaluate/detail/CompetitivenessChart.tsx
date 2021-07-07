/** @jsx jsx */
import { Flex, jsx } from "theme-ui";
import { DistrictsGeoJSON, EvaluateMetricWithValue, PviBucket } from "../../../types";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleLinear, scaleBand } from "@visx/scale";
import { Axis } from "@visx/axis";
import { getPviBuckets, getPviSteps } from "../../map";
import { calculatePVI } from "../../../functions";

const CompetitivenessChart = ({
  geojson,
  metric
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric?: EvaluateMetricWithValue;
}) => {
  const buckets =
    geojson &&
    geojson?.features
      .filter(f => f.id !== 0 && f.properties.demographics.population > 0)
      .map(f => {
        const pvi = f.properties.voting && calculatePVI(f.properties.voting, metric?.electionYear);
        const bucket = pvi && computeRowBucket(pvi);
        return (bucket && bucket.name) || "";
      })
      // @ts-ignore
      // eslint-disable-next-line
      .reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), Object.create(null));

  const chartData: readonly PviBucket[] = getPviBuckets().map(bucket => {
    return { ...bucket, count: buckets[bucket.name] || 0 };
  });

  function computeRowBucket(value: number) {
    const buckets = getPviBuckets();
    const stops = getPviSteps();
    // eslint-disable-next-line
    for (let i = 0; i < stops.length; i++) {
      const r = stops[i];
      if (value >= r[0]) {
        if (i < stops.length - 1) {
          const r1 = stops[i + 1];
          if (value < r1[0]) {
            return buckets[i];
          }
        } else {
          return buckets[i];
        }
      } else {
        return buckets[i];
      }
    }
  }

  const width = 400;
  const height = 250;
  const margin = { top: 50, bottom: 50, left: 50, right: 20 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const leftAxisWidth = 30;

  // accessors
  const x = (d: PviBucket) => d.name;
  const y = (d: PviBucket) => (d.count ? +d.count : 0);

  const xScale = scaleBand({
    range: [leftAxisWidth, xMax],
    round: true,
    domain: chartData.map(x),
    padding: 0.4
  });

  const yScale = scaleLinear({
    range: [yMax, 10],
    round: true,
    domain: [0, Math.max(...chartData.map(y))]
  });

  // const compose = (
  //   scale: ScaleContinuousNumeric<number, number, never> | ScaleBand<string>,
  //   accessor: (d: PviBucket[]) => number | string
  // ) => (data: PviBucket[]) => scale(accessor(data));

  // @ts-ignore
  // eslint-disable-next-line
  const compose: any = (scale, accessor) => data => scale(accessor(data));
  // @ts-ignore
  const xPoint = compose(xScale, x);
  // @ts-ignore
  const yPoint = compose(yScale, y);

  return (
    <Flex
      sx={{
        flexDirection: "row",
        height: "200px",
        minWidth: "150px",
        position: "relative",
        ml: "10px",
        flexShrink: 0
      }}
    >
      <svg width={width} height={height}>
        {chartData.map((d, i) => {
          const barHeight = yMax - yPoint(d);
          return (
            <Group key={`bar-${i}`}>
              <Bar
                x={xPoint(d)}
                y={yMax - barHeight}
                height={barHeight}
                width={xScale.bandwidth()}
                fill={d.color}
              />
            </Group>
          );
        })}
        <Axis
          scale={xScale}
          hideTicks={true}
          label="Political Lean"
          orientation="bottom"
          top={yMax}
        />
        <Axis
          scale={yScale}
          label="# of districts"
          left={leftAxisWidth}
          orientation="left"
          numTicks={4}
        />
      </svg>
    </Flex>
  );
};

export default CompetitivenessChart;
