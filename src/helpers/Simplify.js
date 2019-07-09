import { Point } from 'leaflet';
import { Clipper, PolyFillType } from 'clipper-lib';


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
 * @param {Object} map
 * @param {LatLng[]} latLngs
 * @param {Object} options
 * @return {LatLng[]}
 */
export default (map, latLngs, options) => {
    const polygons = Clipper.SimplifyPolygon(latLngsToClipperPoints(map, latLngs), PolyFillType.pftNonZero);

    return clipperPolygonsToLatLngs(map, polygons);

};
