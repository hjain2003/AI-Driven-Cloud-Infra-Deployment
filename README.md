# GenAI-Driven Cloud Infra Deployment

This project enables prompt based deployment of cloud infrastructure using Terraform and a full-stack web interface. It uses Gemini to convert prompts into Terraform code and deploys infrastructure on AWS automatically.

---

## 🚀 Project Setup

Follow these steps to set up and run the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/hjain2003/AI-Driven-Cloud-Infra-Deployment.git
cd AI-Driven-Cloud-Infra-Deployment
```

### 2. Install Dependencies
```bash
cd client
npm install

cd ../server
npm install
```

### 3. Setup Terraform Directory
```bash
mkdir C:\terraform_files
cd C:\terraform_files
terraform init
```

### 4. AWS Credentials Setup
To deploy infrastructure using Terraform, you need to configure your AWS credentials (Access Key ID and Secret Access Key). Follow the steps below:

Step-by-Step: Create AWS Access Key
  - Go to the AWS Management Console.
  - In the top right, click on your account name, then select Security Credentials.
  - Scroll down to Access keys and click Create access key.Select Command Line Interface (CLI) use case.
  - Click Next, then Create access key.
  - Copy your Access key ID and Secret access key — you’ll need them for Terraform.

### 5. Running the App
```bash
cd server
node app.js
```
```bash
cd ../client
npm start
```






