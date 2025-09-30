// Authentication Debug Utility
// Helper functions to debug and fix authentication issues

export const debugAuth = () => {
  if (typeof window === 'undefined') return;

  console.log('🔍 Authentication Debug:');

  // Check localStorage for auth tokens
  const authTokens = localStorage.getItem('auth-tokens');
  console.log('📦 Auth tokens in localStorage:', authTokens);

  if (authTokens) {
    try {
      const parsed = JSON.parse(authTokens);
      console.log('📝 Parsed auth data:', parsed);

      if (parsed.state?.tokens) {
        const { accessToken, refreshToken, expiresAt } = parsed.state.tokens;
        const now = new Date();
        const expires = new Date(expiresAt);

        console.log('🕐 Token expires at:', expires);
        console.log('🕐 Current time:', now);
        console.log('⏱️ Token expired?', now > expires);
        console.log('🔑 Access token:', accessToken?.substring(0, 50) + '...');
        console.log('🔄 Refresh token:', refreshToken?.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('❌ Error parsing auth tokens:', error);
    }
  }

  // Check old localStorage keys
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  console.log('🔑 Legacy access_token:', accessToken?.substring(0, 50) + '...');
  console.log('🔄 Legacy refresh_token:', refreshToken?.substring(0, 50) + '...');
};

export const clearAllAuth = () => {
  if (typeof window === 'undefined') return;

  console.log('🧹 Clearing all authentication data...');

  // Clear auth store data
  localStorage.removeItem('auth-tokens');

  // Clear legacy tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // Clear any other auth-related data
  localStorage.removeItem('user');
  localStorage.removeItem('tokens');

  console.log('✅ All authentication data cleared');
};

export const setValidToken = (tokenData: any) => {
  if (typeof window === 'undefined') return;

  console.log('💾 Setting valid token data...');

  // Set in auth store format
  const authStoreData = {
    state: {
      isAuthenticated: true,
      user: tokenData.user,
      tokens: tokenData.tokens,
    },
    version: 0
  };

  localStorage.setItem('auth-tokens', JSON.stringify(authStoreData));

  // Also set legacy format for compatibility
  localStorage.setItem('access_token', tokenData.tokens.accessToken);
  localStorage.setItem('refresh_token', tokenData.tokens.refreshToken);

  console.log('✅ Token data set successfully');
};

export const getFreshToken = async () => {
  try {
    console.log('🔄 Getting fresh token...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456'
      })
    });

    const data = await response.json();
    if (data.success) {
      setValidToken(data.data);
      console.log('✅ Fresh token set!');
      return data.data.tokens.accessToken;
    } else {
      console.error('❌ Login failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting fresh token:', error);
    return null;
  }
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).clearAllAuth = clearAllAuth;
  (window as any).setValidToken = setValidToken;
  (window as any).getFreshToken = getFreshToken;
}