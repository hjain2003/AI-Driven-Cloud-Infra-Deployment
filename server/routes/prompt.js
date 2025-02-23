import express from "express";
import { handlePrompt } from "../controllers/prompt_controller.js";

const prompt_router = express.Router();

prompt_router.post('/generate', handlePrompt);

export default prompt_router;