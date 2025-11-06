import { CachedResponse } from "./InMemoryCache";

export class MemoryCache {
    private storage: Map<string, CachedResponse>;
    private readonly capacity :number;

    constructor(capacity:number = 10){
        this.storage = new Map()
        this.capacity = capacity
    }

    get(key: string): CachedResponse | null {

        const cached = this.storage.get(key);

        //chwck if its expired 
        if (cached && this.isExpired(cached)){
            this.storage.delete(key);
            return null;
        }
        else {
            //delete and reinsert to keep it as MRU (most recently used)
            this.storage.delete(key); 
            this.storage.set(key , cached!);
            return cached || null ;
        }

    }
    set(key:string , value:CachedResponse):void {
        //delete it to re-insert a
        if (this.storage.has(key))
            this.storage.delete(key);

        //check capacity 
        if(this.storage.size >= this.capacity ){ 

            const firstKey = this.storage.keys().next().value;
            if(firstKey != undefined){
            this.storage.delete(firstKey);
            console.log(`Evicted LRU:${firstKey}`)
            }   
        }
        this.storage.set(key , value)

    }


    delete(key:string):boolean{
        return this.storage.delete(key);
    }


    clear():void{
        this.storage.clear();
    }

    private isExpired(entry:CachedResponse): boolean {
        if(!entry.ttl) return false;
        return Date.now()-entry.timestamp > entry.ttl;  
    }

    getStats(){
        return{
            size: this.storage.size,
            capacity: this.capacity,
            keys: Array.from(this.storage.keys())
        }
    }

}

