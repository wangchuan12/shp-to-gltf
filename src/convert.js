import { Path, Shape, ExtrudeGeometry, Vector2} from "three"
export default class Convert{
    /**
     * 
     * @param {import("@turf/helpers").Polygon} geojson
     * @param {number} [depth=1]  
     */
    static polygonToGeometry(geojson , depth = 1){
        const shape = new Shape()
        for (let i = 0 ; i < geojson.coordinates.length ;i++) {
            if (i === 0) {
                shape.setFromPoints(geojson.coordinates[i].map(point => new Vector2().fromArray(point)))
                continue
            }

            shape.holes.push(
                this._toRingToBufferGeometry(geojson.coordinates[i])
            )
        }

        return new ExtrudeGeometry(shape , {
            depth : depth,
        })

    }

    /**
     * 
     * @param {import("@turf/helpers").LineString} geojson 
     */
    static polylineToGeometry(geojson){
        const points = []
        for (let i = 0 ; i < geojson.coordinates.length; i++) {
            points.push(
                geojson.coordinates[i][0],
                geojson.coordinates[i][1],
                0,
            )
        }
        return points
    }

    /**
     * 
     * @param {Array<[number , number]>} points 
     */
    static _toRingToBufferGeometry(points){
        return new Path(points.map(item => new Vector2().fromArray(item)))
    }
}