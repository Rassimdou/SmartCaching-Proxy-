import { IncomingHttpHeaders }  from 'http';
import { createHash } from 'crypto';

export function createCacheKey(method: string, url: string, headers: IncomingHttpHeaders): string {
    // Convert IncomingHttpHeaders to the expected type
    const cleanedHeaders: Record<string, string | string[]> = {};
    
    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            cleanedHeaders[key] = value;
        }
    }
    
    const headerString = JSON.stringify(cleanedHeaders);
    const hashedHeader = createHash('md5').update(headerString).digest('hex');
    return `${method}:${url}:${hashedHeader}`;
}