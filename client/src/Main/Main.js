import React, { useState } from 'react';
import './Main.css';

const Main = () => {
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMsg,setStatusMsg] = useState('');
    const [responseMessage, setResponseMessage] = useState(null);
    const [terraformScript, setTerraformScript] = useState('');

    const handleSubmit = async(event) => {
        setStatusMsg('Submitting ...');
        event.preventDefault();
        console.log('Access Key:', accessKey);
        console.log('Secret Key:', secretKey);
        console.log('Prompt:', prompt);

        try {
            setStatusMsg('Generating scripts ...')
            const response = await fetch('http://localhost:5000/prompt/generate', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessKey, secretKey, prompt }),
            });

            const data = await response.json();
            setStatusMsg('Execution Done!')

            if (response.ok) {
                setResponseMessage('Terraform script executed successfully.');
                setTerraformScript(data.script);
            } else {
                setResponseMessage(data.error || 'An error occurred.');
            }
        } catch (error) {
            setResponseMessage('Failed to connect to the server.');
        }

        setLoading(false);
        
    };

    return (
        <div className="app-container">
            {/* Navigation */}
            <nav className="navbar">
                <div className="nav-content">
                    <h1 className="nav-title">AI-Driven Cloud Infrastructure Deployment</h1>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <div className="card">
                    <div className="card-header">
                        <b><i>{statusMsg}</i></b>
                        <br/>
                        <h2 className="card-title">AWS Credentials</h2>
                        <p className="card-subtitle">
                            Enter your AWS credentials and deployment configuration
                        </p>
                    </div>
                    <div className="card-content">
                        <form onSubmit={handleSubmit} className="form">
                            <div className="form-group">
                                <label htmlFor="accessKey" className="form-label">
                                    AWS Access Key ID
                                </label>
                                <div className="input-container">
                                    <input
                                        id="accessKey"
                                        type="text"
                                        value={accessKey}
                                        onChange={(e) => setAccessKey(e.target.value)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="secretKey" className="form-label">
                                    AWS Secret Access Key
                                </label>
                                <div className="input-container">
                                    <input
                                        id="secretKey"
                                        type="password"
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="prompt" className="form-label">
                                    Deployment Configuration
                                </label>
                                <div className="input-container">
                                    <textarea
                                        id="prompt"
                                        rows={4}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        required
                                        className="form-textarea"
                                        placeholder="Describe your infrastructure requirements..."
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                            <button type="submit" className="submit-button" disabled={loading}>
                                    {loading ? 'Deploying...' : 'Deploy Infrastructure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Main;