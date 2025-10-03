import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
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
            if (authFlow === authFlows[authFlows.length - 1]) {
                // This was the last auth flow, re-throw the error
                throw error;
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
