import fs from "fs-extra";
import { exec } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

const API_KEY = "################"; //create your gemini api key
const genAI = new GoogleGenerativeAI(API_KEY);

// Define paths
const BACKEND_SCRIPT_PATH = "./Scripts/main.tf";
const LOCAL_TERRAFORM_PATH = "C:\\Terraform_files\\main.tf";


const enhancePrompt = (userPrompt, accessKey, secretKey) => {
  return `# Terraform Script Generator Template

Generate a Terraform script for AWS infrastructure deployment based on the following parameters:
## AWS Configuration
- AWS Access Key: ${accessKey}
- AWS Secret Key: ${secretKey}
- Default Region: us-west-1 (use this unless another region is specified)
- User Request: "${userPrompt}"

ALWAYS include the following provider block at the beginning of the script:

provider "aws" {
  access_key = "${accessKey}"
  secret_key = "${secretKey}"
  region     = "us-west-1"
}

## Infrastructure Defaults
- Default EC2 Instance Type: t2.micro
- AMI Images (use these exclusively):
  - Amazon Linux: ami-020fbc00dbecba358
  - Ubuntu: ami-04f7a54071e74f488
  - Windows: ami-02bee0c11794ac328
  - RedHat Linux: ami-0e40cbc388241f8ce

- Default container port: 3000 (for Docker deployments)

## Security Group Configuration
- always include ssh, http and https by default


## CRITICAL REQUIREMENTS
1. Include ONLY the Terraform code in your response, no explanations
2. Make sure you create the aws_instance block at the very end only.
3. Never use cloud config with user data, always use bin bash [only if auser data is required by user]
3. IF user asks for some configurations like installing any packages/softwares, configuring web server etc...make sure to use user data with bash script and to update and install it on the server
4. always use: vpc_security_group_ids when creating ec2 instance resource
5. for dbs, "db_instance_class" is deprecated, use "instance_class" instead. 
6. If user asks to pull a docker image, by default, if not mentioned by user, run the container on instance with -d and -p 3000:3000. Make sure to open that port in security group as well
7. For load balancing, use "aws_lb_target_group_attachment"
8. In us-west-1, only available av zones are us-west-1a and us-west1c. Use them only.
9. Make sure to label all subnets, vpc, gateways, instances with a name 

## Response Format
The response should contain ONLY the Terraform script with appropriate AWS resource definitions.`;
};

const extractTerraformCode = (responseText) => {
  // Try to match fenced code block first
  const codeBlockRegex = /```(?:hcl|terraform)?\n([\s\S]*?)\n```/;
  const match = responseText.match(codeBlockRegex);

  if (match) return match[1];

  // If no fenced block, assume full response is the script
  const fallbackCleaned = responseText.trim();

  // Basic sanity check: must contain "provider" and "resource"
  if (fallbackCleaned.includes("provider") && fallbackCleaned.includes("resource")) {
    return fallbackCleaned;
  }

  return null;
};


// Function to generate Terraform script
const generateScript = async (userPrompt, accessKey, secretKey) => {
  try {
    const finalPrompt = enhancePrompt(userPrompt, accessKey, secretKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(finalPrompt);
    const rawOutput = response.response.text();

    const terraformScript = extractTerraformCode(rawOutput);
    if (!terraformScript) {
      throw new Error("Failed to extract valid Terraform script.");
    }

    return terraformScript;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate Terraform script.");
  }
};

// Function to save and apply Terraform script
const saveAndApplyTerraform = async (script) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Save script in both locations
      await fs.outputFile(BACKEND_SCRIPT_PATH, script);
      await fs.outputFile(LOCAL_TERRAFORM_PATH, script);
      console.log("Terraform script saved successfully...validating configuration.");

      // Apply script
      exec("terraform apply -auto-approve", { cwd: "C:\\Terraform_files" }, (error, stdout, stderr) => {
        if (error) {
          console.error("Terraform apply error:", stderr);
          reject("Terraform apply failed");
          return;
        }
        console.log("Terraform apply output:", stdout);
        resolve(); 
      });
    } catch (err) {
      reject("Failed to save or apply Terraform script.");
    }
  });
};
// Controller function to handle prompt request
export const handlePrompt = async (req, res) => {
  try {
    const { prompt, accessKey, secretKey } = req.body;

    if (!prompt || !accessKey || !secretKey) {
      return res.status(400).json({ error: "Prompt, AWS Access Key, and AWS Secret Key are required" });
    }

    const terraformScript = await generateScript(prompt, accessKey, secretKey);
    await saveAndApplyTerraform(terraformScript);

    res.json({
      message: "Done! Check your AWS console.",
      script: terraformScript,
      downloadUrl: "http://localhost:5000/download/main.tf"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
