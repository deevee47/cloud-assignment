// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito User Pool details

const CONFIG = {
    // AWS Cognito User Pool ID
    // Format: us-east-1_XXXXXXXXX
    COGNITO_USER_POOL_ID: 'us-east-1_u1DWWcNBh',

    // AWS Cognito App Client ID
    // You can find this in your User Pool under "App clients"
    COGNITO_CLIENT_ID: '2uoocl8sgimbdqmk41soiurq9p',

    // API Base URL
    // This should point to your FastAPI backend
    // For local development: 'http://localhost:8000'
    // For production: 'https://your-api-domain.com'
    API_BASE_URL: 'http://3.84.151.96:8000'
};

// Validation function to check if configuration is set
function validateConfig() {
    if (CONFIG.COGNITO_USER_POOL_ID === 'YOUR_USER_POOL_ID' ||
        CONFIG.COGNITO_CLIENT_ID === 'YOUR_CLIENT_ID') {
        console.warn('⚠️ AWS Cognito configuration is not set!');
        console.warn('Please update the config.js file with your AWS Cognito credentials.');
        console.warn('See README.md for setup instructions.');
    }
}

// Run validation on load
validateConfig();
