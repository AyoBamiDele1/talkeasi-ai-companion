import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Currency = 'NGN' | 'USD' | 'GBP';

interface LocationData {
  country_code: string;
  country_name: string;
  currency: Currency;
  city?: string;
  region?: string;
}

const STORAGE_KEY = 'user_location_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          // Use cached data if it's less than 24 hours old
          if (now - timestamp < CACHE_DURATION) {
            setLocation(data);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh location data
        const { data, error } = await supabase.functions.invoke('get-user-location');

        if (error) {
          console.error('Error fetching location:', error);
          // Use fallback
          const fallbackData: LocationData = {
            country_code: 'US',
            country_name: 'United States',
            currency: 'USD'
          };
          setLocation(fallbackData);
        } else {
          setLocation(data);
          
          // Cache the result
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error in useUserLocation:', error);
        // Fallback to USD
        setLocation({
          country_code: 'US',
          country_name: 'United States',
          currency: 'USD'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const getCurrencySymbol = (currency: Currency) => {
    switch (currency) {
      case 'NGN':
        return '₦';
      case 'GBP':
        return '£';
      case 'USD':
      default:
        return '$';
    }
  };

  const formatPrice = (priceNGN: number, priceUSD: number, priceGBP: number) => {
    if (!location) return '';
    
    const currency = location.currency;
    const symbol = getCurrencySymbol(currency);
    
    switch (currency) {
      case 'NGN':
        return `${symbol}${priceNGN.toLocaleString()}`;
      case 'GBP':
        return `${symbol}${priceGBP.toFixed(2)}`;
      case 'USD':
      default:
        return `${symbol}${priceUSD.toFixed(2)}`;
    }
  };

  const getSecondaryPrices = (priceNGN: number, priceUSD: number, priceGBP: number) => {
    if (!location) return '';
    
    const currency = location.currency;
    const prices: string[] = [];
    
    if (currency !== 'NGN') prices.push(`₦${priceNGN.toLocaleString()}`);
    if (currency !== 'USD') prices.push(`$${priceUSD.toFixed(2)}`);
    if (currency !== 'GBP') prices.push(`£${priceGBP.toFixed(2)}`);
    
    return prices.join(' • ');
  };

  return {
    location,
    loading,
    currency: location?.currency || 'USD',
    currencySymbol: getCurrencySymbol(location?.currency || 'USD'),
    formatPrice,
    getSecondaryPrices,
    isNigerian: location?.country_code === 'NG',
  };
};
