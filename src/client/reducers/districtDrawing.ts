import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { SavingState } from "../types";

import {
  addSelectedGeounits,
  clearHighlightedGeounits,
  clearSelectedGeounits,
  editSelectedGeounits,
  redo,
  removeSelectedGeounits,
  setGeoLevelIndex,
  setGeoLevelVisibility,
  setHighlightedGeounits,
  setSelectedDistrictId,
  setSelectionTool,
  setSelectedGeounits,
  showAdvancedEditingModal,
  toggleDistrictLocked,
  undo,
  replaceSelectedGeounits,
  toggleFind,
  setFindIndex,
  saveDistrictsDefinition,
  setSavingState
} from "../actions/districtDrawing";
import { updateDistrictsDefinition, updateDistrictLocks } from "../actions/projectData";
import { SelectionTool } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import { DistrictId, GeoUnits, GeoUnitsForLevel, LockedDistricts } from "../../shared/entities";
import { ProjectState, initialProjectState } from "./project";
import {
  pushEffect,
  pushStateUpdate,
  UndoHistory,
  UndoableState,
  updateCurrentState
} from "./undoRedo";

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

function toggleLock(id: DistrictId, locks: LockedDistricts): LockedDistricts {
  return locks
    .slice(0, id)
    .concat(!locks[id])
    .concat(...locks.slice(id + 1));
}

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly highlightedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly showAdvancedEditingModal: boolean;
  readonly findMenuOpen: boolean;
  readonly findIndex?: number;
  readonly saving: SavingState;
  readonly undoHistory: UndoHistory;
}

export const initialDistrictDrawingState: DistrictDrawingState = {
  selectedDistrictId: 1,
  highlightedGeounits: {},
  selectionTool: SelectionTool.Default,
  showAdvancedEditingModal: false,
  findMenuOpen: false,
  saving: "unsaved",
  undoHistory: {
    past: [],
    present: {
      state: {
        selectedGeounits: {},
        geoLevelIndex: 0,
        geoLevelVisibility: [],
        lockedDistricts: [],
        districtsDefinition: []
      }
    },
    future: []
  }
};

const districtDrawingReducer: LoopReducer<ProjectState, Action> = (
  state: ProjectState = initialProjectState,
  action: Action
): ProjectState | Loop<ProjectState, Action> => {
  const { present } = state.undoHistory;
  switch (action.type) {
    case getType(resetProjectState):
      return {
        ...state,
        ...initialDistrictDrawingState
      };
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
    // Note the only difference between this and replaceSelectedGeounits is whether we use pushStateUpdate or updateState
    case getType(editSelectedGeounits):
      return pushStateUpdate(state, {
        selectedGeounits: editGeoUnits(
          present.state.selectedGeounits,
          action.payload.add,
          action.payload.remove
        )
      });
    case getType(replaceSelectedGeounits):
      return updateCurrentState(state, {
        selectedGeounits: editGeoUnits(
          present.state.selectedGeounits,
          action.payload.add,
          action.payload.remove
        )
      });
    case getType(setSelectedGeounits):
      return pushStateUpdate(state, {
        selectedGeounits: action.payload
      });
    case getType(clearSelectedGeounits): {
      const clearedViaCancel = action.payload;
      const func = clearedViaCancel ? pushStateUpdate : updateCurrentState;
      return loop(
        func(state, {
          selectedGeounits: clearGeoUnits(present.state.selectedGeounits)
        }),
        Cmd.action(setSavingState(clearedViaCancel ? "unsaved" : "saved"))
      );
    }
    case getType(setSavingState):
      return {
        ...state,
        saving: action.payload
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
      return updateCurrentState(state, {
        geoLevelIndex: action.payload
      });
    case getType(setGeoLevelVisibility):
      return updateCurrentState(state, {
        geoLevelVisibility: action.payload
      });
    case getType(toggleDistrictLocked):
      return loop(
        // Save an effect function which takes the district locks so that we can
        // undo/redo saving of the locks with the correct state snapshot.
        pushEffect(state, (state: UndoableState) => {
          return Cmd.action(updateDistrictLocks(state.lockedDistricts));
        }),
        Cmd.action(
          updateDistrictLocks(
            toggleLock(action.payload, state.undoHistory.present.state.lockedDistricts)
          )
        )
      );
    case getType(showAdvancedEditingModal):
      return {
        ...state,
        showAdvancedEditingModal: action.payload
      };
    case getType(toggleFind):
      return {
        ...state,
        findMenuOpen: action.payload,
        findIndex: undefined
      };
    case getType(setFindIndex):
      return {
        ...state,
        findIndex: action.payload
      };
    case getType(undo): {
      const lastPastState = state.undoHistory.past[state.undoHistory.past.length - 1];
      return state.undoHistory.past.length === 0
        ? state
        : loop(
            {
              ...state,
              undoHistory: {
                past: state.undoHistory.past.slice(0, -1),
                present: lastPastState,
                future: [present, ...state.undoHistory.future]
              }
            },
            present.effect ? present.effect(lastPastState.state) : Cmd.none
          );
    }
    case getType(redo): {
      const nextFutureState = state.undoHistory.future[0];
      return state.undoHistory.future.length === 0
        ? state
        : loop(
            {
              ...state,
              undoHistory: {
                past: [...state.undoHistory.past, present],
                present: nextFutureState,
                future: state.undoHistory.future.slice(1)
              }
            },
            nextFutureState.effect ? nextFutureState.effect(nextFutureState.state) : Cmd.none
          );
    }
    case getType(saveDistrictsDefinition):
      return loop(
        // Save an effect function which takes the appropriate districts definition so that we can
        // undo/redo saving of the districts definition with the correct state snapshot.
        pushEffect(state, (state: UndoableState) =>
          Cmd.action(updateDistrictsDefinition(state.districtsDefinition))
        ),
        Cmd.action(updateDistrictsDefinition(null))
      );
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
