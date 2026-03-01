/**
 * PaymentScreen — Razorpay checkout via WebView
 *
 * Flow:
 *  1. Mount → calls POST /payment/create-order (authenticated)
 *  2. Renders Razorpay checkout HTML inside WebView
 *  3. User pays via UPI ID, UPI app (GPay/PhonePe/Paytm), card, etc.
 *  4. WebView posts result back via window.ReactNativeWebView.postMessage
 *  5. On success: calls POST /payment/verify  → backend verifies HMAC
 *  6. Navigates back with success toast
 */

import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderData {
  orderId: string;
  amount: number;        // in paise
  currency: string;
  keyId: string;
  merchantName: string;
  planId: string;
  durationDays: number;
  description: string;
}

type CheckoutStatus = 'loading' | 'ready' | 'processing' | 'success' | 'failed';

// ─── Razorpay checkout HTML ───────────────────────────────────────────────────

/**
 * Generates the standalone HTML page that loads Razorpay Standard Checkout.
 * Communication back to RN happens via window.ReactNativeWebView.postMessage().
 */
function buildCheckoutHtml(order: OrderData, phoneNumber: string): string {
  // amount is in paise; display in rupees
  const amountDisplay = `₹${(order.amount / 100).toLocaleString('en-IN')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Detto Premium Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 24px;
      padding: 32px 24px;
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    .logo {
      width: 70px; height: 70px; border-radius: 20px;
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
    }
    h1 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .plan { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; }
    .amount { font-size: 48px; font-weight: 900; color: #FF6B6B; margin-bottom: 4px; }
    .amount-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 32px; }
    
    .method-title { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    
    .btn {
      width: 100%; padding: 16px;
      border-radius: 16px;
      border: none;
      cursor: pointer;
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: transform 0.1s;
    }
    .btn:active { transform: scale(0.97); }
    
    .btn-razorpay {
      background: linear-gradient(135deg, #072654, #1a5cf6);
      color: #fff;
    }
    .btn-upi-id {
      background: rgba(255,255,255,0.08);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
    }

    /* UPI ID input form */
    .upi-form { display: none; margin-top: 12px; text-align: left; }
    .upi-form.visible { display: block; }
    .upi-input {
      width: 100%; padding: 14px 16px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: #fff; font-size: 15px;
      margin-bottom: 12px;
      outline: none;
    }
    .upi-input::placeholder { color: rgba(255,255,255,0.35); }
    .btn-pay-upi {
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
      color: #fff;
    }
    
    .divider { color: rgba(255,255,255,0.25); font-size: 12px; margin: 8px 0 18px; }
    .secure { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 16px; }
    
    /* status */
    .status-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: none; align-items: center; justify-content: center;
    }
    .status-overlay.visible { display: flex; }
    .spinner {
      width: 50px; height: 50px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: #FF6B6B;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

<div class="card">
  <div class="logo">💎</div>
  <h1>${order.merchantName} Premium</h1>
  <p class="plan">${order.description}</p>
  <div class="amount">${amountDisplay}</div>
  <p class="amount-label">One-time payment • ${order.durationDays} days access</p>

  <p class="method-title">Choose payment method</p>

  <!-- Razorpay Checkout (all methods: UPI app, UPI ID, Cards, Netbanking) -->
  <button class="btn btn-razorpay" onclick="openRazorpay()">
    💳&nbsp; Pay with Razorpay
  </button>

  <p class="divider">or</p>

  <!-- Quick UPI ID entry -->
  <button class="btn btn-upi-id" onclick="toggleUpiForm()">
    📱&nbsp; Enter UPI ID
  </button>
  <div class="upi-form" id="upiForm">
    <input id="upiInput" class="upi-input" type="text" inputmode="email" placeholder="yourname@upi" autocomplete="off" />
    <button class="btn btn-pay-upi btn" onclick="payWithUpiId()">
      Pay ${amountDisplay}
    </button>
  </div>

  <p class="secure">🔒&nbsp;256-bit SSL encrypted · Powered by Razorpay</p>
</div>

<!-- Loading overlay -->
<div class="status-overlay" id="overlay">
  <div class="spinner"></div>
</div>

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var ORDER_ID    = "${order.orderId}";
  var AMOUNT      = ${order.amount};
  var KEY_ID      = "${order.keyId}";
  var MERCHANT    = "${order.merchantName}";
  var DESCRIPTION = "${order.description}";
  var PHONE       = "${phoneNumber}";
  var PLAN_ID     = "${order.planId}";

  function postToRN(data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  function showOverlay() { document.getElementById('overlay').classList.add('visible'); }
  function hideOverlay() { document.getElementById('overlay').classList.remove('visible'); }

  function openRazorpay() {
    showOverlay();
    var options = {
      key:         KEY_ID,
      amount:      AMOUNT,
      currency:    'INR',
      name:        MERCHANT,
      description: DESCRIPTION,
      order_id:    ORDER_ID,
      prefill: { contact: PHONE },
      theme: { color: '#FF6B6B' },
      modal: {
        ondismiss: function() {
          hideOverlay();
          postToRN({ type: 'DISMISSED' });
        }
      },
      handler: function(response) {
        hideOverlay();
        postToRN({
          type:                'PAYMENT_SUCCESS',
          razorpayPaymentId:   response.razorpay_payment_id,
          razorpayOrderId:     response.razorpay_order_id,
          razorpaySignature:   response.razorpay_signature,
          planId:              PLAN_ID,
        });
      }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      hideOverlay();
      postToRN({ type: 'PAYMENT_FAILED', error: resp.error.description });
    });
    rzp.open();
  }

  function toggleUpiForm() {
    var form = document.getElementById('upiForm');
    form.classList.toggle('visible');
    if (form.classList.contains('visible')) {
      document.getElementById('upiInput').focus();
    }
  }

  function payWithUpiId() {
    var upiId = document.getElementById('upiInput').value.trim();
    if (!upiId || !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    showOverlay();
    var options = {
      key:         KEY_ID,
      amount:      AMOUNT,
      currency:    'INR',
      name:        MERCHANT,
      description: DESCRIPTION,
      order_id:    ORDER_ID,
      prefill: { contact: PHONE, vpa: upiId },
      method: { upi: true, card: false, netbanking: false, wallet: false },
      theme: { color: '#FF6B6B' },
      modal: {
        ondismiss: function() {
          hideOverlay();
          postToRN({ type: 'DISMISSED' });
        }
      },
      handler: function(response) {
        hideOverlay();
        postToRN({
          type:                'PAYMENT_SUCCESS',
          razorpayPaymentId:   response.razorpay_payment_id,
          razorpayOrderId:     response.razorpay_order_id,
          razorpaySignature:   response.razorpay_signature,
          planId:              PLAN_ID,
        });
      }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      hideOverlay();
      postToRN({ type: 'PAYMENT_FAILED', error: resp.error.description });
    });
    rzp.open();
  }
</script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = (params.planId ?? 'quarterly') as 'monthly' | 'quarterly' | 'annual';

  const webviewRef = useRef<WebView>(null);
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // ── Load order on mount ──────────────────────────────────────────────────
  useEffect(() => {
    initOrder();
  }, []);

  const initOrder = async () => {
    try {
      setStatus('loading');
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      const phone = userStr ? JSON.parse(userStr)?.phoneNumber ?? '' : '';
      setPhoneNumber(phone);

      if (!token) {
        setError('You must be logged in to proceed with payment.');
        setStatus('failed');
        return;
      }

      const res = await api.createPaymentOrder(token, planId);

      if (res.error || !res.data) {
        setError(res.error ?? 'Could not create payment order. Make sure Razorpay keys are configured.');
        setStatus('failed');
        return;
      }

      setOrderData(res.data);
      setStatus('ready');
    } catch (e: any) {
      setError(e.message ?? 'Network error. Please try again.');
      setStatus('failed');
    }
  };

  // ── Handle deep links from UPI apps ─────────────────────────────────────
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    // Intercept UPI deep links and open them natively
    if (
      url.startsWith('upi://') ||
      url.startsWith('phonepe://') ||
      url.startsWith('gpay://') ||
      url.startsWith('paytm://') ||
      url.startsWith('bhim://')
    ) {
      Linking.openURL(url).catch(() =>
        Alert.alert('App not found', 'UPI app is not installed on this device.')
      );
      return false; // prevent WebView from loading it
    }
    return true;
  };

  // ── Handle messages from Razorpay checkout JS ────────────────────────────
  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'PAYMENT_SUCCESS') {
        setStatus('processing');
        await handlePaymentSuccess(msg);
      } else if (msg.type === 'PAYMENT_FAILED') {
        Alert.alert(
          'Payment Failed',
          msg.error ?? 'Payment could not be processed. Please try again.',
          [{ text: 'Try Again', onPress: () => setStatus('ready') }]
        );
        setStatus('ready');
      } else if (msg.type === 'DISMISSED') {
        // User closed checkout — stay on screen
        setStatus('ready');
      }
    } catch { /* non-JSON messages from other scripts */ }
  };

  const handlePaymentSuccess = async (msg: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    planId: string;
  }) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const res = await api.verifyPayment(
        token,
        msg.razorpayOrderId,
        msg.razorpayPaymentId,
        msg.razorpaySignature,
        msg.planId,
      );

      if (res.data?.success) {
        setStatus('success');
        Alert.alert(
          '🎉 Welcome to Premium!',
          `You now have ${res.data.durationDays} days of unlimited access. Enjoy Detto Premium!`,
          [{ text: "Let's go!", onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        throw new Error(res.error ?? 'Payment verification failed');
      }
    } catch (e: any) {
      Alert.alert(
        'Verification Failed',
        e.message ?? 'Could not verify payment. Contact support with your payment ID.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setStatus('ready');
    }
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Preparing checkout…</Text>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
        <Ionicons name="alert-circle-outline" size={56} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={initOrder}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'processing') {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Verifying payment…</Text>
        <Text style={styles.subText}>Please wait, do not close the app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Razorpay WebView */}
      {orderData && (
        <WebView
          ref={webviewRef}
          source={{ html: buildCheckoutHtml(orderData, phoneNumber) }}
          originWhitelist={['*']}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;
            if (
              url.startsWith('upi://') ||
              url.startsWith('phonepe://') ||
              url.startsWith('gpay://') ||
              url.startsWith('paytm://') ||
              url.startsWith('bhim://')
            ) {
              Linking.openURL(url).catch(() =>
                Alert.alert('App not found', 'Please install the UPI app first.')
              );
              return false;
            }
            return true;
          }}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsInlineMediaPlayback
          style={styles.webview}
          // Allow Razorpay's CDN
          allowsBackForwardNavigationGestures={false}
          // iOS: allow UPI deep links
          {...(Platform.OS === 'ios' ? { allowsLinkPreview: false } : {})}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  webview: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: 'rgba(15,12,41,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  loadingText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  subText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, textAlign: 'center' },

  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  errorText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 28,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
