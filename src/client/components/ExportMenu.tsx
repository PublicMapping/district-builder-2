/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { IProject } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { exportCsv, exportGeoJson, exportShp } from "../actions/projectData";

enum UserMenuKeys {
  ExportCsv = "csv",
  ExportShapefile = "shp",
  ExportGeoJson = "geojson"
}

interface ExportProps {
  readonly invert?: boolean;
  readonly project: IProject;
}

const ExportMenu = (props: ExportProps) => {
  return (
    <Wrapper
      sx={{ position: "relative", pr: 1 }}
      onSelection={(userMenuKey: string) => {
        const action =
          userMenuKey === UserMenuKeys.ExportCsv
            ? exportCsv
            : userMenuKey === UserMenuKeys.ExportShapefile
            ? exportShp
            : exportGeoJson;
        store.dispatch(action(props.project));
      }}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="export-menu"
      >
        <Icon name="export" />
        Export
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.ExportCsv}>
            <MenuItem value={UserMenuKeys.ExportShapefile}>
              <Box sx={style.menuListItem}>Export Shapefile</Box>
            </MenuItem>
            <MenuItem value={UserMenuKeys.ExportCsv}>
              <Box sx={style.menuListItem}>Export CSV</Box>
            </MenuItem>
            <MenuItem value={UserMenuKeys.ExportGeoJson}>
              <Box sx={style.menuListItem}>Export GeoJSON</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ExportMenu;
