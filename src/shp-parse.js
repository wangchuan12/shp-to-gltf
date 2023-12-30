import shp from "shpjs/dist/shp.js"
import Convert from "./convert.js"
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, EventDispatcher, Matrix4, Mesh, MeshPhysicalMaterial, Object3D, Vector3 } from "three"
import {GLTFExporter} from './export/GLTFExporterNode.js'
import { toMercator } from "@turf/projection"
import center from "@turf/center"
const baseColor = new Color()
export default class ShpPrase extends EventDispatcher{
    constructor(){
        super()
    }

    parseWithUrl(){}

    /**
     * 
     * @param {{size : number , currentSize : number}} data 
     */
    _emitProgress(data){
        const e = {
            type : "progress",
            data : data
        }

        this.dispatchEvent(e)
    }

    /**
     * 
     * @param {{filed : string , style : Array<{range:[number , number] , color : string}> , defaultColor : string}} colors 
     */
    setColorJson(colors){
        this.colors = colors
    }

    /**
     * 
     * @param {ArrayBuffer} buffer 
     * @param {{height : string , center : boolean}} option 
     * 
     * 
     */
    async parseWithBuffer(buffer , option){
        console.log('=======parse SHP=======')
        const tem = await this._getGeoJson(buffer)

        const geojson = toMercator(tem , {
            mutate : true
        })
        const box = center(geojson)

        console.log('========parse SHP Done======')

        this._emitProgress({
            currentSize : 0,
            size : geojson.features.length
        })

        if (["Polygon" , "MultiPolygon"].includes(geojson.features[0].geometry.type)) {
            const geo = this._dealPolygon(geojson.features , option.height)
            const mat = new Matrix4().makeRotationX(-Math.PI / 2)
            if (option.center) {
                mat.multiply(new Matrix4().makeTranslation(new Vector3(box.geometry.coordinates[0] , box.geometry.coordinates[1] , 0).negate()))
            }

            geo.applyMatrix4(mat)

            const mesh = new Mesh(geo , new MeshPhysicalMaterial({
                side : DoubleSide,
                vertexColors : this.colors ? true : false
            }))

            const glb = await this._toGlb(mesh)

            return glb
        }
    }
    
    /**
     * 
     * @param {Object3D} object 
     */
    async _toGlb(object){
        const exporters = new GLTFExporter()
        
        const glb = await exporters.parseAsync(object , {
            binary : true
        })


        return glb
    }

    /**
     * 
     * @param {Array<import("@turf/helpers").Feature<import("@turf/helpers").Polygon | import("@turf/helpers").MultiPolygon>>} data 
     * @param {string} height 
     */
    _dealPolygon(data , height){
        const geo = []
        for (let i = 0 ; i < data.length ; i++) {
            this._emitProgress({
                size : data.length,
                currentSize : i
            })
            const item = data[i]
            if (item.geometry.type === "Polygon") {
                if (height) {
                    geo.push(Convert.polygonToGeometry(item.geometry , item.properties[height] || 0))
                    if (this.colors) {
                       this._setBufferGeometryColor(geo.at(-1) , this._getColor(item))
                    }
                } else {
                    geo.push(Convert.polygonToShapeGeometry(item.geometry))
                    if (this.colors) {
                       this._setBufferGeometryColor(geo.at(-1) , this._getColor(item))
                    }
                }
            }

            if (item.geometry.type === 'MultiPolygon') {
                if (height) {
                    item.geometry.coordinates.forEach((ca)=>{
                        geo.push(Convert.polygonToGeometry(
                            {
                                type : "Polygon",
                                coordinates : ca
                            }
                        ) ,  item.properties[height] || 0)
                        if (this.colors) {
                            this._setBufferGeometryColor(geo.at(-1) , this._getColor(item))
                         }
                    })
                } else {
                    item.geometry.coordinates.forEach((ca)=>{
                        geo.push(Convert.polygonToShapeGeometry(
                            {
                                type : "Polygon",
                                coordinates : ca
                            }
                        ))
                        if (this.colors) {
                            this._setBufferGeometryColor(geo.at(-1) , this._getColor(item))
                         }
                    })
                }
            }

        }

        const mainGeo = mergeGeometries(geo , true)

        return mainGeo
    }

    /**
     * 
     * @param {import("@turf/helpers").Feature} fe 
     */
    _getColor(fe){
        const data = fe.properties[this.colors.filed]
        let item;
        if (data !== null && data !== undefined) {
            item =  this.colors.style.find((color)=>{return color.range[0] < data && color.range[1] > data})
        }

        if (item) return item.color

        return this.colors.defaultColor
    }

    /**
     * 
     * @param {BufferGeometry} geometry 
     * @param {string} color 
     */
    _setBufferGeometryColor(geometry , color){
        const position = geometry.getAttribute('position')
        baseColor.set(color)
        const colorArr = []
        for (let i = 0 ; i < position.array.length ; i += 3) {
            colorArr.push(
                baseColor.r ,
                baseColor.g ,
                baseColor.b
            )
        }

        const att = new BufferAttribute(new Float32Array(colorArr) , 3)
        geometry.setAttribute('color' , att)
    }


    /**
     * 
     * @param {Array<import("@turf/helpers").LineString | import("@turf/helpers").MultiLineString>} geojson 
     */
    _dealPolyline(geojson){
    }



    /**
     * 
     * @param {ArrayBuffer | string} data 
     * @returns {import("@turf/helpers").FeatureCollection}
     */
    async _getGeoJson(data){
        return await shp(data)
    }
}
