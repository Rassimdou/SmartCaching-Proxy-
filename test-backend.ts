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


const server = app.listen(PORT, () => {
    console.log(`Backend server is running at http://localhost:${PORT}`);
});