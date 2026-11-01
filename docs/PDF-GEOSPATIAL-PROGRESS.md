# Geospatial PDF implementation

The native codec, parent validator/service, document-engine operations, main/preload bridges and reader workspace are integrated and compiled October 9. Source inspection reads real page Viewport/Measure dictionaries and CRS metadata. Supported affine calibration uses WGS84 coordinates or a conservatively identified EPSG:3857 definition; ambiguous or unsupported projections are refused. Queries are restricted to declared map bounds and the calibration control hull. Numeric residuals, units, projection assumptions and source fingerprint accompany results.

The workspace shows actual page artwork, optional layer choices, calibrated controls/bounds, clicked or manually entered PDF coordinates, point/path distances and optional user-provided known-reference comparison. WGS84 ellipsoid distance uses Vincenty with explicit nonconvergence refusal. It does not infer coordinate accuracy from display precision or treat ordinary drawing scale as geographic registration.

Whole-source operations remain limited to 100 MiB. Broader CRS, ambiguous registrations, large-file staging, known-map accuracy, layer/cancel/coordinate UI and adversarial acceptance remain pending. No runtime or document test was run. See [October 9 checkpoint](INTEGRATED-FEATURES-CODING-2026-10-09.md).
