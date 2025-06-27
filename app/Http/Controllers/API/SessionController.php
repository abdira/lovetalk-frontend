<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Session::with(['client', 'counselor', 'payment']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'counselor') {
            $query->where('counselor_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin can see all sessions
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $sessions = $query->orderBy('scheduled_at', 'desc')->paginate(15);

        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'counselor_id' => 'required|exists:users,id',
            'type' => 'required|in:chat,video,audio',
            'scheduled_at' => 'required|date|after:now',
            'client_notes' => 'sometimes|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $client = $request->user();
        $counselor = User::with('counselor')->findOrFail($request->counselor_id);

        if ($counselor->role !== 'counselor') {
            return response()->json(['message' => 'Invalid counselor'], 400);
        }

        // Check counselor availability (basic check)
        $existingSession = Session::where('counselor_id', $counselor->id)
            ->where('scheduled_at', $request->scheduled_at)
            ->where('status', 'scheduled')
            ->exists();

        if ($existingSession) {
            return response()->json(['message' => 'Counselor is not available at this time'], 400);
        }

        DB::beginTransaction();

        try {
            $session = Session::create([
                'client_id' => $client->id,
                'counselor_id' => $counselor->id,
                'type' => $request->type,
                'scheduled_at' => $request->scheduled_at,
                'amount' => $counselor->counselor->hourly_rate,
                'client_notes' => $request->client_notes,
            ]);

            // Create payment record
            Payment::create([
                'session_id' => $session->id,
                'client_id' => $client->id,
                'amount' => $session->amount,
                'status' => 'pending',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Session booked successfully',
                'session' => $session->load(['client', 'counselor', 'payment'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to book session'], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        $session = Session::with(['client', 'counselor', 'payment', 'feedback'])
            ->findOrFail($id);

        // Check authorization
        if ($user->role === 'client' && $session->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'counselor' && $session->counselor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'session' => $session
        ]);
    }

    public function start(Request $request, $id)
    {
        $user = $request->user();
        $session = Session::findOrFail($id);

        // Only counselor or client can start session
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($session->status !== 'scheduled') {
            return response()->json(['message' => 'Session cannot be started'], 400);
        }

        $session->start();

        return response()->json([
            'message' => 'Session started',
            'session' => $session->fresh()
        ]);
    }

    public function complete(Request $request, $id)
    {
        $user = $request->user();
        $session = Session::findOrFail($id);

        // Only counselor can complete session
        if ($session->counselor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($session->status !== 'in_progress') {
            return response()->json(['message' => 'Session is not in progress'], 400);
        }

        $validator = Validator::make($request->all(), [
            'counselor_notes' => 'sometimes|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $session->complete();

        if ($request->has('counselor_notes')) {
            $session->update(['counselor_notes' => $request->counselor_notes]);
        }

        // Update counselor session count
        $counselor = User::find($session->counselor_id)->counselor;
        $counselor->incrementSessionCount();

        return response()->json([
            'message' => 'Session completed',
            'session' => $session->fresh()
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $session = Session::findOrFail($id);

        // Check authorization
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($session->status, ['scheduled'])) {
            return response()->json(['message' => 'Session cannot be cancelled'], 400);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $session->cancel($request->reason);

        return response()->json([
            'message' => 'Session cancelled',
            'session' => $session->fresh()
        ]);
    }

    public function getUpcoming(Request $request)
    {
        $user = $request->user();

        $query = Session::with(['client', 'counselor'])->upcoming();

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'counselor') {
            $query->where('counselor_id', $user->id);
        }

	$sessions = $query->orderBy('scheduled_at')->get();

	return response()->json($sessions);

    }
}
