import express from 'express';
import cors from 'cors';
import prompt_router from './routes/prompt.js';

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization','Content-Disposition'],
}));
app.use('/prompt',prompt_router);

app.get('/', (req, res) => {
    res.send(`AI Driven Cloud Infra`);
});

app.listen(PORT, () => {
    console.log(`server up and running  at ${PORT}`);
});