/** @jsx jsx */
import { Box, Flex, jsx } from "theme-ui";
import { DistrictsGeoJSON } from "../../../types";
import { computeRowBucket } from "./Competitiveness";
import { getPviBuckets } from "../../map";

const barWidth = 80;
const maxBarHeight = 180;
const Bar = ({
  height,
  color,
  index
}: {
  readonly height: string;
  readonly color: string;
  readonly index: number;
}) => (
  <Box
    sx={{
      width: `${barWidth}px`,
      height: height,
      position: "absolute",
      bottom: "0px",
      left: `${index * barWidth}px`,
      backgroundColor: color,
      flex: "1"
    }}
  ></Box>
);

const CompetitivenessChart = ({ geojson }: { readonly geojson?: DistrictsGeoJSON }) => {
  const buckets =
    geojson &&
    geojson?.features
      .filter(f => f.id !== 0 && f.properties.demographics.population > 0)
      .map(f => {
        const bucket = computeRowBucket(f.properties.pvi);
        return (bucket && bucket.name) || "";
      })
      // @ts-ignore
      // eslint-disable-next-line
      .reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), Object.create(null));

  function computeHeight(name: string): string {
    const val =
      name in buckets && geojson?.features
        ? `${(buckets[name] /
            geojson?.features.filter(f => f.id !== 0 && f.properties.demographics.population > 0)
              .length) *
            maxBarHeight}px`
        : "1px";
    return val;
  }
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
      {getPviBuckets().map((bucket, i) => (
        <Bar height={computeHeight(bucket.name)} color={bucket.color} key={bucket.name} index={i} />
      ))}
    </Flex>
  );
};

export default CompetitivenessChart;
