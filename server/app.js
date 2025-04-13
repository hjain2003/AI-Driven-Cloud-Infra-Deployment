import express from 'express';
import cors from 'cors';
import prompt_router from './routes/prompt.js';
import path from "path";

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

app.get('/download/main.tf', (req, res) => {
    const filePath = path.join("C:\\Terraform_files", "main.tf");
    res.download(filePath, "main.tf", (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Failed to download file.");
      }
    });
  });

app.listen(PORT, () => {
    console.log(`server up and running  at ${PORT}`);
});