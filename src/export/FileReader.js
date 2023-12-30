export default class FileReader{
    constructor(){}

    /**
     * 
     * @param {Blob} blob 
     */
    readAsArrayBuffer(blob){
        blob.arrayBuffer().then((data)=>{
            this.result = data
            this.onloadend(data)
        })
    }

    onloadend(){}
}