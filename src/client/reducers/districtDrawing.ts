import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  SelectionTool,
  addSelectedGeounits,
  clearHighlightedGeounits,
  clearSelectedGeounits,
  editSelectedGeounits,
  removeSelectedGeounits,
  saveDistrictsDefinition,
  setGeoLevelIndex,
  setGeoLevelVisibility,
  setHighlightedGeounits,
  setSelectedDistrictId,
  setSelectionTool,
  toggleDistrictLocked
} from "../actions/districtDrawing";
import { updateDistrictsDefinition } from "../actions/projectData";
import { resetProjectState } from "../actions/root";
import { GeoUnits, GeoUnitsForLevel, LockedDistricts } from "../../shared/entities";

function setGeoUnitsForLevel(
  currentGeoUnits: GeoUnitsForLevel,
  geoUnitsToAdd: GeoUnitsForLevel,
  geoUnitsToDelete: GeoUnitsForLevel
): GeoUnitsForLevel {
  const mutableSelected = new Map([...currentGeoUnits, ...geoUnitsToAdd]);
  geoUnitsToDelete.forEach((_value, key) => {
    mutableSelected.delete(key);
  });
  return mutableSelected;
}

function editGeoUnits(
  currentGeoUnits: GeoUnits,
  geoUnitsToAdd?: GeoUnits,
  geoUnitsToDelete?: GeoUnits
): GeoUnits {
  const allKeys = new Set(
    Object.keys(currentGeoUnits)
      .concat(Object.keys(geoUnitsToAdd || {}))
      .concat(Object.keys(geoUnitsToDelete || {}))
  );
  return [...allKeys].reduce((geoUnits, geoLevelId) => {
    return {
      ...geoUnits,
      [geoLevelId]: setGeoUnitsForLevel(
        currentGeoUnits[geoLevelId] || new Map(),
        (geoUnitsToAdd && geoUnitsToAdd[geoLevelId]) || new Map(),
        (geoUnitsToDelete && geoUnitsToDelete[geoLevelId]) || new Map()
      )
    };
  }, {} as GeoUnits);
}

function clearGeoUnits(geoUnits: GeoUnits): GeoUnits {
  return Object.keys(geoUnits).reduce((geoUnits, geoLevelId) => {
    return {
      ...geoUnits,
      [geoLevelId]: new Map()
    };
  }, {});
}

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly highlightedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
  readonly geoLevelVisibility: ReadonlyArray<boolean>; // Visibility values at indices corresponding to `geoLevelIndex`
  readonly lockedDistricts: LockedDistricts;
}

export const initialState: DistrictDrawingState = {
  selectedDistrictId: 1,
  selectedGeounits: {},
  highlightedGeounits: {},
  selectionTool: SelectionTool.Default,
  geoLevelIndex: 0,
  geoLevelVisibility: [],
  lockedDistricts: new Set()
};

const districtDrawingReducer: LoopReducer<DistrictDrawingState, Action> = (
  state: DistrictDrawingState = initialState,
  action: Action
): DistrictDrawingState | Loop<DistrictDrawingState, Action> => {
  switch (action.type) {
    case getType(resetProjectState):
      return initialState;
    case getType(setSelectedDistrictId):
      return {
        ...state,
        selectedDistrictId: action.payload
      };
    case getType(addSelectedGeounits):
      return loop(
        state,
        Cmd.action(
          editSelectedGeounits({
            add: action.payload
          })
        )
      );
    case getType(removeSelectedGeounits):
      return loop(
        state,
        Cmd.action(
          editSelectedGeounits({
            remove: action.payload
          })
        )
      );
    case getType(editSelectedGeounits):
      return {
        ...state,
        selectedGeounits: editGeoUnits(
          state.selectedGeounits,
          action.payload.add,
          action.payload.remove
        )
      };
    case getType(clearSelectedGeounits):
      return {
        ...state,
        selectedGeounits: clearGeoUnits(state.selectedGeounits)
      };
    case getType(setHighlightedGeounits):
      return {
        ...state,
        highlightedGeounits: action.payload
      };
    case getType(clearHighlightedGeounits):
      return {
        ...state,
        highlightedGeounits: clearGeoUnits(state.highlightedGeounits)
      };
    case getType(setSelectionTool):
      return {
        ...state,
        selectionTool: action.payload
      };
    case getType(setGeoLevelIndex):
      return {
        ...state,
        geoLevelIndex: action.payload
      };
    case getType(saveDistrictsDefinition):
      return loop(
        state,
        Cmd.action(
          updateDistrictsDefinition({
            selectedGeounits: state.selectedGeounits,
            selectedDistrictId: state.selectedDistrictId
          })
        )
      );
    case getType(setGeoLevelVisibility):
      return {
        ...state,
        geoLevelVisibility: action.payload
      };
    case getType(toggleDistrictLocked):
      return {
        ...state,
        lockedDistricts: new Set(
          state.lockedDistricts.has(action.payload)
            ? [...state.lockedDistricts.values()].filter(
                districtId => districtId !== action.payload
              )
            : [...state.lockedDistricts.values(), action.payload]
        )
      };
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
