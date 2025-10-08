import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    ResendConfirmationCodeCommand,
    GetUserCommand,
    DeleteUserCommand,
    UpdateUserAttributesCommand,
    AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client (no AWS credentials needed for client APIs)
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || process.env.APP_REGION || "us-east-1",
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;

function validateCognitoConfig() {
    if (!USER_POOL_ID || !CLIENT_ID) {
        throw new Error("Missing required Cognito environment variables: COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set");
    }
}

// Helper function to create HMAC signature for client secret
async function getSecretHash(username: string): Promise<string | undefined> {
    if (!CLIENT_SECRET) return undefined;
    const crypto = await import("crypto");
    const message = username + CLIENT_ID;
    return crypto
        .createHmac("sha256", CLIENT_SECRET)
        .update(message)
        .digest("base64");
}

export interface CognitoUser {
    id: string;
    email: string;
    username: string;
    emailVerified: boolean;
    enabled: boolean;
    userStatus: string;
    createdAt?: Date;
    lastModifiedAt?: Date;
    attributes: Record<string, string>;
}

export interface SignInResult {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}

export interface SignUpResult {
    userSub: string;
    codeDeliveryDetails?: {
        destination: string;
        deliveryMedium: string;
        attributeName: string;
    };
}

/**
 * Sign in a user with email and password
 */
export async function cognitoSignIn(
    email: string,
    password: string
): Promise<SignInResult> {
    validateCognitoConfig();

    const secretHash = await getSecretHash(email);

    const authParameters: Record<string, string> = {
        USERNAME: email,
        PASSWORD: password,
    };

    if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
    }

    // Try different auth flows
    const authFlows: AuthFlowType[] = [
        AuthFlowType.USER_PASSWORD_AUTH,
        AuthFlowType.USER_SRP_AUTH
    ];

    let lastError: any = null;

    for (const authFlow of authFlows) {
        try {
            const command = new InitiateAuthCommand({
                ClientId: CLIENT_ID!,
                AuthFlow: authFlow,
                AuthParameters: authParameters,
            });

            const response = await cognitoClient.send(command);

            if (response.AuthenticationResult) {
                console.log(`✅ Sign-in successful with auth flow: ${authFlow}`);
                return {
                    accessToken: response.AuthenticationResult.AccessToken!,
                    idToken: response.AuthenticationResult.IdToken!,
                    refreshToken: response.AuthenticationResult.RefreshToken!,
                    expiresIn: response.AuthenticationResult.ExpiresIn!,
                    tokenType: response.AuthenticationResult.TokenType!,
                };
            }
        } catch (error: any) {
            console.log(`❌ Auth flow ${authFlow} failed:`, error.message);
            lastError = error;
            if (authFlow === authFlows[authFlows.length - 1]) {
                // This was the last auth flow, throw a descriptive error
                const errorName = error.name || error.__type || 'UnknownError';
                const errorMessage = error.message || 'Authentication failed';
                
                if (errorName === 'NotAuthorizedException') {
                    throw new Error('Incorrect username or password');
                } else if (errorName === 'UserNotConfirmedException') {
                    throw new Error('Account not verified. Please check your email for verification code');
                } else if (errorName === 'UserNotFoundException') {
                    throw new Error('User does not exist');
                } else if (errorName === 'InvalidParameterException') {
                    throw new Error('Invalid input format. Please check your credentials');
                } else if (errorName === 'TooManyRequestsException') {
                    throw new Error('Too many login attempts. Please try again later');
                } else {
                    throw new Error(errorMessage);
                }
            }
            // Continue to next auth flow
        }
    }

    throw new Error("All authentication flows failed");
}

/**
 * Create a new user in Cognito
 */
export async function cognitoSignUp(
    email: string,
    password: string,
    username?: string
): Promise<SignUpResult> {
    validateCognitoConfig();

    const finalUsername = username || email.split("@")[0];
    const secretHash = await getSecretHash(email);

    const userAttributes = [
        {
            Name: "email",
            Value: email,
        },
    ];

    if (username) {
        userAttributes.push({
            Name: "preferred_username",
            Value: finalUsername,
        });
    }

    try {
        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID!,
            Username: email,
            Password: password,
            SecretHash: secretHash,
            UserAttributes: userAttributes,
        });

        const signUpResponse = await cognitoClient.send(signUpCommand);

        return {
            userSub: signUpResponse.UserSub || "",
            codeDeliveryDetails: signUpResponse.CodeDeliveryDetails
                ? {
                        destination: signUpResponse.CodeDeliveryDetails.Destination!,
                        deliveryMedium: signUpResponse.CodeDeliveryDetails.DeliveryMedium!,
                        attributeName: signUpResponse.CodeDeliveryDetails.AttributeName!,
                    }
                : undefined,
        };
    } catch (error: any) {
        const errorName = error.name || error.__type || 'UnknownError';
        const errorMessage = error.message || 'Sign up failed';
        
        if (errorName === 'UsernameExistsException') {
            throw new Error('An account with this email already exists');
        } else if (errorName === 'InvalidPasswordException') {
            throw new Error('Password does not meet requirements. Must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters');
        } else if (errorName === 'InvalidParameterException') {
            throw new Error('Invalid email or password format');
        } else if (errorName === 'TooManyRequestsException') {
            throw new Error('Too many sign up attempts. Please try again later');
        } else {
            throw new Error(errorMessage);
        }
    }
}

/**
 * Confirm user sign up with verification code
 */
export async function cognitoConfirmSignUp(
    email: string,
    code: string
): Promise<boolean> {
    validateCognitoConfig();

    const secretHash = await getSecretHash(email);

    try {
        const command = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID!,
            Username: email,
            ConfirmationCode: code,
            SecretHash: secretHash,
        });

        await cognitoClient.send(command);
        return true;
    } catch (error: any) {
        const errorName = error.name || error.__type || 'UnknownError';
        const errorMessage = error.message || 'Verification failed';
        
        if (errorName === 'CodeMismatchException') {
            throw new Error('Invalid verification code. Please check and try again');
        } else if (errorName === 'ExpiredCodeException') {
            throw new Error('Verification code has expired. Please request a new one');
        } else if (errorName === 'NotAuthorizedException') {
            throw new Error('User is already verified');
        } else if (errorName === 'UserNotFoundException') {
            throw new Error('User does not exist');
        } else if (errorName === 'TooManyFailedAttemptsException') {
            throw new Error('Too many failed attempts. Please try again later');
        } else if (errorName === 'LimitExceededException') {
            throw new Error('Attempt limit exceeded. Please try again later');
        } else {
            throw new Error(errorMessage);
        }
    }
}

/**
 * Resend verification code to user's email
 */
export async function cognitoResendConfirmationCode(
    email: string
): Promise<{
    destination: string;
    deliveryMedium: string;
    attributeName: string;
}> {
    validateCognitoConfig();

    const secretHash = await getSecretHash(email);

    try {
        const command = new ResendConfirmationCodeCommand({
            ClientId: CLIENT_ID!,
            Username: email,
            SecretHash: secretHash,
        });

        const response = await cognitoClient.send(command);

        if (!response.CodeDeliveryDetails) {
            throw new Error('Failed to send verification code');
        }

        return {
            destination: response.CodeDeliveryDetails.Destination!,
            deliveryMedium: response.CodeDeliveryDetails.DeliveryMedium!,
            attributeName: response.CodeDeliveryDetails.AttributeName!,
        };
    } catch (error: any) {
        const errorName = error.name || error.__type || 'UnknownError';
        const errorMessage = error.message || 'Failed to resend code';
        
        if (errorName === 'UserNotFoundException') {
            throw new Error('User does not exist');
        } else if (errorName === 'InvalidParameterException') {
            throw new Error('Invalid email address');
        } else if (errorName === 'LimitExceededException') {
            throw new Error('Too many requests. Please wait before requesting another code');
        } else if (errorName === 'NotAuthorizedException') {
            throw new Error('User is already verified');
        } else {
            throw new Error(errorMessage);
        }
    }
}

/**
 * Get user information from Cognito
 * Requires a valid access token from the user
 */
export async function getCognitoUser(accessToken: string): Promise<CognitoUser | null> {
    validateCognitoConfig();

    try {
        const command = new GetUserCommand({
            AccessToken: accessToken,
        });

        const response = await cognitoClient.send(command);

        const attributes: Record<string, string> = {};
        response.UserAttributes?.forEach((attr) => {
            if (attr.Name && attr.Value) {
                attributes[attr.Name] = attr.Value;
            }
        });

        return {
            id: attributes.sub || response.Username || "",
            email: attributes.email || "",
            username: attributes.preferred_username || response.Username || "",
            emailVerified: attributes.email_verified === "true",
            enabled: true,
            userStatus: "CONFIRMED",
            createdAt: undefined,
            lastModifiedAt: undefined,
            attributes,
        };
    } catch (error) {
        console.error("Error getting Cognito user:", error);
        return null;
    }
}

/**
 * Delete a user from Cognito
 * Requires a valid access token from the user
 */
export async function deleteCognitoUser(accessToken: string): Promise<boolean> {
    validateCognitoConfig();

    try {
        const command = new DeleteUserCommand({
            AccessToken: accessToken,
        });

        await cognitoClient.send(command);
        return true;
    } catch (error) {
        console.error("Error deleting Cognito user:", error);
        return false;
    }
}

/**
 * Update user attributes in Cognito
 * Requires a valid access token from the user
 */
export async function updateCognitoUserAttributes(
    accessToken: string,
    attributes: Record<string, string>
): Promise<boolean> {
    validateCognitoConfig();

    try {
        const userAttributes = Object.entries(attributes).map(
            ([name, value]) => ({
                Name: name,
                Value: value,
            })
        );

        const command = new UpdateUserAttributesCommand({
            AccessToken: accessToken,
            UserAttributes: userAttributes,
        });

        await cognitoClient.send(command);
        return true;
    } catch (error) {
        console.error("Error updating Cognito user attributes:", error);
        return false;
    }
}

/**
 * Verify JWT token from Cognito
 */
export async function verifyCognitoToken(token: string): Promise<any> {
    try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.decode(token, { complete: true });
        return decoded?.payload;
    } catch (error) {
        console.error("Error verifying Cognito token:", error);
        return null;
    }
}

/**
 * Get user information from ID token (for OAuth users)
 * This is more reliable for OAuth flows as it doesn't require special scopes
 */
export async function getUserFromIdToken(idToken: string): Promise<CognitoUser | null> {
    try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.decode(idToken) as any;

        if (!decoded) {
            return null;
        }

        return {
            id: decoded.sub || decoded["cognito:username"] || "",
            email: decoded.email || "",
            username: decoded["cognito:username"] || decoded.email?.split("@")[0] || "",
            emailVerified: decoded.email_verified === true || decoded.email_verified === "true",
            enabled: true,
            userStatus: "CONFIRMED",
            attributes: decoded,
        };
    } catch (error) {
        console.error("Error extracting user from ID token:", error);
        return null;
    }
}

/**
 * Get Cognito OAuth URL for Google sign-in
 */
export function getGoogleOAuthUrl(redirectUri: string): string {
    validateCognitoConfig();
    
    if (!COGNITO_DOMAIN) {
        throw new Error("COGNITO_DOMAIN environment variable is not set");
    }

    const cognitoRegion = process.env.COGNITO_REGION || process.env.APP_REGION || "us-east-1";
    
    const params = new URLSearchParams({
        client_id: CLIENT_ID!,
        response_type: "code",
        scope: "email openid profile",
        redirect_uri: redirectUri,
        identity_provider: "Google",
    });

    return `https://${COGNITO_DOMAIN}.auth.${cognitoRegion}.amazoncognito.com/oauth2/authorize?${params}`;
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeOAuthCode(
    code: string,
    redirectUri: string
): Promise<SignInResult> {
    validateCognitoConfig();
    
    if (!COGNITO_DOMAIN) {
        throw new Error("COGNITO_DOMAIN environment variable is not set");
    }

    const cognitoRegion = process.env.COGNITO_REGION || process.env.APP_REGION || "us-east-1";
    const tokenEndpoint = `https://${COGNITO_DOMAIN}.auth.${cognitoRegion}.amazoncognito.com/oauth2/token`;

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID!,
        code: code,
        redirect_uri: redirectUri,
    });

    // Add client secret if available
    if (CLIENT_SECRET) {
        params.append("client_secret", CLIENT_SECRET);
    }

    try {
        console.log("🔄 Exchanging OAuth code for tokens:", {
            tokenEndpoint,
            redirectUri,
            hasClientSecret: !!CLIENT_SECRET,
            clientIdPrefix: CLIENT_ID?.substring(0, 8) + "...",
        });

        const response = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Token exchange failed:", {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                redirectUri: redirectUri,
                tokenEndpoint: tokenEndpoint,
                hasClientSecret: !!CLIENT_SECRET,
            });
            
            // Try to parse the error
            let errorMessage = "Failed to exchange code for tokens";
            let errorDetails = "";
            try {
                const errorData = JSON.parse(errorText);
                console.error("Token exchange error:", errorData);
                errorMessage = errorData.error_description || errorData.error || errorMessage;
                
                // Provide helpful context based on error type
                if (errorData.error === "unauthorized_client") {
                    errorDetails = " - This usually means the redirect URI doesn't match what's configured in Cognito App Client settings. Please ensure your deployed domain is added to 'Allowed callback URLs' in Cognito.";
                } else if (errorData.error === "invalid_client") {
                    errorDetails = " - Check that COGNITO_CLIENT_ID and COGNITO_CLIENT_SECRET are correctly set in your environment variables.";
                } else if (errorData.error === "invalid_grant") {
                    errorDetails = " - The authorization code is invalid or expired. Try signing in again.";
                }
            } catch {
                // If not JSON, use the raw text if it's short
                if (errorText.length < 100) {
                    errorMessage = errorText;
                }
            }
            
            throw new Error(errorMessage + errorDetails);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            idToken: data.id_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
        };
    } catch (error: any) {
        console.error("Error exchanging OAuth code:", error);
        throw new Error(error.message || "OAuth authentication failed");
    }
}
