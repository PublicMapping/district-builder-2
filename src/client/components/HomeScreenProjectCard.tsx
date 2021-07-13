/** @jsx jsx */
import { Box, Flex, Heading, jsx, Spinner } from "theme-ui";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import bbox from "@turf/bbox";
import { useHistory } from "react-router-dom";

import { BBox2d } from "@turf/helpers/lib/geojson";

import { IProject } from "../../shared/entities";
import { DistrictGeoJSON } from "../types";
import { getDistrictColor } from "../constants/colors";
import ProjectListFlyout from "./ProjectListFlyout";
import TimeAgo from "timeago-react";

const style = {
  featuredProject: {
    width: "100%",
    bg: "#fff",
    borderRadius: "2px",
    display: "inline-block",
    mb: "20px",
    boxShadow: "small"
  },
  mapContainer: {
    width: "300px",
    height: "250px",
    display: "inline-block",
    position: "relative",
    p: "15px"
  },
  map: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    pl: "20px",
    right: 0
  },
  mapLabel: {
    p: "15px",
    display: "inline-block",
    width: "600px",
    pl: "100px",
    borderColor: "gray.2",
    position: "absolute"
  },
  projectTitle: {
    display: "inline-block",
    width: "300px",
    "&:hover": {
      cursor: "pointer"
    }
  },
  projectRow: {
    textDecoration: "none",
    display: "flex",
    alignItems: "baseline",
    borderRadius: "med",
    marginRight: "auto",
    px: 1,
    "&:hover:not([disabled])": {
      bg: "rgba(256,256,256,0.2)",
      h2: {
        color: "primary",
        textDecoration: "underline"
      },
      p: {
        color: "blue.6"
      }
    },
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
  flyoutButton: {
    position: "absolute",
    top: "5px",
    right: "10px"
  }
} as const;

const HomeScreenProjectCard = ({ project }: { readonly project: IProject }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const history = useHistory();

  function goToProject(project: IProject) {
    history.push(`/projects/${project.id}`);
  }
  // TODO #179 - the districts property can't be defined in the shared/entities.d.ts right now
  // @ts-ignore
  const districts: DistrictsGeoJSON | undefined = project.districts;

  useEffect(() => {
    if (mapRef.current === null) {
      return;
    }

    if (districts) {
      districts.features.forEach((feature: DistrictGeoJSON, id: number) => {
        // eslint-disable-next-line
        feature.properties.color = getDistrictColor(id);
      });

      const bounds = districts && (bbox(districts) as BBox2d);
      const map = new MapboxGL.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {},
          layers: []
        },
        bounds,
        fitBoundsOptions: { padding: 15 },
        interactive: false
      });

      map.on("load", function() {
        districts &&
          map.addSource("districts", {
            type: "geojson",
            data: districts
          });
        map.addLayer({
          id: "districts",
          type: "fill",
          source: "districts",
          layout: {},
          paint: {
            "fill-color": { type: "identity", property: "color" }
          }
        });
        map.resize();

        setMapLoaded(true);
      });
    }
  }, [mapRef, districts]);

  return (
    <Flex sx={style.featuredProject}>
      <Box sx={style.mapContainer}>
        <Box ref={mapRef} sx={style.map}></Box>
      </Box>
      {!mapLoaded && (
        <Box sx={{ ...style.mapContainer, ...{ position: "absolute" } }}>
          <Spinner variant="spinner.small" />
        </Box>
      )}
      <Box sx={style.mapLabel}>
        <Box sx={style.projectTitle} onClick={() => goToProject(project)}>
          <span sx={{ display: "inline-block" }}>
            <Heading
              as="h2"
              sx={{
                fontFamily: "heading",
                variant: "text.h5",
                fontWeight: "light",
                mr: 3
              }}
            >
              {project.name}
            </Heading>
          </span>
          <p sx={{ fontSize: 2, color: "gray.7" }}>
            ({project.regionConfig.name}, {project.numberOfDistricts} districts)
          </p>
        </Box>
        <span sx={style.flyoutButton}>
          <ProjectListFlyout project={project} sx={{ display: "inline-block" }} />
        </span>
        <div
          sx={{
            fontWeight: "light",
            color: "gray.5",
            paddingLeft: "5px"
          }}
        >
          Last updated <TimeAgo datetime={project.updatedDt} />
        </div>
      </Box>
      <span sx={style.flyoutButton}>
        <ProjectListFlyout project={project} sx={{ display: "inline-block" }} />
      </span>
    </Flex>
  );
};

export default HomeScreenProjectCard;
