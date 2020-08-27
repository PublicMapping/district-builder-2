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
// Used only to make labels show up on top of all other layers
export const DISTRICTS_PLACEHOLDER_LAYER_ID = "district-placeholder";

export function getGeolevelLinePaintStyle(geoLevel: string) {
  const largeGeolevel = {
    "line-color": "#000",
    "line-opacity": 1,
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 14, 5]
  };

  const mediumGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.1, 14, 0.6],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.3, 14, 3]
  };

  const smallGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.1, 14, 0.3],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0, 14, 2]
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

export function getMapboxStyle(
  path: string,
  geoLevels: readonly GeoLevelInfo[],
  minZoom: number,
  maxZoom: number
): MapboxGL.Style {
  const lineLayers = geoLevels.flatMap(level => [
    {
      id: levelToLineLayerId(level.id),
      type: "line",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": level.id,
      layout: { visibility: "none" },
      paint: getGeolevelLinePaintStyle(level.id)
    }
  ]);

  const selectionLayers = geoLevels.flatMap(level => [
    {
      id: levelToSelectionLayerId(level.id),
      type: "fill",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": level.id,
      paint: {
        "fill-color": "#000",
        "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0]
      }
    }
  ]);

  const labelLayers = geoLevels.flatMap(level => [
    {
      id: levelToLabelLayerId(level.id),
      type: "symbol",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": `${level.id}labels`,
      layout: {
        "text-size": 12,
        "text-padding": 3,
        "text-field": "",
        "text-max-width": 10,
        "text-font": ["GR"],
        visibility: "none"
      },
      paint: {
        "text-color": "#000",
        "text-opacity": 0.9,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    }
  ]);

  return {
    layers: [
      {
        id: DISTRICTS_PLACEHOLDER_LAYER_ID,
        type: "background",
        paint: {
          "background-color": "transparent"
        },
        layout: {
          visibility: "none"
        }
      },
      ...selectionLayers,
      ...lineLayers,
      ...labelLayers
    ] as MapboxGL.Layer[], // eslint-disable-line
    glyphs: window.location.origin + "/fonts/{fontstack}/{range}.pbf",
    sprite: window.location.origin + "/sprites/sprite",
    name: "District Builder",
    sources: {
      [GEOLEVELS_SOURCE_ID]: {
        type: "vector",
        tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
        minzoom: minZoom,
        maxzoom: maxZoom
      }
    },
    version: 8
  };
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
  const geoLevelHierarchyKeys = ["idx", ...geoLevelHierarchy.map(geoLevel => `${geoLevel.id}Idx`)];
  // Map is used here instead of Set because Sets don't work well for handling
  // objects (multiple copies of an object with the same values can exist in
  // the same set). Here the feature id is used as the key which we also want
  // to keep track of for map management. Note that if keys are duplicated the
  // value set last will be used (thus achieving the uniqueness of sets).
  return new Map(
    features.map((feature: MapboxGeoJSONFeature) => [
      feature.id as FeatureId,
      geoLevelHierarchyKeys.reduce(
        (geounitData, key) => {
          const geounitId = feature.properties && feature.properties[key];
          return geounitId !== undefined && geounitId !== null
            ? [geounitId, ...geounitData]
            : geounitData;
        },
        [] as readonly number[]
      )
    ])
  );
}

function onlyUnlockedFeatures(
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  geoUnits: GeoUnits
): GeoUnits {
  return new Map(
    [...geoUnits.entries()].filter(
      ([, geoUnitIndices]) => !isGeoUnitLocked(districtsDefinition, lockedDistricts, geoUnitIndices)
    )
  );
}

export function featuresToUnlockedGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[],
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts
): GeoUnits {
  return onlyUnlockedFeatures(
    districtsDefinition,
    lockedDistricts,
    featuresToGeoUnits(features, geoLevelHierarchy)
  );
}
