import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/data', (req: express.Request, res: express.Response) => {
    res.json({ data: { 
        id: 1,
        name: 'Test Data',
        password: 'secret'
    } });
});

app.get('/api/data2', (req: express.Request, res: express.Response) => {
    res.json({ data2: {
        id: 2,
        name: 'test2',
        password: 'paswd',
    } });
});

app.get('/api/data3', (req: express.Request, res: express.Response) => {
    res.json({ data3: {
        id: 3,
        name: 'test3',
        password: 'paswd'
    } });
});

app.get('/api/data4', (req: express.Request, res: express.Response) => {
    res.json({ data4: {  
        id: 4,          
        name: 'test4',   
        password: 'paswd'
    } });
});

app.get('/api/data5', (req: express.Request, res: express.Response) => {
    res.json({ data5: {
        id: 5,
        name: 'test5',
        password: 'paswd'
    } });
});

app.get('/api/data6', (req: express.Request, res: express.Response) => {
    res.json({ data6: {
        id: 6,
        name: 'test6',
        password: 'paswd'
    } });
});

app.get('/api/data7', (req: express.Request, res: express.Response) => {
    res.json({ data7: {
        id: 7,
        name: 'test7',
        password: 'paswd'
    } });
});

app.get('/api/data8', (req: express.Request, res: express.Response) => {
    res.json({ data8: {
        id: 8,
        name: 'test8',
        password: 'paswd'
    } });
});

app.get('/api/data9', (req: express.Request, res: express.Response) => {
    res.json({ data9: {
        id: 9,
        name: 'test9',
        password: 'paswd'
    } });
});

app.get('/api/data10', (req: express.Request, res: express.Response) => {
    res.json({ data10: {
        id: 10,
        name: 'test10',
        password: 'paswd'
    } });
});

app.get('/api/data11', (req: express.Request, res: express.Response) => {
    res.json({ data11: {
        id: 11,
        name: 'test11',
        password: 'paswd'
    } });
});

app.get('/api/data12', (req: express.Request, res: express.Response) => {
    res.json({ data12: {
        id: 12,
        name: 'test12',
        password: 'paswd'
    } });
});

const server = app.listen(PORT, () => {
    console.log(`Backend server is running at http://localhost:${PORT}`);
});