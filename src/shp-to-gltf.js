#!/usr/bin/env node --max_old_space_size=8192
import * as fs from 'fs'
import ShpParse from './shp-parse.js'
import processGlb from 'gltf-pipeline/lib/processGlb.js'
import glbToGltf from 'gltf-pipeline/lib/glbToGltf.js'
import Deffer from './util/deffre.js'

const showHelp= ()=>{
    console.log('-h' , '      -----show help')
    console.log('-i' , '      -----input file path must a zip file')
    console.log('-o' , '      -----output file path')
    console.log('-c' , '      -----set model center to origin true is to origin false is not')
    console.log('-f' , '      -----set model extrudeHeight by shp filed')
    console.log('-d' , '      -----use draco compress model true is use false is not')
    console.log('-s' , '      -----style file path is a json a file to render per feature')
    console.log('-g' , '      -----It is used to group the output of elements. For example, -s 1000 is a glb output for every 1000 elements')
}
const options = {
    dracoOptions: {
      compressionLevel: 7,
    },
}

const isGltf = (path)=>{
    return path.search('.gltf') !== -1
}

const run = ()=>{
    console.time('done')
    // 获取命令行参数
    const args = process.argv.slice(2);

    const help = args.findIndex((item)=>{
        return item === '-h'
    }) 

    if (help !== -1) {
        showHelp()
        return
    }

    const draco = args.findIndex((item)=>{
        return item === '-d'
    })

    const inputPath = args[args.findIndex((item)=>{
        return item === '-i'
    }) + 1]

    const heightFiledIndex = args.findIndex(item => {
        return item === '-f'
    })

    let heightFiled = null
    if (heightFiledIndex !== -1) {
        heightFiled = args[heightFiledIndex + 1]
    }

    const colorConfigIndex = args.findIndex(item => {
        return item === '-s'
    })

    let colorConfig;
    if (colorConfigIndex !== -1) {
        colorConfig = fs.readFileSync(args[colorConfigIndex + 1])
        colorConfig = JSON.parse(colorConfig)
    }

    const chunkIndex = args.findIndex(item=> item === '-g')

    let chunkNumber = null

    if (chunkIndex !== -1) {
        chunkNumber = args[chunkIndex + 1]
    }

    const outputPath = args[args.findIndex(item => item === '-o') + 1]

    const center = args[args.findIndex(item => item === '-c') + 1]
    const buffer = fs.readFileSync(inputPath)

    const shpParse = new ShpParse()

    if (colorConfig) shpParse.setColorJson(colorConfig)

    shpParse.addEventListener('progress' , (e)=>{
        const {data} = e

        console.log(`convert shp to gltf ${data.currentSize} / ${data.size}` )
    })
    shpParse.parseWithBuffer(buffer , {
        height : heightFiled,
        center : center,
        chunk : chunkNumber
    }).then(async (data)=>{
        if (Array.isArray(data)) {
            let tem = outputPath.split('/')
            const base = tem.at(-1)
            for(let i = 0 ; i < data.length ; i++ ) {
                tem[tem.length - 1] = i + base
                await dealOneBuffer(data[i] , tem.join('/') , draco)
            }
            return
        } 

        await dealOneBuffer(data , outputPath , draco)

        console.timeEnd('done')
    })
}

const dealOneBuffer = async (data , name , draco)=>{
    let tem = Buffer.from(data)
        if (draco !== -1) {
           console.log('use draco compress glb or gltf......')
           console.time('use draco compress glb or gltf')
           const res = await processGlb(tem ,options )
           console.timeEnd('use draco compress glb or gltf')
           tem = res.glb
        }

        if (isGltf(name)) {
            const res = await glbToGltf(tem)
            tem = JSON.stringify(res.gltf)
        }
        const deffer = new Deffer()
        fs.writeFile(name , tem , (error)=>{
            if (error) {
                console.log(error)
                deffer.resolve(error)
                return
            }
            deffer.resolve()
        })

        await deffer.promise
}
try {
    run()
} catch (error) {
    console.error(error)
   showHelp()
}