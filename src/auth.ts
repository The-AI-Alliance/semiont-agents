/**
 * Authentication Helpers
 *
 * Reusable authentication utilities for demo scripts.
 */

import type { SemiontApiClient } from '@semiont/api-client';
import type { AccessToken } from '@semiont/core';
import { accessToken, email } from '@semiont/core';
import { printInfo, printSuccess } from './display';

export interface AuthConfig {
  email?: string;
  password?: string;
  accessToken?: string;
}

/**
 * Authenticate with the backend using email/password or access token.
 * Returns an AccessToken for use in subsequent API calls.
 */
export async function authenticate(client: SemiontApiClient, config: AuthConfig): Promise<AccessToken> {
  if (config.accessToken) {
    printInfo('Using provided access token...');
    const token = accessToken(config.accessToken);
    printSuccess('Access token configured');
    return token;
  } else if (config.email && config.password) {
    printInfo(`Authenticating as ${config.email}...`);
    try {
      const response = await client.authenticatePassword(email(config.email), config.password);
      printSuccess(`Authenticated successfully`);
      return accessToken(response.token);
    } catch (error: unknown) {
      const err = error as Error & { status?: number; details?: unknown };
      console.error('\n❌ Authentication failed:');
      console.error(`   Email: ${config.email}`);
      console.error(`   Error: ${err.message || error}`);
      if (err.status) {
        console.error(`   HTTP Status: ${err.status}`);
      }
      if (err.details) {
        console.error(`   Details: ${JSON.stringify(err.details, null, 2)}`);
      }
      throw new Error(`Authentication failed for ${config.email}: ${err.message || error}`);
    }
  } else if (config.email) {
    console.error('\n❌ Configuration error:');
    console.error(`   Email: ${config.email}`);
    console.error(`   Password: ${config.password ? '[provided]' : '[MISSING]'}`);
    throw new Error('Password is required when authenticating with email. Check AUTH_PASSWORD in .env file.');
  } else {
    console.error('\n❌ Configuration error:');
    console.error(`   Email: ${config.email || '[not provided]'}`);
    console.error(`   Access Token: ${config.accessToken ? '[provided]' : '[not provided]'}`);
    console.error('\nEither (email + password) or accessToken must be provided.');
    console.error('Check AUTH_EMAIL and AUTH_PASSWORD or ACCESS_TOKEN in .env file.');
    throw new Error('Either (email + password) or accessToken must be provided');
  }
}
