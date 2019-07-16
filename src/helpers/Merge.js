import { Point } from "leaflet";
import { flatten, identical, complement, compose, head } from "ramda";
import { Clipper, PolyFillType } from "clipper-lib";
import createPolygon from "turf-polygon";
import isIntersecting from "turf-intersect";
import TurfUnkinkPolygon from "@turf/unkink-polygon";
import { createFor, removeFor } from "./Polygon";
import { latLngsToClipperPoints, roundOffLatLng } from "./Simplify";
import TurfUnion from "@turf/union";
import TurfClean from "@turf/clean-coords";

const toTurfPolygon = compose(
  createPolygon,
  x => [x],
  x => [...x, head(x)],
  latLngsToTuple
);

/**
 * @method fillPolygon
 * @param {Object} map
 * @param {Array} polygons
 * @param {Object} options
 * @return {Array}
 */
export function fillPolygon(map, polygon, options) {
  // Unkink the polygon.
  console.log("in fill");
  const turfPolygon = toTurfPolygon(polygon.getLatLngs()[0]);
  const unkinkedPolygons = TurfUnkinkPolygon(TurfClean(turfPolygon));
  console.log({ unkinkedPolygons });
  removeFor(map, polygon);

  unkinkedPolygons.features.map(feature => {
    createFor(
      map,
      tupleTolatLngs(feature.geometry.coordinates[0]),
      options,
      true
    );
  });
}

/**
 * @method latLngsToTuple
 * @param {Array} latLngs
 * @return {Array}
 */
function latLngsToTuple(latLngs) {
  return latLngs.map(model => [model.lat, model.lng]);
}

function tupleTolatLngs(latLngs) {
  return latLngs.map(ll => ({ lat: ll[0], lng: ll[1] }));
}

/**
 * @param {Object} map
 * @param {Array} polygons
 * @param {Object} options
 * @return {Array}
 */
export default (map, polygons, options) => {
  // Transform a L.LatLng object into a GeoJSON polygon that TurfJS expects to receive.

  const analysis = polygons.reduce(
    (accum, polygon) => {
      const latLngs = polygon.getLatLngs()[0];
      const turfPolygon = toTurfPolygon(latLngs);

      // Determine if the current polygon intersects any of the other polygons currently on the map.
      const intersects = polygons
        .filter(complement(identical(polygon)))
        .some(polygon => {
          return Boolean(
            isIntersecting(turfPolygon, toTurfPolygon(polygon.getLatLngs()[0]))
          );
        });

      const key = intersects ? "intersecting" : "rest";

      return {
        ...accum,
        [key]: [...accum[key], latLngs],
        intersectingPolygons: intersects
          ? [...accum.intersectingPolygons, polygon]
          : accum.intersectingPolygons
      };
    },
    { intersecting: [], rest: [], intersectingPolygons: [] }
  );

  // Merge all of the polygons.
  //   const mergePolygons = Clipper.SimplifyPolygons(
  //     analysis.intersecting,
  //     PolyFillType.pftNonZero
  //   );

  const intersectingTurfPolygons = analysis.intersecting.map(latLngs =>
    toTurfPolygon(latLngs)
  );

  console.log("merge", intersectingTurfPolygons);
  debugger;
  if (intersectingTurfPolygons.length) {
    const mergePolygons = TurfUnion(...intersectingTurfPolygons);
    // Remove all of the existing polygons that are intersecting another polygon.
    analysis.intersectingPolygons.forEach(polygon => removeFor(map, polygon));
    console.log({ mergePolygons });

    const isMultiPolygon = mergePolygons.geometry.type === "MultiPolygon";
    const coordinates = mergePolygons.geometry.coordinates;

    const abc = isMultiPolygon
      ? coordinates.map(coords => {
          createFor(map, tupleTolatLngs(coords[0]), options, true);
        })
      : createFor(map, tupleTolatLngs(coordinates[0]), options, true);
    return abc;
  }
  return [];

  // return flatten(
  //   mergePolygons.map(polygon => {
  //     // Determine if it's an intersecting polygon or not.
  //     //   const latLngs = polygon.map(model => {
  //     //     return map.unproject(new Point(model.X, model.Y), 18);
  //     //   });

  //     console.log({});

  //     // Create the polygon, but this time prevent any merging, otherwise we'll find ourselves
  //     // in an infinite loop.
  //     return createFor(map, latLngs, options, true);
  //   })
  // );
};
