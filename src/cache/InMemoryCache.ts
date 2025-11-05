import { createHash} from 'crypto'
import { IncomingHttpHeaders } from 'http';


interface CachedResponse{
    statusCode: number;
    headers: IncomingHttpHeaders ;
    body: Buffer | string;
    timestamp: number;
    ttl?: number;
}

export class MemoryCache {
    private storage: Map<string, CachedResponse>;


    constructor(){
        this.storage = new Map()
    }

    get(key: string): CachedResponse | null {
        const cached = this.storage.get(key);

        //chwck if its expired 
        if (cached && this.isExpired(cached)){
            this.storage.delete(key);
            return null;
        }
        return cached || null ;
    }
    set(key:string , value:CachedResponse):void {
        this.storage.set(key , value);
    }


    delete(key:string):boolean{
        return this.storage.delete(key);
    }


    clear(key:string):void{
        this.storage.clear();
    }

    private isExpired(entry:CachedResponse): boolean {
        if(!entry.ttl) return false;
        return Date.now()-entry.timestamp > entry.ttl;  
    }

    getStats(){
        return{
            size: this.storage.size,
            keys: Array.from(this.storage.keys())
        }
    }

}



