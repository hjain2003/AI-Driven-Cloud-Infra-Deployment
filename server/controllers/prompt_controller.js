import fs from "fs-extra";
import { exec } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDE88PCvIUEbpgICrtLsKA4UwYlbjQ9be8";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define paths
const BACKEND_SCRIPT_PATH = "./Scripts/main.tf";
const LOCAL_TERRAFORM_PATH = "C:\\Terraform_files\\main.tf";

// Function to enhance user prompt with AWS credentials
// Balancer subnets.**
// - **Fetch subnets using:**
//   terraform
//   data "aws_subnets" "default" {
//     filter {
//       name   = "vpc-id"
//       values = [data.aws_vpc.default.id]
//     }
//   }
const enhancePrompt = (userPrompt, accessKey, secretKey) => {
  return `Generate a Terraform script for AWS infrastructure deployment. Hardcode the access key and secret key demo values as provided below in the script.

Use the following AWS credentials:
- AWS Access Key: ${accessKey}
- AWS Secret Key: ${secretKey}
The user’s request: "${userPrompt}"

**Important Constraints:**
- **DO NOT include source, version, terraform block, required_providers, source, or version. They should NOT be in the script.**
- Assume region = "ap-south-1" if not mentioned.
- Default instance type: t2.micro
- DO NOT ADD NETWORK INTERFACES
- DO NOT DUPLICATE Autoscaling grp resources
- If pulling, docker images, if not specified by user, run image from port 3000
- Use only the following AMI images:
  - Amazon Linux Machine: ami-0d682f26195e9ec0f
  - Ubuntu: ami-00bb6a80f01f03502
  - Windows: ami-05a00967f06885a63
  - Redhat Linux: ami-02ddb77f8f93ca4ca
  
  **WHEN USER MENTION LOAD BALANCER**, SPECIAL RULES APPLY:
  Application Load Balancer (ALB) must include:

    subnets = [<list of subnet IDs>] (Use existing VPC subnets)
    security_groups = [aws_security_group.lb_sg.id]
    load_balancer_type = "application"
    scheme = "internet-facing"
    Use resource "aws_lb" to create load balancer and do not use "scheme" parameter in it

    *THESE ABOVE APPL LOAD BALANCER RULES SHOULD BE APPLIED AT THE VERY BEGGN WHEN CREATING THE SERVER...NOT AT THE END AGAIN*

    Target Group must include:
    vpc_id = aws_vpc.main.id
    port = 3000
    protocol = "HTTP"
    Listeners must:

    Use data.aws_subnets.default.ids to fetch all default VPC subnets
    Use data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
    Use vpc_security_group_ids = [aws_security_group.allow_all.id, aws_security_group.lb_sg.id]

    Update vpc_id = data.aws_vpc.default.id in aws_lb_target_group

    Attach to the correct Target Group.
    Use port = 80 and protocol = "HTTP".
    Ensure proper security groups:

    Allow inbound traffic on ports 80 and 3000 for Load Balancer & Instances.
    Attach security groups properly.
    DO NOT DUPLICATE RESOURCES IN AWS INSTANCES FOR SERVERS


**Strict Guidelines:**
- NO DUPLICATE RESOURCES SHOULD BE CREATED. CROSS CHECK THIS AT THE BEGGN AND THE END
- The response should contain ONLY the Terraform script. **NO extra comments, explanations, or remarks.**
- Whatever servers you have created, you must return the public ips of the server to the user
.**
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
  try {
    // Save script in both locations
    await fs.outputFile(BACKEND_SCRIPT_PATH, script);
    await fs.outputFile(LOCAL_TERRAFORM_PATH, script);
    console.log("Terraform script saved successfully.");

    // Run Terraform apply
    exec("terraform apply -auto-approve", { cwd: "C:\\Terraform_files" }, (error, stdout, stderr) => {
      if (error) {
        console.error("Terraform apply error:", stderr);
        return;
      }
      console.log("Terraform apply output:", stdout);
    });
  } catch (error) {
    console.error("Error saving Terraform script:", error);
    throw new Error("Failed to save or execute Terraform script.");
  }
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

    res.json({ message: "Terraform script executed successfully", script: terraformScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
