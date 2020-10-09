/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  jsx,
  Label,
  Radio,
  ThemeUIStyleObject,
  Styled
} from "theme-ui";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { IProject, IRegionConfig } from "../../shared/entities";
import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject } from "../api";
import { InputField, SelectField } from "../components/Field";
import FormError from "../components/FormError";
import { State } from "../reducers";
import { RegionConfigState } from "../reducers/regionConfig";
import { WriteResource } from "../resource";
import store from "../store";

interface StateProps {
  readonly regionConfigs: RegionConfigState;
}

const validate = (form: ProjectForm) =>
  form.name.trim() !== "" && form.numberOfDistricts !== null && form.regionConfig !== null
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface ProjectForm {
  readonly name: string;
  readonly regionConfig: IRegionConfig | null;
  readonly numberOfDistricts: number | null;
  readonly isCustom: boolean;
}

interface ValidForm {
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly numberOfDistricts: number;
  readonly isCustom: boolean;
  readonly valid: true;
}

interface InvalidForm extends ProjectForm {
  readonly valid: false;
}

const CreateProjectScreen = ({ regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);
  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ProjectForm, IProject>
  >({
    data: {
      name: "",
      regionConfig: null,
      numberOfDistricts: null,
      isCustom: false
    }
  });
  const { data } = createProjectResource;

  const onDistrictChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chamber =
      data.regionConfig !== null
        ? data.regionConfig.chambers.find(chamber => chamber.id === e.currentTarget.value)
        : null;
    setCreateProjectResource({
      data: {
        ...data,
        ...(chamber
          ? {
              numberOfDistricts: chamber.numberOfDistricts,
              isCustom: false
            }
          : { numberOfDistricts: null, isCustom: true })
      }
    });
  };

  const style: ThemeUIStyleObject = {
    header: {
      py: 3,
      px: 5,
      alignItems: "center",
      bg: "blue.8",
      borderBottom: "1px solid",
      borderColor: "blue.7",
      boxShadow: "bright"
    },
    formContainer: {
      width: "100%",
      maxWidth: "medium",
      my: 7,
      mx: "auto",
      flexDirection: "column",
      "@media screen and (max-width: 770px)": {
        width: "95%",
        my: 2
      }
    },
    cardLabel: {
      textTransform: "none",
      variant: "text.h4",
      display: "block",
      mb: 1
    },
    cardHint: {
      display: "block",
      textTransform: "none",
      fontWeight: "normal",
      fontSize: 1,
      mb: 4
    },
    radioHeading: {
      textTransform: "none",
      variant: "text.body",
      fontSize: 2,
      lineHeight: "heading",
      letterSpacing: "0",
      mb: "0",
      color: "heading",
      fontWeight: "body"
    },
    radioSubHeading: {
      fontSize: 1,
      letterSpacing: "0",
      textTransform: "none"
    },
    customInputContainer: {
      mt: 2,
      width: "100%",
      pt: 4,
      borderTop: "1px solid",
      borderColor: "gray.2"
    },
    legend: {
      paddingInlineStart: "0",
      paddingInlineEnd: "0"
    },
    fieldset: {
      border: "none",
      marginInlineStart: "0",
      marginInlineEnd: "0",
      paddingInlineStart: "0",
      paddingInlineEnd: "0",
      paddingBlockEnd: "0"
    }
  };

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : (
    <Flex
      sx={{
        flexDirection: "column",
        minHeight: "100vh"
      }}
    >
      <Flex sx={style.header}>
        <Box as="h1" sx={{ lineHeight: "0", mr: 3 }}>
          <Link
            to="/"
            sx={{
              lineHeight: "0",
              borderRadius: "small",
              "&:focus": {
                outline: "none",
                boxShadow: "focus"
              }
            }}
          >
            <Logo sx={{ width: "2rem" }} />
          </Link>
        </Box>
        <Heading as="h2" sx={{ variant: "text.h4", color: "blue.0", my: 0 }}>
          New Map
        </Heading>
      </Flex>
      <Flex as="main" sx={{ width: "100%" }}>
        <Flex sx={style.formContainer}>
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(data);
              // Disabling 'functional/no-conditional-statement' without naming it.
              // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
              // eslint-disable-next-line
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data, isPending: true });
                createProject({
                  ...validatedForm,
                  numberOfDistricts: validatedForm.numberOfDistricts
                })
                  .then((project: IProject) =>
                    setCreateProjectResource({ data, resource: project })
                  )
                  .catch(errors => setCreateProjectResource({ data, errors }));
              }
            }}
          >
            <Card sx={{ variant: "card.flat" }}>
              <FormError resource={createProjectResource} />
              <InputField
                field="name"
                label={
                  <Box as="span" sx={style.cardLabel}>
                    Map name
                  </Box>
                }
                description={
                  <Box as="span" sx={style.cardHint}>
                    e.g. ‘Arizona House of Representatives’. Make it specific to help tell your maps
                    apart.
                  </Box>
                }
                resource={createProjectResource}
                inputProps={{
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateProjectResource({
                      data: { ...data, name: e.currentTarget.value }
                    })
                }}
              />
            </Card>
            <Card sx={{ variant: "card.flat" }}>
              <SelectField
                field="regionConfig"
                label={
                  <Box as="span" sx={style.cardLabel}>
                    State
                  </Box>
                }
                description={
                  <Box as="span" sx={style.cardHint}>
                    What state do you want to map? If you don’t see it in the list,{" "}
                    <Styled.a href="mailto:support@districtbuilder.org">let us know!</Styled.a>
                  </Box>
                }
                resource={createProjectResource}
                selectProps={{
                  onChange:
                    "resource" in regionConfigs
                      ? (e: React.ChangeEvent<HTMLSelectElement>) => {
                          const regionConfig = regionConfigs.resource.find(
                            regionConfig => regionConfig.id === e.currentTarget.value
                          );
                          setCreateProjectResource({
                            data: { ...data, regionConfig: regionConfig || null }
                          });
                        }
                      : undefined
                }}
              >
                <option>Select...</option>
                {"resource" in regionConfigs
                  ? regionConfigs.resource.map(regionConfig => (
                      <option key={regionConfig.id} value={regionConfig.id}>
                        {regionConfig.name}
                      </option>
                    ))
                  : null}
              </SelectField>
            </Card>
            {data.regionConfig ? (
              <Card sx={{ variant: "card.flat" }}>
                <fieldset sx={style.fieldset}>
                  <Flex sx={{ flexWrap: "wrap" }}>
                    <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                      Districts
                    </legend>
                    <Box
                      id="description-districts"
                      as="span"
                      sx={{ ...style.cardHint, ...{ flex: "0 0 100%" } }}
                    >
                      How many districts do you want to map? Choose a federal or state legislative
                      chamber or define your own.
                    </Box>
                    {data.regionConfig &&
                      [...data.regionConfig.chambers]
                        .sort((a, b) => a.numberOfDistricts - b.numberOfDistricts)
                        .map(chamber => (
                          <Label
                            key={chamber.id}
                            sx={{
                              display: "inline-flex",
                              "@media screen and (min-width: 750px)": {
                                flex: "0 0 48%",
                                "&:nth-of-type(even)": {
                                  mr: "2%"
                                }
                              }
                            }}
                          >
                            <Radio
                              name="project-district"
                              value={chamber.id}
                              onChange={onDistrictChanged}
                              aria-describedby="description-districts"
                            />
                            <Flex
                              as="span"
                              sx={{ flexDirection: "column", flex: "0 1 calc(100% - 2rem)" }}
                            >
                              <div sx={style.radioHeading}>{chamber.name}</div>
                              <div sx={style.radioSubHeading}>
                                {chamber.numberOfDistricts} districts
                              </div>
                            </Flex>
                          </Label>
                        ))
                        .concat(
                          <div
                            sx={{
                              flex: "0 0 50%",
                              "@media screen and (max-width: 770px)": {
                                flex: "0 0 100%"
                              }
                            }}
                            key="custom"
                          >
                            <Label>
                              <Radio
                                name="project-district"
                                value=""
                                onChange={onDistrictChanged}
                              />
                              <Flex as="span" sx={{ flexDirection: "column" }}>
                                <div sx={style.radioHeading}>Custom</div>
                                <div sx={style.radioSubHeading}>
                                  Define a custom number of districts
                                </div>
                              </Flex>
                            </Label>
                          </div>
                        )}
                    {data.isCustom ? (
                      <Box sx={style.customInputContainer}>
                        <InputField
                          field="numberOfDistricts"
                          label="Number of districts"
                          resource={createProjectResource}
                          inputProps={{
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = parseInt(e.currentTarget.value, 10);
                              const numberOfDistricts = isNaN(value) ? null : value;
                              setCreateProjectResource({
                                data: {
                                  ...data,
                                  numberOfDistricts,
                                  isCustom: true
                                }
                              });
                            }
                          }}
                        />
                      </Box>
                    ) : null}
                  </Flex>
                </fieldset>
              </Card>
            ) : (
              undefined
            )}
            <Box sx={{ mt: 3, textAlign: "left" }}>
              <Button
                type="submit"
                disabled={
                  (("isPending" in createProjectResource && createProjectResource.isPending) ||
                    !validate(data).valid) &&
                  !("errorMessage" in createProjectResource)
                }
              >
                Create map
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    regionConfigs: state.regionConfig
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
