export default class Deffer{
    constructor(){
        this.promise = new Promise((r , j)=>{
            this.r = r
            this.j = j
        })
    }

    resolve(){
        this.r(...arguments)
    }

    reject(){
        this.j(...arguments)
    }
}