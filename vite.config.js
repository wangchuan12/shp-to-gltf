import { defineConfig } from "vite";

export default defineConfig({
    server : {
        host: '0.0.0.0'
    },
    build : {
        lib : {
            entry : 'src/shp-to-gltf.js',
            name : 'SHPTOGLTF',
            fileName : (formate)=>{return `index.${formate}.js`}
        },
        rollupOptions : {
        },

        outDir : './build'
    }
})