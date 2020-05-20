import { join } from "path";
import React, { useEffect, useRef, useState } from "react";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { IProject, IStaticMetadata } from "../../shared/entities";
import { s3ToHttps } from "../s3";

const styles = {
  width: "100%",
  height: "100%"
};

interface Props {
  readonly project: IProject;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
}

function getMapboxStyle(path: string, geoLevels: readonly string[]): MapboxGL.Style {
  return {
    layers: geoLevels.map(level => {
      return {
        id: level,
        type: "line",
        source: "db",
        "source-layer": level,
        paint: {
          "line-color": "#000",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.1, 6, 0.1, 12, 0.2],
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 2]
        }
      };
    }),
    name: "District Builder",
    sources: {
      db: {
        type: "vector",
        tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
        minzoom: 4,
        maxzoom: 12
      }
    },
    version: 8
  };
}

// Helper for finding all indices in an array buffer matching a value.
// Note: mutation is used, because the union type of array buffers proved
// too difficult to line up types for reduce or map/filter.
function getAllIndices(
  arrayBuf: Uint8Array | Uint16Array | Uint32Array,
  val: number
): readonly number[] {
  // tslint:disable-next-line
  const indices: number[] = [];
  arrayBuf.forEach((el: number, ind: number) => {
    // tslint:disable-next-line no-if-statement
    if (el === val) {
      // tslint:disable-next-line no-object-mutation
      indices.push(ind);
    }
  });
  return indices;
}

const Map = ({ project, staticMetadata, staticGeoLevels, staticDemographics }: Props) => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMap = (setMap: (map: MapboxGL.Map) => void, mapContainer: HTMLDivElement) => {
      // Conversion from readonly -> mutable to match Mapbox interface
      const [b0, b1, b2, b3] = staticMetadata.bbox;

      // At the moment, we are only interacting with the top geolevel (e.g. County)
      const topGeoLevel =
        staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1];

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
        map.resize();
      });

      // Add a click event to the top geolevel that logs demographic information.
      // Note that since we are dealing with line types, the feature can't be
      // directly selected under the cursor. Instead we need to extend a bounding
      // box and select the first feature we find. This is fine for the proof-of-concept,
      // but we'll want to add better handling when it comes to actually drawing districts.
      map.on("click", e => {
        const buffer = 10;
        const southWest: MapboxGL.PointLike = [e.point.x - buffer, e.point.y - buffer];
        const northEast: MapboxGL.PointLike = [e.point.x + buffer, e.point.y + buffer];
        const features = map.queryRenderedFeatures([southWest, northEast], {
          layers: [topGeoLevel]
        });

        // tslint:disable-next-line no-if-statement
        if (features.length === 0 || typeof features[0].id !== "number") {
          // tslint:disable-next-line
          console.log("No features selected, try clicking closer to a feature border. ", features);
          return;
        }
        const feature = features[0];
        const featureId = feature.id as number;
        // tslint:disable-next-line
        console.log(`id: ${feature.id}, properties: `, feature.properties);

        // Indices of all base geounits belonging to the clicked feature
        const baseIndices = getAllIndices(staticGeoLevels[staticGeoLevels.length - 1], featureId);

        // As a proof of concept, log to the console the aggregated demographic data for the feature
        staticMetadata.demographics.forEach((demographic, ind) => {
          const val = baseIndices.reduce((sum, v) => sum + staticDemographics[ind][v], 0);
          // tslint:disable-next-line
          console.log(`${demographic.id}: ${val}`);
        });
      });
    };

    // Can't use ternary operator here because the call to setMap is async
    // tslint:disable-next-line
    if (!map && mapRef.current != null) {
      initializeMap(setMap, mapRef.current);
    }
    // eslint complains that this useEffect should depend on map, but we're using this to call setMap so that wouldn't make sense
    // eslint-disable-next-line
  }, []);

  return <div ref={mapRef} style={styles} />;
};

export default Map;
