export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface NetworkMetrics {
  quality: NetworkQuality;
  latency: number;
  timestamp: number;
}

export class NetworkMonitor {
  private latencyHistory: number[] = [];
  private readonly maxHistorySize = 10;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async measureLatency(): Promise<number> {
    const start = performance.now();
    
    try {
      // Ping a lightweight endpoint
      await fetch('https://qcxjjhgfgyfhwacxppcp.supabase.co/rest/v1/', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const latency = performance.now() - start;
      console.log('[NetworkMonitor] Latency:', latency.toFixed(0), 'ms');
      return latency;
    } catch (error) {
      console.error('[NetworkMonitor] Error measuring latency:', error);
      return 5000; // Assume poor connection on error
    }
  }

  async getNetworkQuality(): Promise<NetworkMetrics> {
    const latency = await this.measureLatency();
    
    // Add to history
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.maxHistorySize) {
      this.latencyHistory.shift();
    }

    // Calculate average latency
    const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;

    // Determine quality
    let quality: NetworkQuality;
    if (avgLatency < 100) {
      quality = 'excellent';
    } else if (avgLatency < 300) {
      quality = 'good';
    } else if (avgLatency < 1000) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    console.log('[NetworkMonitor] Quality:', quality, 'avgLatency:', avgLatency.toFixed(0), 'ms');

    return {
      quality,
      latency: avgLatency,
      timestamp: Date.now()
    };
  }

  startMonitoring(onUpdate: (metrics: NetworkMetrics) => void, intervalMs = 30000) {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    console.log('[NetworkMonitor] Starting monitoring...');
    
    // Initial measurement
    this.getNetworkQuality().then(onUpdate);

    // Periodic measurements with longer interval for mobile
    this.monitoringInterval = setInterval(async () => {
      const metrics = await this.getNetworkQuality();
      onUpdate(metrics);
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      console.log('[NetworkMonitor] Stopping monitoring...');
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getRecommendedBatchSize(quality: NetworkQuality): number {
    // Recommend how many transcript chunks to batch before sending
    switch (quality) {
      case 'excellent':
        return 1; // Send immediately
      case 'good':
        return 2; // Wait for 2 chunks
      case 'fair':
        return 3; // Wait for 3 chunks
      case 'poor':
        return 5; // Batch heavily
      default:
        return 3;
    }
  }

  getRecommendedSilenceMs(quality: NetworkQuality): number {
    // Recommend how long to wait for silence before sending
    switch (quality) {
      case 'excellent':
        return 500;
      case 'good':
        return 750;
      case 'fair':
        return 1000;
      case 'poor':
        return 1500;
      default:
        return 1000;
    }
  }
}
