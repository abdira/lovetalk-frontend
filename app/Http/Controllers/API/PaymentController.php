<?php
// Controller 7: PaymentController
// app/Http/Controllers/API/PaymentController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Payment::with(['session', 'client']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'counselor') {
            $query->whereHas('session', function($q) use ($user) {
                $q->where('counselor_id', $user->id);
            });
        } elseif ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($payments);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $payment = Payment::with(['session', 'client'])->findOrFail($id);

        // Check authorization
        if ($user->role === 'client' && $payment->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif ($user->role === 'counselor' && $payment->session->counselor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif ($user->role !== 'admin' && $user->role !== 'client' && $user->role !== 'counselor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|exists:sessions,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:card,paypal,bank_transfer',
            'payment_gateway' => 'nullable|string',
            'transaction_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $session = Session::findOrFail($request->session_id);

        // Check if user is authorized to make payment for this session
        if ($user->role === 'client' && $session->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif ($user->role !== 'client' && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::create([
            'session_id' => $request->session_id,
            'client_id' => $session->client_id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'payment_gateway' => $request->payment_gateway,
            'transaction_id' => $request->transaction_id,
            'status' => 'pending',
        ]);

        return response()->json($payment->load(['session', 'client']), 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        // Only admin can update payment records
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:pending,completed,failed,refunded',
            'amount' => 'sometimes|numeric|min:0',
            'payment_method' => 'sometimes|string|in:card,paypal,bank_transfer',
            'payment_gateway' => 'nullable|string',
            'transaction_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $payment = Payment::findOrFail($id);
        $payment->update($request->only([
            'status', 'amount', 'payment_method', 'payment_gateway', 
            'transaction_id', 'notes'
        ]));

        return response()->json($payment->load(['session', 'client']));
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // Only admin can delete payment records
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::findOrFail($id);
        $payment->delete();

        return response()->json(['message' => 'Payment deleted successfully']);
    }

    public function processPayment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_gateway_response' => 'required|array',
            'transaction_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $payment = Payment::findOrFail($id);

        // Check authorization
        if ($user->role === 'client' && $payment->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif ($user->role !== 'client' && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Process payment based on gateway response
        $gatewayResponse = $request->payment_gateway_response;
        
        if (isset($gatewayResponse['status']) && $gatewayResponse['status'] === 'success') {
            $payment->update([
                'status' => 'completed',
                'transaction_id' => $request->transaction_id,
                'processed_at' => now(),
            ]);

            // Update session payment status
            $payment->session->update(['payment_status' => 'paid']);

            return response()->json([
                'message' => 'Payment processed successfully',
                'payment' => $payment->load(['session', 'client'])
            ]);
        } else {
            $payment->update([
                'status' => 'failed',
                'notes' => $gatewayResponse['message'] ?? 'Payment failed',
            ]);

            return response()->json([
                'message' => 'Payment processing failed',
                'error' => $gatewayResponse['message'] ?? 'Unknown error',
                'payment' => $payment->load(['session', 'client'])
            ], 400);
        }
    }

    public function refund(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'amount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Only admin can process refunds
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Can only refund completed payments'
            ], 400);
        }

        $refundAmount = $request->amount ?? $payment->amount;

        if ($refundAmount > $payment->amount) {
            return response()->json([
                'message' => 'Refund amount cannot exceed payment amount'
            ], 400);
        }

        // Process refund (integrate with actual payment gateway)
        // This is a simplified version - in reality, you'd call the payment gateway's refund API

        $payment->update([
            'status' => 'refunded',
            'refund_amount' => $refundAmount,
            'refund_reason' => $request->reason,
            'refunded_at' => now(),
        ]);

        // Update session payment status if full refund
        if ($refundAmount == $payment->amount) {
            $payment->session->update(['payment_status' => 'refunded']);
        }

        return response()->json([
            'message' => 'Payment refunded successfully',
            'payment' => $payment->load(['session', 'client'])
        ]);
    }


    public function history(Request $request)
    {
        $payments = \App\Models\Payment::with('session.counselor')
        ->where('client_id', $request->user()->id)
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($payments);
   }

    public function getPaymentStats(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalPayments = Payment::where('status', 'completed')->sum('amount');
        $totalRefunds = Payment::where('status', 'refunded')->sum('refund_amount');
        $pendingPayments = Payment::where('status', 'pending')->count();
        $failedPayments = Payment::where('status', 'failed')->count();

        $monthlyStats = Payment::where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        return response()->json([
            'total_payments' => $totalPayments,
            'total_refunds' => $totalRefunds,
            'net_revenue' => $totalPayments - $totalRefunds,
            'pending_payments' => $pendingPayments,
            'failed_payments' => $failedPayments,
            'monthly_revenue' => $monthlyStats,
        ]);
    }
}
