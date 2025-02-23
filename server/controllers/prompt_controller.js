import fs from 'fs-extra';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDE88PCvIUEbpgICrtLsKA4UwYlbjQ9be8';
const genAI = new GoogleGenerativeAI(API_KEY);

// Define paths
const BACKEND_SCRIPT_PATH = './Scripts/main.tf';
const LOCAL_TERRAFORM_PATH = 'C:\\Terraform_files\\main.tf';

// Function to enhance user prompt with AWS credentials
const enhancePrompt = (userPrompt, accessKey, secretKey) => {
    return `Generate a Terraform script for AWS infrastructure deployment. Hardcode the access key and secret key demo values as provided below in the script
            Use the following AWS credentials:
            - AWS Access Key: ${accessKey}
            - AWS Secret Key: ${secretKey}
            The user’s request: "${userPrompt}"
            
            If not mentioned, assume region as mumbai, server as t2.micro, security grp ssh enabled atleast.
            Do not give me any extra info and remarks other than the script as i need to copy your entire response as a file so do not need anythign else other than script
            `;
};

// Function to extract only the Terraform script using regex
const extractTerraformCode = (responseText) => {
    const codeRegex = /```(?:hcl|terraform)?\n([\s\S]*?)\n```/; // Match Terraform code blocks
    const match = responseText.match(codeRegex);
    return match ? match[1] : null; // Extract only the script part
};

// Function to generate Terraform script
const generateScript = async (userPrompt, accessKey, secretKey) => {
    try {
        const finalPrompt = enhancePrompt(userPrompt, accessKey, secretKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent(finalPrompt);
        const rawOutput = response.response.text();

        const terraformScript = extractTerraformCode(rawOutput);
        if (!terraformScript) {
            throw new Error('Failed to extract valid Terraform script.');
        }

        return terraformScript;
    } catch (error) {
        console.error('Error generating script:', error);
        throw new Error('Failed to generate Terraform script.');
    }
};

// Function to save and apply Terraform script
const saveAndApplyTerraform = async (script) => {
    try {
        // Save script in both locations
        await fs.outputFile(BACKEND_SCRIPT_PATH, script);
        await fs.outputFile(LOCAL_TERRAFORM_PATH, script);
        console.log('Terraform script saved successfully.');

        // Run Terraform apply
        exec('terraform apply -auto-approve', { cwd: 'C:\\Terraform_files' }, (error, stdout, stderr) => {
            if (error) {
                console.error('Terraform apply error:', stderr);
                return;
            }
            console.log('Terraform apply output:', stdout);
        });
    } catch (error) {
        console.error('Error saving Terraform script:', error);
        throw new Error('Failed to save or execute Terraform script.');
    }
};

// Controller function to handle prompt request
export const handlePrompt = async (req, res) => {
    try {
        const { prompt, accessKey, secretKey } = req.body;

        if (!prompt || !accessKey || !secretKey) {
            return res.status(400).json({ error: 'Prompt, AWS Access Key, and AWS Secret Key are required' });
        }

        const terraformScript = await generateScript(prompt, accessKey, secretKey);
        await saveAndApplyTerraform(terraformScript);

        res.json({ message: 'Terraform script executed successfully', script: terraformScript });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
