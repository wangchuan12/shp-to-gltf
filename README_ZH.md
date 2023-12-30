# shp-to-gltf

shp-to-gltf 是一个javascript库，用于将SHP(shapefile)转换为gltf(glb)。

![polygon](https://wangchuan12.github.io/shpGltf/polygon.png)

## 如何使用

```js
npm install shp-to-gltf -g
```

```
shp-to-gltf  -i ./data/polygon.zip  -o ./data/b.glb  -f Elevation -c true
```

## 参数

| **-i** | **输入文件路径，该路径代表的文件为shp文件，且必须为zip文件** |
| ------ | ------------------------------------------------------------ |
| **-o** | **输出文件路径**                                             |
| **-c** | **将模型中心设置为原点true为原点false为非原点**              |
| **-f** | **设置用来将平面挤压成模型的字段**                           |
| **-d** | **使用drago压缩模型true是使用false不使用**                   |
| **-s** | **样式文件路径是一个json文件，用于渲染每个要素**             |
| **-h** | **展示帮助信息**                                             |

### **样式文件**

```json
{
    "filed" : "Elevation", // 字段用于计算样式
    "style" : [
        //此选项表示当字段Elevation 大于 range[0] 且 小于 range[1] 时渲染该颜色
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
    "defaultColor" : "rgb(25 , 84,123)" // 当没有命中style时渲染默认颜色
}
```

