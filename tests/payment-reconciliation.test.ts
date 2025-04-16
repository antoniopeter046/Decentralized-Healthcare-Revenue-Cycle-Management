import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock structure to simulate contract interactions
let providerContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedProviders: new Map(),
  
  isProviderVerified(provider) {
    const data = this.verifiedProviders.get(provider);
    return data ? data.verified : false;
  },
  
  getProviderDetails(provider) {
    return this.verifiedProviders.get(provider) || null;
  },
  
  addProvider(sender, provider, name, licenseNumber, specialty) {
    if (sender !== this.admin) return { error: 403 };
    if (this.verifiedProviders.has(provider)) return { error: 400 };
    
    this.verifiedProviders.set(provider, {
      name,
      "license-number": licenseNumber,
      specialty,
      verified: true,
      "verification-date": 123 // Mocked block height
    });
    
    return { success: true };
  },
  
  revokeProvider(sender, provider) {
    if (sender !== this.admin) return { error: 403 };
    if (!this.verifiedProviders.has(provider)) return { error: 404 };
    
    this.verifiedProviders.delete(provider);
    return { success: true };
  },
  
  updateProvider(sender, provider, name, licenseNumber, specialty) {
    if (sender !== this.admin) return { error: 403 };
    if (!this.verifiedProviders.has(provider)) return { error: a404 };
    
    this.verifiedProviders.set(provider, {
      name,
      "license-number": licenseNumber,
      specialty,
      verified: true,
      "verification-date": 123 // Mocked block height
    });
    
    return { success: true };
  },
  
  transferAdmin(sender, newAdmin) {
    if (sender !== this.admin) return { error: 403 };
    this.admin = newAdmin;
    return { success: true };
  }
};

describe('Provider Verification Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
    providerContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    providerContract.verifiedProviders = new Map();
  });
  
  it('should add a provider as admin', () => {
    const result = providerContract.addProvider(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Admin
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Provider
        'Dr. Smith',
        'LIC123456',
        'Cardiology'
    );
    
    expect(result.success).toBe(true);
    expect(providerContract.isProviderVerified('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(true);
    
    const details = providerContract.getProviderDetails('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(details.name).toBe('Dr. Smith');
    expect(details.specialty).toBe('Cardiology');
  });
  
  it('should not add a provider when sender is not admin', () => {
    const result = providerContract.addProvider(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Not admin
        'ST3CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Provider
        'Dr. Jones',
        'LIC654321',
        'Neurology'
    );
    
    expect(result.error).toBe(403);
    expect(providerContract.isProviderVerified('ST3CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(false);
  });
  
  it('should revoke provider verification', () => {
    // First add a provider
    providerContract.addProvider(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Admin
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Provider
        'Dr. Smith',
        'LIC123456',
        'Cardiology'
    );
    
    // Now revoke it
    const result = providerContract.revokeProvider(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Admin
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'  // Provider
    );
    
    expect(result.success).toBe(true);
    expect(providerContract.isProviderVerified('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(false);
  });
  
  it('should transfer admin rights', () => {
    const newAdmin = 'ST3CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const result = providerContract.transferAdmin(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Current admin
        newAdmin
    );
    
    expect(result.success).toBe(true);
    expect(providerContract.admin).toBe(newAdmin);
    
    // Verify old admin can't add providers anymore
    const addResult = providerContract.addProvider(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Old admin
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Provider
        'Dr. Smith',
        'LIC123456',
        'Cardiology'
    );
    
    expect(addResult.error).toBe(403);
    
    // Verify new admin can add providers
    const newAddResult = providerContract.addProvider(
        newAdmin, // New admin
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // Provider
        'Dr. Smith',
        'LIC123456',
        'Cardiology'
    );
    
    expect(newAddResult.success).toBe(true);
  });
});
