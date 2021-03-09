/** @jsx jsx */
import { useMemo } from "react";
import { Button, Flex, jsx } from "theme-ui";
import store from "../store";
import { toggleProjectFeatured } from "../actions/organizationProjects";
import { OrganizationSlug, OrgProject } from "../../shared/entities";
import { useTable, Row, HeaderGroup, Cell, useSortBy } from "react-table";

interface ProjectsTableProps {
  readonly projects: readonly OrgProject[];
  readonly organizationSlug: OrganizationSlug;
}

const style = {
  main: { width: "100%", mx: 0, flexDirection: "column" },
  columnHeader: {
    borderBottom: "solid 3px red",
    background: "aliceblue",
    color: "black",
    fontWeight: "bold"
  },
  columnRow: { padding: "10px", border: "solid 1px gray" }
} as const;

const OrganizationAdminProjectsTable = ({ projects, organizationSlug }: ProjectsTableProps) => {
  const columns = useMemo(
    () => [
      {
        Header: "Map",
        accessor: "name" // accessor is the "key" in the data
      },
      {
        Header: "Template",
        accessor: "templateName"
      },
      {
        Header: "Creator",
        accessor: "creator"
      },
      {
        Header: "Updated on",
        accessor: "updatedAgo"
      }
    ],
    []
  );
  const data = useMemo(() => projects, [projects]);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<OrgProject>(
    {
      // @ts-ignore
      columns,
      // @ts-ignore
      data
    },
    useSortBy
  );

  function projectFeaturedToggle(row: Row<OrgProject>) {
    store.dispatch(
      toggleProjectFeatured({ project: row.original, organization: organizationSlug })
    );
  }

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <table {...getTableProps()} style={{ border: "solid 1px blue" }}>
        <thead>
          {headerGroups.map((headerGroup: HeaderGroup<OrgProject>) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: HeaderGroup<OrgProject>) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  sx={style.columnHeader}
                >
                  {column.render("Header")}
                  <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                </th>
              ))}
              <th sx={style.columnHeader}></th>
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row<OrgProject>) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell: Cell<OrgProject>) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        padding: "10px",
                        border: "solid 1px gray"
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
                <td>
                  <Button onClick={() => projectFeaturedToggle(row)}>
                    {/* @ts-ignore */
                    row.original.isFeatured ? "Unfeature" : "Feature"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Flex>
  );
};

export default OrganizationAdminProjectsTable;
