import {craeteHash, createHash} from 'crypto'


interface CachedResponse{
    statusCode: number;
    headers: Record<string, string | string[]>;
    body: Buffer | string;
    timestamp: number;
    ttl?: number;
}

class MemoryCache {
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

    getStatr(){
        return{
            size: this.storage.size,
            keys: Array.from(this.storage.keys())
        }
    }

}


const memoryCache = new MemoryCache();

function createCashKey(method:string , url: string , header: Record<string , string | string[]> ): string {
    const headerString = JSON.stringify(header);
    const hashedHeader = createHash('md5').update(headerString).digest('hex');
    return `${method}:${url}:${hashedHeader}`;

}