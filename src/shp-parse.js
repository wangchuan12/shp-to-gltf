import shp from "shpjs/dist/shp.js"
import Convert from "./convert.js"
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, EventDispatcher, Matrix4, Mesh, MeshPhysicalMaterial, Object3D, ObjectLoader, Vector3 } from "three"
import {GLTFExporter} from './export/GLTFExporterNode.js'
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter.js'
import {STLExporter} from 'three/examples/jsm/exporters/STLExporter.js'
import { toMercator } from "@turf/projection"
import center from "@turf/center"
import define from "./util/define.js"
import { OBJExporterNode } from "./export/OBJExporterNode.js"
const baseColor = new Color()
export default class ShpParse extends EventDispatcher{
    constructor(){
        super()
    }

    /**
     * 
     * @param {string} url 
     * @param {{height : string , center : boolean , chunk ?: number , outputType ?: string}} option
     */
    async parseWithUrl(url , option){
        const res = await fetch(url)

        const buffer = await res.arrayBuffer()

        return await this.parseWithBuffer(buffer, option)
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
     * @param {Array<import("@turf/helpers").Feature>} arr 
     * @param {number} size 
     * @returns 
     */
    _getChunk(arr , size){
        let tem = []
        const arr2 = []
        for (let i = 0 ; i < arr.length ; i++) {
            if (i !== 0 && i % size === 0) {
                arr2.push(tem)
                tem = []
                continue
            }

            tem.push(arr[i])
        }

        if (tem.length) {
            arr2.push(tem)
        }
        
        return arr2
    }
    

    /**
     * 
     * @param {ArrayBuffer} buffer 
     * @param {{height : string , center : boolean , chunk ?: number , outputType ?: string}} option 
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

        console.log('========parse SHP Done======' , geojson.features.length)

        this._emitProgress({
            currentSize : 0,
            size : geojson.features.length
        })

        if (["Polygon" , "MultiPolygon"].includes(geojson.features[0].geometry.type)) {
            let tem = []
            if (define(option.chunk)) {
                tem = this._getChunk(geojson.features , option.chunk)
            } else {
                tem = [geojson.features]
            }

            const glbs = []

            for (let i = 0 ; i < tem.length ; i++) {
                const geo = this._dealPolygon(tem[i] , option.height)
                let mat = new Matrix4().makeRotationX(-Math.PI / 2)
                if (option?.outputType === 'stl') mat = new Matrix4()
                if (option.center) {
                    mat.multiply(new Matrix4().makeTranslation(new Vector3(box.geometry.coordinates[0] , box.geometry.coordinates[1] , 0).negate()))
                }

                geo.applyMatrix4(mat)

                const mesh = new Mesh(geo , new MeshPhysicalMaterial({
                    side : DoubleSide,
                    vertexColors : this.colors ? true : false
                }))

                switch(option.outputType) {
                    case 'obj':
                        const obj = await this._toOBJ(mesh)
                        this._emitChunk({
                            type : "obj",
                            data : obj
                        })
                        glbs.push(obj)
                        break
                    case 'stl' :
                        const stl = await this._toSTL(mesh)
                        this._emitChunk({
                            type : "stl",
                            data : obj
                        })
                        glbs.push(stl)
                        break
                    default : {
                        const glb = await this._toGlb(mesh)
                        this._emitChunk({
                            type : "glb",
                            data : glb
                        })
                        glbs.push(glb)
                    }
                }
            }
            return glbs.length > 1 ? glbs : glbs[0]
        }
    }

    /**
     * 
     * @param {Object3D} object 
     */
    async _toOBJ(object){
        const obj = new OBJExporterNode()
        // if (this.stream) {
        //     obj.setWriteStream(this.stream)
        //     obj.parse(object)
        //     return null
        // }
        const data = obj.parse(object)
        return data
    }

    /**
     * 
     * @param {Object3D} object 
     */
    async _toSTL(object){
        const stl = new STLExporter()
        const data = stl.parse(object , {
            binary : true
        })

        return data
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
     * @param {{type : string , data : ArrayBuffer | string}} data 
     */
    _emitChunk(data){
        const e = {
            type : "chunk",
            data : data
        }

        this.dispatchEvent(e)
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
