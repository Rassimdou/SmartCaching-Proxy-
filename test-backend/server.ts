import express from 'express';



const app = express();
const PORT = 3000;


app.get('/api/data', (req: express.Request, res: express.Response) => {
   
        res.json({ data: { 
            id: 1,
            name: 'Test Data',
            password: 'secret'
         } });
    }
);
app.get('/api/data2', (req: express.Request, res: express.Response)=>{
    res.json({data2:{
        id:2,
        name: 'test2',
        passord:'paswd',
    }})
})
app.get('/api/data3', (req: express.Request, res: express.Response)=>{
    res.json({data3:{
        id:3,
        name: 'test3',
        passord:'paswd'
    }})
})
app.get('/api/data4', (req: express.Request, res: express.Response)=>{
    res.json({data3:{
        id:3,
        name: 'test3',
        passord:'paswd'
    }})
})

const server = app.listen(PORT, () => {
    console.log(`Backend server is running at http://localhost:${PORT}`);
});