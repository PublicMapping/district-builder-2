export enum ForgotPasswordResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum LoginErrors {
  NOT_FOUND = "NOT_FOUND",
  INVALID_PASSWORD = "INVALID_PASSWORD"
}

export enum MakeDistrictsErrors {
  TOPOLOGY_NOT_FOUND = "TOPOLOGY_NOT_FOUND",
  INVALID_DEFINITION = "INVALID_DEFINITION"
}

export enum JoinOrganizationErrors {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND"
}

export enum RegisterResponse {
  SUCCESS = "SUCCESS",
  DUPLICATE = "DUPLICATE",
  INVALID = "INVALID"
}

export enum ResendResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum ResetPasswordResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum VerifyEmailErrors {
  NOT_FOUND = "NOT_FOUND"
}

export enum ProjectVisibility {
  Private = "PRIVATE",
  Visible = "VISIBLE",
  Published = "PUBLISHED"
}
