import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PurchaseRequest {
  receipt: string;
  platform: 'apple' | 'google';
  productId: string;
}

interface AppleReceipt {
  status: number;
  latest_receipt_info?: Array<{
    transaction_id: string;
    original_transaction_id: string;
    product_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    is_trial_period?: string;
  }>;
  receipt?: {
    in_app?: Array<{
      transaction_id: string;
      original_transaction_id: string;
      product_id: string;
      purchase_date_ms: string;
    }>;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid or expired token');
    }

    // Parse request body
    const { receipt, platform, productId }: PurchaseRequest = await req.json();

    if (!receipt || !platform || !productId) {
      throw new Error('Missing required fields: receipt, platform, productId');
    }

    if (platform !== 'apple' && platform !== 'google') {
      throw new Error('Invalid platform. Must be "apple" or "google"');
    }

    // Verify receipt with platform
    let isValid = false;
    let transactionId = '';
    let originalTransactionId = '';
    let purchaseDate: Date | null = null;
    let expiresDate: Date | null = null;
    let isTrial = false;
    let revenueUsd = 0;

    if (platform === 'apple') {
      // Apple receipt verification
      const appleSharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
      
      if (!appleSharedSecret) {
        console.warn('APPLE_SHARED_SECRET not configured. Using test mode.');
        // In test mode, accept any receipt
        isValid = true;
        transactionId = `test_${Date.now()}`;
        originalTransactionId = transactionId;
        purchaseDate = new Date();
        
        // Set expiration based on product
        if (productId.includes('monthly')) {
          expiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          revenueUsd = 9.99;
        } else if (productId.includes('yearly')) {
          expiresDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          revenueUsd = 79.99;
        } else if (productId.includes('lifetime')) {
          expiresDate = null; // lifetime
          revenueUsd = 149.99;
        }
      } else {
        // Production: Verify with Apple
        const verifyUrl = 'https://buy.itunes.apple.com/verifyReceipt';
        const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
        
        // Try production first
        let response = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'receipt-data': receipt,
            'password': appleSharedSecret,
            'exclude-old-transactions': true,
          }),
        });

        let data: AppleReceipt = await response.json();
        
        // If status is 21007, it's a sandbox receipt
        if (data.status === 21007) {
          response = await fetch(sandboxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              'receipt-data': receipt,
              'password': appleSharedSecret,
              'exclude-old-transactions': true,
            }),
          });
          data = await response.json();
        }

        if (data.status === 0) {
          isValid = true;
          
          // Get latest transaction
          const latestReceipt = data.latest_receipt_info?.[0] || data.receipt?.in_app?.[0];
          
          if (latestReceipt) {
            transactionId = latestReceipt.transaction_id;
            originalTransactionId = latestReceipt.original_transaction_id;
            purchaseDate = new Date(parseInt(latestReceipt.purchase_date_ms));
            
            if (latestReceipt.expires_date_ms) {
              expiresDate = new Date(parseInt(latestReceipt.expires_date_ms));
            }
            
            isTrial = latestReceipt.is_trial_period === 'true';
            
            // Determine revenue
            if (productId.includes('monthly')) {
              revenueUsd = 9.99;
            } else if (productId.includes('yearly')) {
              revenueUsd = 79.99;
            } else if (productId.includes('lifetime')) {
              revenueUsd = 149.99;
            }
          }
        } else {
          throw new Error(`Apple receipt verification failed with status ${data.status}`);
        }
      }
    } else if (platform === 'google') {
      // Google Play receipt verification
      // Note: This requires Google Play Developer API credentials
      const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
      
      if (!googleServiceAccount) {
        console.warn('GOOGLE_SERVICE_ACCOUNT not configured. Using test mode.');
        // Test mode
        isValid = true;
        transactionId = `test_google_${Date.now()}`;
        originalTransactionId = transactionId;
        purchaseDate = new Date();
        
        if (productId.includes('monthly')) {
          expiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          revenueUsd = 9.99;
        } else if (productId.includes('yearly')) {
          expiresDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          revenueUsd = 79.99;
        } else if (productId.includes('lifetime')) {
          expiresDate = null;
          revenueUsd = 149.99;
        }
      } else {
        // TODO: Implement Google Play verification
        // This requires OAuth2 authentication with Google Play Developer API
        throw new Error('Google Play verification not yet implemented');
      }
    }

    if (!isValid) {
      throw new Error('Receipt verification failed');
    }

    // Use service role client to update database
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Call process_subscription_purchase function
    const { data: result, error: dbError } = await serviceClient.rpc(
      'process_subscription_purchase',
      {
        p_user_id: user.id,
        p_platform: platform,
        p_product_id: productId,
        p_transaction_id: transactionId,
        p_original_transaction_id: originalTransactionId,
        p_purchase_date: purchaseDate?.toISOString(),
        p_expires_date: expiresDate?.toISOString() || null,
        p_is_trial: isTrial,
        p_receipt_data: { receipt, verified_at: new Date().toISOString() },
        p_revenue_usd: revenueUsd,
      }
    );

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save purchase: ${dbError.message}`);
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Purchase verified successfully',
        premium_tier: productId.includes('yearly') ? 'yearly' : productId.includes('lifetime') ? 'lifetime' : 'monthly',
        expires_at: expiresDate?.toISOString() || null,
        transaction_id: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing purchase:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
