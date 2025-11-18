// AWS Cognito Configuration
let userPool;
let cognitoUser;
let currentUserEmail;

// Initialize Cognito User Pool
function initializeCognito() {
    const poolData = {
        UserPoolId: CONFIG.COGNITO_USER_POOL_ID,
        ClientId: CONFIG.COGNITO_CLIENT_ID
    };
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

// Check if user is already authenticated
function checkAuthentication() {
    cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                showAuthContainer();
                return;
            }

            if (session.isValid()) {
                cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        console.error('Error getting user attributes:', err);
                        showAuthContainer();
                        return;
                    }

                    const emailAttr = attributes.find(attr => attr.Name === 'email');
                    currentUserEmail = emailAttr ? emailAttr.Value : 'User';
                    showAppContainer();
                });
            } else {
                showAuthContainer();
            }
        });
    } else {
        showAuthContainer();
    }
}

// Show/Hide Containers
function showAuthContainer() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showAppContainer() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('user-email').textContent = currentUserEmail;
}

// Form Navigation
function showSignIn() {
    hideAllAuthForms();
    document.getElementById('signin-form').style.display = 'block';
}

function showSignUp() {
    hideAllAuthForms();
    document.getElementById('signup-form').style.display = 'block';
}

function showVerify() {
    hideAllAuthForms();
    document.getElementById('verify-form').style.display = 'block';
}

function showForgot() {
    hideAllAuthForms();
    document.getElementById('forgot-form').style.display = 'block';
}

function showReset() {
    hideAllAuthForms();
    document.getElementById('reset-form').style.display = 'block';
}

function hideAllAuthForms() {
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.style.display = 'none');
}

// Sign Up
function signUp(email, password, name) {
    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        }),
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'name',
            Value: name
        })
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
            showError(err.message || JSON.stringify(err));
            return;
        }

        cognitoUser = result.user;
        currentUserEmail = email;
        showSuccess('Sign up successful! Please check your email for verification code.');
        setTimeout(() => {
            showVerify();
        }, 2000);
    });
}

// Verify Email
function verifyEmail(code) {
    if (!cognitoUser) {
        showError('No user to verify. Please sign up first.');
        return;
    }

    cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
            showError(err.message || JSON.stringify(err));
            return;
        }

        showSuccess('Email verified successfully! You can now sign in.');
        setTimeout(() => {
            showSignIn();
        }, 2000);
    });
}

// Resend Verification Code
function resendVerificationCode() {
    if (!cognitoUser) {
        showError('No user found. Please sign up first.');
        return;
    }

    cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
            showError(err.message || JSON.stringify(err));
            return;
        }

        showSuccess('Verification code sent to your email!');
    });
}

// Sign In
function signIn(email, password) {
    const authenticationData = {
        Username: email,
        Password: password
    };

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: email,
        Pool: userPool
    };

    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            currentUserEmail = email;
            showSuccess('Sign in successful!');
            setTimeout(() => {
                showAppContainer();
            }, 1000);
        },
        onFailure: (err) => {
            showError(err.message || JSON.stringify(err));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
            showError('New password required. Please contact administrator.');
        }
    });
}

// Sign Out
function signOut() {
    if (cognitoUser) {
        cognitoUser.signOut();
    }
    currentUserEmail = null;
    showAuthContainer();
    showSignIn();
    showSuccess('Signed out successfully!');
}

// Forgot Password
function forgotPassword(email) {
    const userData = {
        Username: email,
        Pool: userPool
    };

    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    currentUserEmail = email;

    cognitoUser.forgotPassword({
        onSuccess: (data) => {
            showSuccess('Verification code sent to your email!');
            setTimeout(() => {
                showReset();
            }, 2000);
        },
        onFailure: (err) => {
            showError(err.message || JSON.stringify(err));
        }
    });
}

// Reset Password
function resetPassword(code, newPassword) {
    if (!cognitoUser) {
        showError('Please request a password reset first.');
        return;
    }

    cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
            showSuccess('Password reset successful! You can now sign in with your new password.');
            setTimeout(() => {
                showSignIn();
            }, 2000);
        },
        onFailure: (err) => {
            showError(err.message || JSON.stringify(err));
        }
    });
}

// Predict Crop
async function predictCrop(data) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
    }
}

// Utility Functions
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const container = document.querySelector('.auth-card') || document.querySelector('.container');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    container.insertBefore(successDiv, container.firstChild);

    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showResult(cropName) {
    document.getElementById('crop-name').textContent = cropName;
    document.getElementById('result-section').style.display = 'block';

    // Scroll to result
    document.getElementById('result-section').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

function hideResult() {
    document.getElementById('result-section').style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Cognito
    initializeCognito();
    checkAuthentication();

    // Auth Form Navigation
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignUp();
    });

    document.getElementById('show-signin').addEventListener('click', (e) => {
        e.preventDefault();
        showSignIn();
    });

    document.getElementById('show-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        showForgot();
    });

    document.getElementById('back-to-signin').addEventListener('click', (e) => {
        e.preventDefault();
        showSignIn();
    });

    document.getElementById('resend-code').addEventListener('click', (e) => {
        e.preventDefault();
        resendVerificationCode();
    });

    // Sign Up Form
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        signUp(email, password, name);
    });

    // Verification Form
    document.getElementById('verification-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('verify-code').value;
        verifyEmail(code);
    });

    // Sign In Form
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        signIn(email, password);
    });

    // Forgot Password Form
    document.getElementById('forgot-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        forgotPassword(email);
    });

    // Reset Password Form
    document.getElementById('reset-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('reset-code').value;
        const newPassword = document.getElementById('new-password').value;
        resetPassword(code, newPassword);
    });

    // Logout Button
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut();
    });

    // Prediction Form
    document.getElementById('prediction-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        hideResult();
        showLoading(true);

        const data = {
            N: parseFloat(document.getElementById('nitrogen').value),
            P: parseFloat(document.getElementById('phosphorus').value),
            K: parseFloat(document.getElementById('potassium').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            humidity: parseFloat(document.getElementById('humidity').value),
            ph: parseFloat(document.getElementById('ph').value),
            rainfall: parseFloat(document.getElementById('rainfall').value)
        };

        try {
            const result = await predictCrop(data);
            showLoading(false);
            showResult(result.predicted_crop);
        } catch (error) {
            showLoading(false);
            showError('Failed to get prediction. Please check if the API is running and try again.');
            console.error('Error:', error);
        }
    });
});
