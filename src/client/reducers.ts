import { combineReducers } from "redux-loop";
import projectReducer, {
  initialState as initialProjectState,
  ProjectState
} from "./reducers/project";
import projectsReducer, {
  initialState as initialProjectsState,
  ProjectsState
} from "./reducers/projects";
import regionConfigReducer, {
  initialState as initialRegionConfigState,
  RegionConfigState
} from "./reducers/regionConfig";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";

export interface State {
  readonly user: UserState;
  readonly regionConfig: RegionConfigState;
  readonly project: ProjectState;
  readonly projects: ProjectsState;
}

export const initialState: State = {
  user: initialUserState,
  regionConfig: initialRegionConfigState,
  project: initialProjectState,
  projects: initialProjectsState
};

export default combineReducers({
  user: userReducer,
  regionConfig: regionConfigReducer,
  project: projectReducer,
  projects: projectsReducer
});
