# shp-to-gltf

shp-to-gltf  is a javascript lib use to convert SHP(shapefile) to gltf(glb)
**Read this in other languages: [English](README.md), [中文](README_ZH.md).**
![polygon](https://wangchuan12.github.io/shpGltf/polygon.png)

## How to use

```js
npm install shp-to-gltf -g
```

```
shp-to-gltf  -i ./data/polygon.zip  -o ./data/b.glb  -f Elevation -c true
```

## params

| -i     | input file path that file path is a shp file must a zip file |
| ------ | ------------------------------------------------------------ |
| **-o** | **output file path**                                         |
| **-c** | **set model center to origin true is to origin false is not** |
| **-f** | **set model extrude height by shp field**                    |
| **-d** | **use draco compress model true is use false is not**        |
| **-s** | **style file path is a json a file use to render per feature** |
| **-h** | **show help**                                                |

### style file 

```json
{
    "filed" : "Elevation", // filed is use to compute style
    "style" : [
        // this item mean when the feature propert of Elevation biger than range[0] and small range[1] render this color
        {    
            "range": [
                0,
                10
            ],
            "color": "rgb(253 , 215,154)"
        },
       
        {
            "range": [
                180,
                190
            ],
            "color": "rgb(25 , 84,123)"
        },
        {
            "range": [
                290,
                300
            ],
            "color": "rgb(25 , 84,123)"
        }
    ],
    "defaultColor" : "rgb(25 , 84,123)" // Render the default color when no style is hit
}
```

