import MapboxGL, { MapboxGeoJSONFeature } from "mapbox-gl";
import { join } from "path";
import { s3ToHttps } from "../../s3";

import {
  GeoUnitCollection,
  DistrictId,
  DistrictsDefinition,
  FeatureId,
  GeoLevelInfo,
  GeoUnitIndices,
  GeoUnits,
  IStaticMetadata,
  LockedDistricts
} from "../../../shared/entities";

// Vector tiles with geolevel data for this geography
export const GEOLEVELS_SOURCE_ID = "db";
// GeoJSON district data for district as currently drawn
export const DISTRICTS_SOURCE_ID = "districts";
// Id for districts layer
export const DISTRICTS_LAYER_ID = "districts";
// Used only to make districts appear in the correct position in the layer stack
export const DISTRICTS_PLACEHOLDER_LAYER_ID = "district-placeholder";
// Used only to make highlights appear in the correct position in the layer stack
export const HIGHLIGHTS_PLACEHOLDER_LAYER_ID = "highlight-placeholder";
// Used only to make lines appear in the correct position in the layer stack
export const LINES_PLACEHOLDER_LAYER_ID = "line-placeholder";
// Used only to make labels appear in the correct position in the layer stack
export const LABELS_PLACEHOLDER_LAYER_ID = "label-placeholder";

// Delay used to throttle calls to set the current feature(s), in milliseconds
export const SET_FEATURE_DELAY = 100;

// Layers in the Mapbox Studio project that we filter to only show the active region.
const filteredLabelLayers = [
  "settlement-major-label",
  "settlement-minor-label",
  "settlement-subdivision-label",
  "poi-label"
];

export function getGeolevelLinePaintStyle(geoLevel: string) {
  const largeGeolevel = {
    "line-color": "#000",
    "line-opacity": 1,
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 14, 4.5]
  };

  const mediumGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.2, 14, 0.6],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.75, 14, 2.25]
  };

  const smallGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.1, 14, 0.3],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0, 14, 1.5]
  };

  switch (geoLevel) {
    case "county":
      return largeGeolevel;
    case "tract":
      return mediumGeolevel;
    case "blockgroup":
      return mediumGeolevel;
    case "block":
      return smallGeolevel;
    default:
      return smallGeolevel;
  }
}

export function generateMapLayers(
  path: string,
  regionCode: string,
  geoLevels: readonly GeoLevelInfo[],
  minZoom: number,
  maxZoom: number,
  /* eslint-disable */
  map: any,
  geojson: any
  /* eslint-enable */
) {
  map.addSource(DISTRICTS_SOURCE_ID, {
    type: "geojson",
    data: geojson
  });

  map.addSource(GEOLEVELS_SOURCE_ID, {
    type: "vector",
    tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
    minzoom: minZoom,
    maxzoom: maxZoom
  });

  map.addLayer(
    {
      id: DISTRICTS_LAYER_ID,
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: {},
      paint: {
        "fill-color": { type: "identity", property: "color" },
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.66, 14, 0.45],
        "fill-antialias": false
      }
    },
    DISTRICTS_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: "districts-locked",
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: {},
      paint: {
        "fill-pattern": "circle-1",
        "fill-opacity": ["case", ["boolean", ["feature-state", "locked"], false], 1, 0]
      }
    },
    DISTRICTS_PLACEHOLDER_LAYER_ID
  );

  geoLevels.forEach(level => {
    map.addLayer(
      {
        id: levelToLineLayerId(level.id),
        type: "line",
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": level.id,
        layout: { visibility: "none" },
        paint: getGeolevelLinePaintStyle(level.id)
      },
      LINES_PLACEHOLDER_LAYER_ID
    );
  });

  geoLevels.forEach(level => {
    map.addLayer(
      {
        id: levelToSelectionLayerId(level.id),
        type: "fill",
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": level.id,
        paint: {
          "fill-color": "#000",
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0],
          "fill-antialias": false
        }
      },
      HIGHLIGHTS_PLACEHOLDER_LAYER_ID
    );
  });

  geoLevels.forEach(level => {
    map.addLayer({
      id: levelToLabelLayerId(level.id),
      type: "symbol",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": `${level.id}labels`,
      layout: {
        "text-size": 13,
        "text-padding": 2,
        "text-field": "",
        "text-max-width": 10,
        "text-font": ["Atlas Grotesk Bold"],
        visibility: "none"
      },
      paint: {
        "text-color": "#222",
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1,
        "text-halo-blur": 0
      }
    });
  });

  // These are layers that already exist and have their own filters. First, we get the
  // existing filter, then merge that with a custom filter that only shows labels from
  // the selected region. Finally, we set the layer to visible. In Mapbox Studio, the
  // layer was set to invisible to avoid a flash where the labels appear before the filter
  // is applied.
  filteredLabelLayers.forEach(layer => {
    map.setFilter(layer, [
      "all",
      map.getFilter(layer),
      ["match", ["get", "iso_3166_2"], [`US-${regionCode}`], true, false]
    ]);
    map.setLayoutProperty(layer, "visibility", "visible");
  });
}

// Retuns a label layer id given the geolevel
export function levelToLabelLayerId(geoLevel: string) {
  return `${geoLevel}-label`;
}

// Retuns a line layer id given the geolevel
export function levelToLineLayerId(geoLevel: string) {
  return `${geoLevel}-line`;
}

// Retuns a selection layer id given the geolevel
export function levelToSelectionLayerId(geoLevel: string) {
  return `${geoLevel}-selected`;
}

/*
 * Used for getting/setting feature state for geounits in geography.
 */
export function featureStateGeoLevel(feature: MapboxGL.MapboxGeoJSONFeature) {
  return {
    source: GEOLEVELS_SOURCE_ID,
    id: feature.id,
    sourceLayer: feature.sourceLayer
  };
}

/*
 * Used for getting/setting feature state for districts.
 */
export function featureStateDistricts(districtId: DistrictId) {
  return {
    source: DISTRICTS_SOURCE_ID,
    id: districtId
  };
}

export function isFeatureSelected(
  map: MapboxGL.Map,
  feature: MapboxGL.MapboxGeoJSONFeature
): boolean {
  const featureState = map.getFeatureState(featureStateGeoLevel(feature));
  return featureState.selected === true;
}

function isGeoUnitLocked(
  districtsDefinition: GeoUnitCollection,
  lockedDistricts: LockedDistricts,
  geoUnitIndices: GeoUnitIndices
): boolean {
  return geoUnitIndices.length && typeof districtsDefinition === "object"
    ? isGeoUnitLocked(
        districtsDefinition[geoUnitIndices[0]],
        lockedDistricts,
        geoUnitIndices.slice(1)
      )
    : typeof districtsDefinition === "number"
    ? // Check if this specific district is locked
      lockedDistricts.has(districtsDefinition)
    : // Check if any district at this geolevel is locked
      districtsDefinition.some(
        districtId => typeof districtId === "number" && lockedDistricts.has(districtId)
      );
}

export function findSelectedSubFeatures(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata,
  feature: MapboxGL.MapboxGeoJSONFeature,
  geoUnitIndices: GeoUnitIndices
): readonly MapboxGeoJSONFeature[] {
  const geoLevel: GeoLevelInfo | undefined =
    geoUnitIndices && staticMetadata.geoLevelHierarchy[geoUnitIndices.length];
  return geoLevel
    ? map
        .queryRenderedFeatures(undefined, {
          layers: [levelToSelectionLayerId(geoLevel.id)],
          filter: ["==", ["get", `${feature.sourceLayer}Idx`], geoUnitIndices[0]]
        })
        .filter(feature => isFeatureSelected(map, feature))
    : [];
}

export function getGeoLevelVisibility(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata
): readonly boolean[] {
  const mapZoom = map.getZoom();
  return staticMetadata.geoLevelHierarchy
    .slice()
    .reverse()
    .map(geoLevel => mapZoom >= geoLevel.minZoom);
}

/* eslint-disable */
export interface ISelectionTool {
  enable: (map: MapboxGL.Map, ...args: any) => void;
  disable: (map: MapboxGL.Map, ...args: any) => void;
  [x: string]: any;
}
/* eslint-enable */

/*
 * Return GeoUnits for given features.
 *
 * Note that this doesn't take whether a feature is locked or not into account. If the features
 * could possibly be locked then `featuresToUnlockedGeoUnits` should be used.
 */
export function featuresToGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[]
): GeoUnits {
  const geoLevelIds = geoLevelHierarchy.map(geoLevel => geoLevel.id);
  const geoLevelHierarchyKeys = ["idx", ...geoLevelIds.map(geoLevelId => `${geoLevelId}Idx`)];
  return geoLevelIds.reduce((geounitData: GeoUnits, geoLevelId) => {
    // Map is used here instead of Set because Sets don't work well for handling
    // objects (multiple copies of an object with the same values can exist in
    // the same set). Here the feature id is used as the key which we also want
    // to keep track of for map management. Note that if keys are duplicated the
    // value set last will be used (thus achieving the uniqueness of sets).
    // eslint-disable-next-line
    geounitData[geoLevelId] = new Map(
      features
        .filter(feature => feature.sourceLayer === geoLevelId)
        .map((feature: MapboxGeoJSONFeature) => [
          feature.id as FeatureId,
          geoLevelHierarchyKeys.reduce((geounitData, key) => {
            const geounitId = feature.properties && feature.properties[key];
            return geounitId !== undefined && geounitId !== null
              ? [geounitId, ...geounitData]
              : geounitData;
          }, [] as readonly number[])
        ])
    );
    return geounitData;
  }, {});
}

export function onlyUnlockedGeoUnits(
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  geoUnits: GeoUnits
): GeoUnits {
  return Object.entries(geoUnits).reduce((geoUnits: GeoUnits, [geoLevelId, geoUnitsForLevel]) => {
    const geoUnitsForLevelCopy = new Map(geoUnitsForLevel);
    geoUnitsForLevelCopy.forEach((geoUnitIndices, featureId) => {
      // eslint-disable-next-line
      if (isGeoUnitLocked(districtsDefinition, lockedDistricts, geoUnitIndices)) {
        // eslint-disable-next-line
        geoUnitsForLevelCopy.delete(featureId);
      }
    });
    // eslint-disable-next-line
    geoUnits[geoLevelId] = geoUnitsForLevelCopy;
    return geoUnits;
  }, {});
}

export function featuresToUnlockedGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[],
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts
): GeoUnits {
  return onlyUnlockedGeoUnits(
    districtsDefinition,
    lockedDistricts,
    featuresToGeoUnits(features, geoLevelHierarchy)
  );
}
