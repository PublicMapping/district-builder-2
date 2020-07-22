import { FeatureCollection, MultiPolygon } from "geojson";
import React, { useEffect, useRef, useState } from "react";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { setBaseGeoUnitVisible, SelectionTool } from "../../actions/districtDrawing";
import { getDistrictColor } from "../../constants/colors";
import { DistrictProperties, GeoUnits, IProject, IStaticMetadata } from "../../../shared/entities";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_SOURCE_ID,
  DISTRICTS_LAYER_ID,
  getMapboxStyle
} from "./index";
import DefaultSelectionTool from "./DefaultSelectionTool";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";

const styles = {
  width: "100%",
  height: "100%"
};

interface Props {
  readonly project: IProject;
  readonly geojson: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly label?: string;
}

const Map = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  staticDemographics,
  selectedGeounits,
  selectedDistrictId,
  selectionTool,
  geoLevelIndex,
  label
}: Props) => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  const selectedGeolevel =
    staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1 - geoLevelIndex]
      .id;

  // Add a color property to the geojson, so it can be used for styling
  geojson.features.forEach((feature, id) => {
    // @ts-ignore
    // eslint-disable-next-line
    feature.properties.color = getDistrictColor(id);
  });

  useEffect(() => {
    const initializeMap = (setMap: (map: MapboxGL.Map) => void, mapContainer: HTMLDivElement) => {
      const map = new MapboxGL.Map({
        container: mapContainer,
        style: getMapboxStyle(project.regionConfig.s3URI, staticMetadata.geoLevelHierarchy),
        bounds: [b0, b1, b2, b3],
        fitBoundsOptions: { padding: 20 },
        minZoom: 5,
        maxZoom: 15
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.doubleClickZoom.disable();

      map.on("load", () => {
        setMap(map);

        map.addSource(DISTRICTS_SOURCE_ID, {
          type: "geojson",
          data: geojson
        });
        map.addLayer({
          id: DISTRICTS_LAYER_ID,
          type: "fill",
          source: DISTRICTS_SOURCE_ID,
          layout: {},
          paint: {
            "fill-color": { type: "identity", property: "color" },
            "fill-opacity": 0.7
          }
        });

        map.resize();
      });

      map.on("zoomend", () => {
        const baseGeoUnit = staticMetadata.geoLevelHierarchy[0];
        const baseGeoUnitMinZoom = baseGeoUnit.minZoom;
        store.dispatch(setBaseGeoUnitVisible(map.getZoom() >= baseGeoUnitMinZoom));
      });
    };

    // eslint-disable-next-line
    if (!map && mapRef.current != null) {
      initializeMap(setMap, mapRef.current);
    }
    // eslint complains that this useEffect should depend on map, but we're using this to call setMap so that wouldn't make sense
    // eslint-disable-next-line
  }, []);

  // Update districts source when geojson is fetched
  useEffect(() => {
    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson]);

  const removeSelectedFeatures = (map: MapboxGL.Map) => {
    map.removeFeatureState({ source: GEOLEVELS_SOURCE_ID, sourceLayer: selectedGeolevel });
  };

  // Remove selected features from map when selected geounit ids has been emptied
  useEffect(() => {
    map &&
      selectedGeounits.size === 0 &&
      (selectedDistrictId === 0
        ? removeSelectedFeatures(map)
        : // When adding or changing the district to which a geounit is
        // assigned, wait until districts GeoJSON is updated before removing
        // selected state.
        map.isStyleLoaded() && map.isSourceLoaded(DISTRICTS_SOURCE_ID)
        ? removeSelectedFeatures(map)
        : map.once("idle", () => removeSelectedFeatures(map)));
    // We don't want to tigger this effect when `selectedDistrictId` changes
    // eslint-disable-next-line
  }, [map, selectedGeounits]);

  // Update districts source when geojson is fetched
  useEffect(() => {
    const districtsSource = map && map.getSource("districts");
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson]);

  // Update labels when selection is changed
  useEffect(() => {
    const visibility = label === undefined ? "none" : "visible";
    // TODO: hardcoding county because we can't set the geolevel yet. This
    // should instead display only for the current geolevel (GH#200)
    map && map.setLayoutProperty("county-label", "visibility", visibility);
    map && map.setLayoutProperty("county-label", "text-field", `{${label}}`);
  }, [map, label]);

  useEffect(() => {
    /* eslint-disable */
    if (map) {
      // Disable any existing selection tools
      DefaultSelectionTool.disable(map);
      RectangleSelectionTool.disable(map);
      // Enable appropriate tool
      if (selectionTool === SelectionTool.Default) {
        DefaultSelectionTool.enable(
          map,
          selectedGeolevel,
          geoLevelIndex,
          staticMetadata,
          staticGeoLevels,
          staticDemographics
        );
      } else if (selectionTool === SelectionTool.Rectangle) {
        RectangleSelectionTool.enable(map, selectedGeolevel, staticMetadata);
      }
      /* eslint-enable */
    }
  }, [
    map,
    selectionTool,
    selectedGeolevel,
    geoLevelIndex,
    staticMetadata,
    staticDemographics,
    staticGeoLevels
  ]);

  return <div ref={mapRef} style={styles} />;
};

export default Map;
