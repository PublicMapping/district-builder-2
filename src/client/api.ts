import axios, { AxiosResponse } from "axios";
import { saveAs } from "file-saver";

import {
  CreateProjectData,
  IProject,
  IRegionConfig,
  IUser,
  JWT,
  ProjectId,
  UpdateUserData
} from "../shared/entities";
import { DistrictsGeoJSON, DynamicProjectData } from "./types";
import { getJWT, setJWT } from "./jwt";

const apiAxios = axios.create();

function setAxiosAuthHeaders(jwt: JWT): void {
  // Disabling 'functional/immutable-data' without naming it.
  // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
  // eslint-disable-next-line
  apiAxios.defaults.headers.common.Authorization = `Bearer ${jwt}`;
}

const authToken = getJWT();
// Disabling 'functional/no-conditional-statement' without naming it.
// See https://github.com/jonaskello/eslint-plugin-functional/issues/105
// eslint-disable-next-line
if (authToken) {
  setAxiosAuthHeaders(authToken);
}

function saveJWT(response: AxiosResponse<JWT>): JWT {
  const jwt = response.data;
  setJWT(jwt);
  setAxiosAuthHeaders(jwt);
  return jwt;
}

export async function authenticateUser(email: string, password: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post("/api/auth/email/login", { email, password })
      .then(response => resolve(saveJWT(response)))
      .catch(error => reject(error.response?.data || error));
  });
}

export async function fetchUser(): Promise<IUser> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/user")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function patchUser(userData: Partial<UpdateUserData>): Promise<IUser> {
  return new Promise((resolve, reject) => {
    apiAxios
      .patch(`/api/user/`, userData)
      .then(response => resolve(response.data))
      .catch(() => reject());
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post("/api/auth/email/register", { name, email, password })
      .then(response => resolve(saveJWT(response)))
      .catch(error => reject(error.response?.data || error));
  });
}

export async function initiateForgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/forgot-password/${email}`)
      .then(() => resolve())
      .catch(error => reject(error.response?.data || error));
  });
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/resend-verification/${email}`)
      .then(() => resolve())
      .catch(error => reject(error.response?.data || error));
  });
}

export async function activateAccount(token: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/verify/${token}`)
      .then(response => resolve(saveJWT(response)))
      .catch(error => reject(error.message));
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/reset-password/${token}`, { password })
      .then(() => resolve())
      .catch(error => reject(error.response?.data || error));
  });
}

export async function createProject({
  name,
  numberOfDistricts,
  regionConfig,
  districtsDefinition
}: CreateProjectData): Promise<IProject> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post("/api/projects", { name, numberOfDistricts, regionConfig, districtsDefinition })
      .then(response => resolve(response.data))
      .catch(error => reject(error.response?.data || error));
  });
}

async function fetchProject(id: ProjectId): Promise<IProject> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get(`/api/projects/${id}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchProjectGeoJson(id: ProjectId): Promise<DistrictsGeoJSON> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get(`/api/projects/${id}/export/geojson`)
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchProjects(): Promise<readonly IProject[]> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/projects")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchProjectData(id: ProjectId): Promise<DynamicProjectData> {
  return Promise.all([fetchProject(id), fetchProjectGeoJson(id)]).then(([project, geojson]) => ({
    project,
    geojson
  }));
}

export async function fetchRegionConfigs(): Promise<IRegionConfig> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/region-configs?sort=name,ASC")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function patchProject(
  id: ProjectId,
  projectData: Partial<IProject>
): Promise<IProject> {
  return new Promise((resolve, reject) => {
    apiAxios
      .patch(`/api/projects/${id}`, projectData)
      .then(response => resolve(response.data))
      .catch(() => reject());
  });
}

export async function exportProjectCsv(project: IProject): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get(`/api/projects/${project.id}/export/csv`)
      .then(response => {
        return resolve(
          saveAs(
            new Blob([response.data], { type: "text/csv;charset=utf-8" }),
            `${project.name}.csv`
          )
        );
      })
      .catch(error => reject(error.message));
  });
}

export async function exportProjectShp(project: IProject): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get(`/api/projects/${project.id}/export/shp`, { responseType: "blob" })
      .then(response => {
        return resolve(
          saveAs(new Blob([response.data], { type: "application/zip" }), `${project.name}.zip`)
        );
      })
      .catch(error => reject(error.message));
  });
}
