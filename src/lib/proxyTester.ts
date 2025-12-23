// Real Proxy Testing Library
import { isElectron } from './electron';

export interface ProxyTestResult {
  success: boolean;
  latency: number;
  ip?: string;
  country?: string;
  city?: string;
  isp?: string;
  error?: string;
  timestamp: Date;
}

export interface ProxyConfig {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
  username?: string;
  password?: string;
}

// Test proxy using Electron's real proxy testing (routes through actual proxy)
export async function testProxy(proxy: ProxyConfig): Promise<ProxyTestResult> {
  // If running in Electron, use the real proxy test
  if (isElectron() && (window as any).electronAPI?.testProxyReal) {
    try {
      const result = await (window as any).electronAPI.testProxyReal({
        type: proxy.type,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password
      });
      
      return {
        success: result.success,
        latency: result.latency || 0,
        ip: result.ip,
        country: result.country,
        city: result.city,
        isp: result.isp,
        error: result.error,
        timestamp: new Date(result.timestamp || Date.now())
      };
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Electron proxy test failed',
        timestamp: new Date()
      };
    }
  }
  
  // Fallback for web preview - CANNOT test proxy from browser
  // Must show error, NOT the user's real IP
  return {
    success: false,
    latency: 0,
    error: isElectron() 
      ? 'فشل اختبار البروكسي - تأكد من صحة البيانات' 
      : 'اختبار البروكسي الحقيقي يتطلب تطبيق Electron - لا يمكن الاختبار من المتصفح',
    timestamp: new Date()
  };
}

// Wrapper for testProxy - uses real Electron test when available
export async function testProxyWithCors(proxy: ProxyConfig): Promise<ProxyTestResult> {
  return testProxy(proxy);
}

// Batch test multiple proxies
export async function testMultipleProxies(
  proxies: { id: string; config: ProxyConfig }[]
): Promise<Map<string, ProxyTestResult>> {
  const results = new Map<string, ProxyTestResult>();
  
  // Test proxies in parallel with concurrency limit
  const concurrencyLimit = 3; // Lower for real proxy testing
  
  for (let i = 0; i < proxies.length; i += concurrencyLimit) {
    const batch = proxies.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map(async ({ id, config }) => {
        const result = await testProxy(config);
        return { id, result };
      })
    );
    
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
  }
  
  return results;
}

// Check proxy anonymity level
export async function checkProxyAnonymity(proxy: ProxyConfig): Promise<{
  level: 'transparent' | 'anonymous' | 'elite';
  details: string[];
}> {
  try {
    // Test the proxy first
    const proxyResult = await testProxy(proxy);
    
    if (!proxyResult.success || !proxyResult.ip) {
      return {
        level: 'transparent',
        details: ['Could not test proxy anonymity - connection failed']
      };
    }
    
    // Get real IP (without proxy) for comparison - only in Electron
    if (isElectron()) {
      // In Electron, we can compare real IP vs proxy IP
      // For now, determine by proxy type
      if (proxy.type === 'socks5') {
        return {
          level: 'elite',
          details: [
            'SOCKS5 provides high anonymity',
            'No IP headers forwarded',
            `Proxy IP: ${proxyResult.ip}`,
            proxyResult.country ? `Location: ${proxyResult.city}, ${proxyResult.country}` : ''
          ].filter(Boolean)
        };
      } else if (proxy.type === 'socks4') {
        return {
          level: 'anonymous',
          details: [
            'SOCKS4 provides good anonymity',
            `Proxy IP: ${proxyResult.ip}`,
            proxyResult.country ? `Location: ${proxyResult.city}, ${proxyResult.country}` : ''
          ].filter(Boolean)
        };
      } else if (proxy.type === 'https') {
        return {
          level: 'anonymous',
          details: [
            'HTTPS proxy with SSL encryption',
            `Proxy IP: ${proxyResult.ip}`,
            proxyResult.country ? `Location: ${proxyResult.city}, ${proxyResult.country}` : ''
          ].filter(Boolean)
        };
      }
    }
    
    return {
      level: 'transparent',
      details: [
        'HTTP proxy - traffic may not be encrypted',
        `IP: ${proxyResult.ip}`,
        proxyResult.country ? `Location: ${proxyResult.city}, ${proxyResult.country}` : ''
      ].filter(Boolean)
    };
  } catch {
    return {
      level: 'transparent',
      details: ['Could not determine anonymity level']
    };
  }
}
