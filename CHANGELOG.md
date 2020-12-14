# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added Shapefile export [#516](https://github.com/PublicMapping/districtbuilder/pull/516)
- Allow copying maps [#526](https://github.com/PublicMapping/districtbuilder/pull/526)
- Reduce problem with hidden base geounits [#528](https://github.com/PublicMapping/districtbuilder/pull/528)
- Find non-contiguous [#531](https://github.com/PublicMapping/districtbuilder/pull/531)
- Add last updated date to map list [#541](https://github.com/PublicMapping/districtbuilder/pull/541)

### Changed

### Fixed

## [1.2.0] - 2020-11-18

### Added

- Microcopy to Create Map and description props to text and select fields [#467](https://github.com/PublicMapping/districtbuilder/pull/467)
- Add product tour [#471](https://github.com/PublicMapping/districtbuilder/pull/471)
- Update data tooling [#468](https://github.com/PublicMapping/districtbuilder/pull/468)
- Find unassigned menu [#476](https://github.com/PublicMapping/districtbuilder/pull/476)
- Add support for single county region [#479](https://github.com/PublicMapping/districtbuilder/pull/479)
- Edit project name [#488](https://github.com/PublicMapping/districtbuilder/pull/488)
- Allow exporting plan to district index file CSV [#499](https://github.com/PublicMapping/districtbuilder/pull/499)

### Changed

- Updates to project page sharing & read-only mode [#469](https://github.com/PublicMapping/districtbuilder/pull/469)
- Specify max-old-space-size on server [#470](https://github.com/PublicMapping/districtbuilder/pull/470)
- Fix formatting of population counts [#474](https://github.com/PublicMapping/districtbuilder/pull/474)
- Make it possible to swap out the RDS DB parameter group [#478](https://github.com/PublicMapping/districtbuilder/pull/478)
- Allow saving with undo/redo [#498](https://github.com/PublicMapping/districtbuilder/pull/498)

### Fixed

- Fix region config validation error [#500](https://github.com/PublicMapping/districtbuilder/pull/500)

## [1.1.0] - 2020-10-08

### Added

- Project page sharing & read-only mode [#449](https://github.com/PublicMapping/districtbuilder/pull/449)
- Set keep-alive timeout higher than ALB idle timeout [#448](https://github.com/PublicMapping/districtbuilder/pull/448)
- Add basic k6 load test for PA/50 district project [#448](https://github.com/PublicMapping/districtbuilder/pull/448)
- Use web workers for real-time demographic updates [#452](https://github.com/PublicMapping/districtbuilder/pull/452)
- Undo/redo functionality on project page [#457](https://github.com/PublicMapping/districtbuilder/pull/457)

### Changed

### Fixed

## [1.0.0] - 2020-09-23

### Added

- Support menu on landing and project page [#435](https://github.com/PublicMapping/districtbuilder/pull/435)
- Allow for selecting partially locked districts [#420](https://github.com/PublicMapping/districtbuilder/pull/420)
- Show toast on errors [#437](https://github.com/PublicMapping/districtbuilder/pull/437)
- Add the ability to query ALB logs with Athena [#441](https://github.com/PublicMapping/districtbuilder/pull/441)
- Don't re-request data unnecessarily after saving project changes [#443](https://github.com/PublicMapping/districtbuilder/pull/443)

### Changed

- Make button group styles more consistent [#440](https://github.com/PublicMapping/districtbuilder/pull/440)
- Improved lock button UX [#436](https://github.com/PublicMapping/districtbuilder/pull/436)
- Allow for selecting partially locked districts [#420](https://github.com/PublicMapping/districtbuilder/pull/420)
- Add "Saved" notification in sidebar when map is successfully saved to cloud [#439](https://github.com/PublicMapping/districtbuilder/pull/439)
- Reduce noise in log output [#399](https://github.com/PublicMapping/districtbuilder/pull/399)
- Upgrade development database to PostgreSQL 12.2 and PostGIS 3 [#421](https://github.com/PublicMapping/districtbuilder/pull/421)

### Fixed

- Fix S3 permissions to allow CloudFront logging [#410](https://github.com/PublicMapping/districtbuilder/pull/410)
- Fix problem with highlighted resetting [#442](https://github.com/PublicMapping/districtbuilder/pull/442)
- Fix saved notification [#445](https://github.com/PublicMapping/districtbuilder/pull/445)

## [0.1.0] - 2020-09-14

- Initial release.

[unreleased]: https://github.com/publicmapping/districtbuilder/compare/1.2.0...HEAD
[1.2.0]: https://github.com/publicmapping/districtbuilder/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/publicmapping/districtbuilder/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/publicmapping/districtbuilder/compare/0.1.0...1.0.0
[0.1.0]: https://github.com/publicmapping/districtbuilder/compare/b9c63f4...0.1.0
