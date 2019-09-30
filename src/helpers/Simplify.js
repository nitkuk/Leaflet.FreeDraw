import { Point } from "leaflet";
import TurfUnkinkPolygon from "@turf/unkink-polygon";
import { compose } from "ramda";
import createPolygon from "turf-polygon";
import TurfClean from "@turf/clean-coords";
import { multiPolygon } from "@turf/helpers";

/**
 * @method roundOffLatLng
 * @param {LatLng} latLng
 * @return {LatLng}
 */
export const roundOffLatLng = latLng => {
  const newLat = +latLng.lat.toFixed(7);
  const newLng = +latLng.lng.toFixed(7);
  return {
    lat: newLat,
    lng: newLng
  };
};

/**
 * @method latLngsToClipperPoints
 * @param {Object} map
 * @param {LatLng[]} latLngs
 * @return {Array}
 */
export const latLngsToClipperPoints = (map, latLngs) => {
  return latLngs.map(latLng => {
    const point = map.project(latLng, 18); // 18 which is our max zoom
    return { X: point.x, Y: point.y };
  });
};

/**
 * @method clipperPolygonsToLatLngs
 * @param {Object} map
 * @param {Array} polygons
 * @return {Array}
 */
const clipperPolygonsToLatLngs = (map, polygons) => {
  return polygons.map(polygon => {
    return polygon.map(point => {
      const updatedPoint = new Point(point.X, point.Y);
      return roundOffLatLng(map.unproject(updatedPoint, 18));
    });
  });
};

/**
 * @method latLngsToTuple
 * @param {Array} latLngs
 * @return {Array}
 */
function latLngsToTuple(latLngs) {
  return latLngs.map(model => [model.lat, model.lng]);
}

/**
 * @param {Object} map
 * @param {LatLng[]} latLngs
 * @param {Object} options
 * @return {LatLng[]}
 */
export default latLngs => {
  const toTurfPolygon = compose(
    createPolygon,
    x => [x],
    latLngsToTuple
  );
  console.log({ latLngs });
  const turfPolygon = multiPolygon([latLngs]);
  console.log({ turfPolygon });
  const unkinkedPolygons = TurfUnkinkPolygon(TurfClean(turfPolygon));
  console.log({ unkinkedPolygons });
  return unkinkedPolygons.features[0].geometry.coordinates;
};
