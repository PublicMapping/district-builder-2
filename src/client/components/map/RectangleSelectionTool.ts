import MapboxGL from "mapbox-gl";
import store from "../../store";
import { addSelectedGeounitIds } from "../../actions/districtDrawing";
import {
  featuresToSet,
  GEOLEVELS_SOURCE_ID,
  levelToSelectionLayerId,
  ISelectionTool
} from "./index";

import { GeoUnits, IStaticMetadata } from "../../../shared/entities";
/*
 * Allows user to click and drag to select all geounits within the rectangle
 * (bounding box) drawn.
 *
 * Any overlap with a geounit will cause it to be selected.
 *
 * Note that this is only additive (does not deselect geounits).
 *
 * Implementation is based off of this example from the Mapbox docs:
 * https://docs.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/
 */
const RectangleSelectionTool: ISelectionTool = {
  enable: function(map: MapboxGL.Map, geoLevel: string, staticMetadata: IStaticMetadata) {
    map.boxZoom.disable();
    map.dragPan.disable();
    map.getCanvas().style.cursor = "crosshair"; // eslint-disable-line

    const canvas = map.getCanvasContainer();

    // Variable to hold the starting xy coordinates
    // when `mousedown` occured.
    let start: MapboxGL.Point; // eslint-disable-line

    // Variable to hold the current xy coordinates
    // when `mousemove` or `mouseup` occurs.
    let current: MapboxGL.Point; // eslint-disable-line

    // Variable for the draw box element.
    let box: HTMLElement | null; // eslint-disable-line

    canvas.addEventListener("mousedown", mouseDown);
    // Save mouseDown for removal upon disabling
    this.mouseDown = mouseDown; // eslint-disable-line

    let setOfInitiallySelectedFeatures: GeoUnits; // eslint-disable-line

    // Return the xy coordinates of the mouse position
    function mousePos(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      return new MapboxGL.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop
      );
    }

    function mouseDown(e: MouseEvent) {
      // Call functions for the following events
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      setOfInitiallySelectedFeatures = featuresToSet(
        getFeaturesInBoundingBox().filter(feature => isFeatureSelected(feature)),
        staticMetadata.geoLevelHierarchy
      );

      // Capture the first xy coordinates
      start = mousePos(e);
    }

    function onMouseMove(e: MouseEvent) {
      // Find selected features before updating `current` to tell if any features were deselected
      const prevFeatures = current && getFeaturesInBoundingBox([start, current]);

      // Capture the ongoing xy coordinates
      current = mousePos(e);

      // Append the box element if it doesnt exist
      // eslint-disable-next-line
      if (!box) {
        box = document.createElement("div");
        box.classList.add("boxdraw");
        canvas.appendChild(box);
      }

      const minX = Math.min(start.x, current.x),
        maxX = Math.max(start.x, current.x),
        minY = Math.min(start.y, current.y),
        maxY = Math.max(start.y, current.y);

      // Adjust width and xy position of the box element ongoing
      /* eslint-disable */
      const pos = "translate(" + minX + "px," + minY + "px)";
      box.style.transform = pos;
      box.style.webkitTransform = pos;
      box.style.width = maxX - minX + "px";
      box.style.height = maxY - minY + "px";
      /* eslint-enable */

      const features = getFeaturesInBoundingBox([start, current]);

      // Set any newly selected features on the map within the bounding box to selected state
      const newFeatures = features.filter(feature => !isFeatureSelected(feature));
      newFeatures.forEach(feature => {
        map.setFeatureState(featureStateExpression(feature.id), { selected: true });
      });

      // Set any features that were previously selected and just became unselected to unselected
      // eslint-disable-next-line
      if (prevFeatures) {
        const setOfPrevFeatures = featuresToSet(prevFeatures, staticMetadata.geoLevelHierarchy);
        const setOfFeatures = featuresToSet(features, staticMetadata.geoLevelHierarchy);
        Array.from(setOfPrevFeatures.keys())
          .filter(id => !setOfInitiallySelectedFeatures.has(id) && !setOfFeatures.has(id))
          .forEach(id => {
            map.setFeatureState(featureStateExpression(id), { selected: false });
          });
      }
    }

    function onMouseUp(e: MouseEvent) {
      // Capture xy coordinates
      finish([start, mousePos(e)]);
    }

    function featureStateExpression(id?: string | number) {
      return {
        source: GEOLEVELS_SOURCE_ID,
        id,
        sourceLayer: geoLevel
      };
    }

    function isFeatureSelected(feature: MapboxGL.MapboxGeoJSONFeature): boolean {
      const featureState = map.getFeatureState(featureStateExpression(feature.id));
      return featureState.selected === true;
    }

    function getFeaturesInBoundingBox(
      // eslint-disable-next-line
      bbox?: [MapboxGL.PointLike, MapboxGL.PointLike]
    ): readonly MapboxGL.MapboxGeoJSONFeature[] {
      return map.queryRenderedFeatures(bbox, {
        layers: [levelToSelectionLayerId(geoLevel)]
      });
    }

    // eslint-disable-next-line
    function finish(bbox?: [MapboxGL.PointLike, MapboxGL.PointLike]) {
      // Remove these events now that finish has been called.
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // eslint-disable-next-line
      if (box) {
        box.parentNode && box.parentNode.removeChild(box);
        box = null;
      }

      // If bbox exists. use this value as the argument for `queryRenderedFeatures`
      // eslint-disable-next-line
      if (bbox) {
        const selectedFeatures = getFeaturesInBoundingBox(bbox);
        selectedFeatures.length &&
          store.dispatch(
            addSelectedGeounitIds(featuresToSet(selectedFeatures, staticMetadata.geoLevelHierarchy))
          );
      }
    }
  },
  disable: function(map: MapboxGL.Map) {
    map.boxZoom.enable();
    map.dragPan.enable();
    // eslint-disable-next-line
    map.getCanvas().style.cursor = "grab";
    // eslint-disable-next-line
    this.mouseDown && map.getCanvasContainer().removeEventListener("mousedown", this.mouseDown);
  }
};

export default RectangleSelectionTool;
