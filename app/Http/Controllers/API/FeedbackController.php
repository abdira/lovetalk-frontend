<?php

// Controller 6: FeedbackController
// app/Http/Controllers/API/FeedbackController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    public function store(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = Session::with(['client', 'counselor'])->findOrFail($sessionId);

        // Check authorization and session status
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($session->status !== 'completed') {
            return response()->json(['message' => 'Session must be completed to leave feedback'], 400);
        }

        // Check if feedback already exists
        if ($session->feedback) {
            return response()->json(['message' => 'Feedback already submitted for this session'], 400);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'client_feedback' => 'sometimes|string|max:1000',
            'counselor_feedback' => 'sometimes|string|max:1000',
            'would_recommend' => 'boolean',
            'rating_categories' => 'sometimes|array',
            'is_anonymous' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $feedbackData = [
            'session_id' => $sessionId,
            'client_id' => $session->client_id,
            'counselor_id' => $session->counselor_id,
            'rating' => $request->rating,
            'would_recommend' => $request->get('would_recommend', true),
            'rating_categories' => $request->rating_categories,
            'is_anonymous' => $request->get('is_anonymous', false),
        ];

        // Add feedback based on user role
        if ($user->role === 'client') {
            $feedbackData['client_feedback'] = $request->client_feedback;
        } elseif ($user->role === 'counselor') {
            $feedbackData['counselor_feedback'] = $request->counselor_feedback;
        }

        $feedback = Feedback::create($feedbackData);

        // Update counselor rating
        $counselor = User::find($session->counselor_id)->counselor;
        $counselor->updateRating();

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback
        ], 201);
    }

    public function show(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = Session::findOrFail($sessionId);

        // Check authorization
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $feedback = Feedback::where('session_id', $sessionId)->first();

        if (!$feedback) {
            return response()->json(['message' => 'No feedback found'], 404);
        }

        return response()->json(['feedback' => $feedback]);
    }

    public function getCounselorFeedback(Request $request, $counselorId)
    {
        $feedback = Feedback::with(['client' => function($q) {
            $q->select('id', 'name');
        }])
        ->where('counselor_id', $counselorId)
        ->where('is_anonymous', false)
        ->orderBy('created_at', 'desc')
        ->paginate(10);

        return response()->json($feedback);
    }

    public function getStats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'counselor') {
            $stats = [
                'total_feedback' => Feedback::where('counselor_id', $user->id)->count(),
                'average_rating' => Feedback::where('counselor_id', $user->id)->avg('rating'),
                'recommendation_rate' => Feedback::where('counselor_id', $user->id)
                    ->where('would_recommend', true)->count() / 
                    max(1, Feedback::where('counselor_id', $user->id)->count()) * 100,
                'rating_distribution' => Feedback::where('counselor_id', $user->id)
                    ->selectRaw('rating, COUNT(*) as count')
                    ->groupBy('rating')
                    ->pluck('count', 'rating'),
            ];
        } else {
            $stats = [
                'sessions_rated' => Feedback::where('client_id', $user->id)->count(),
                'average_rating_given' => Feedback::where('client_id', $user->id)->avg('rating'),
            ];
        }

        return response()->json(['stats' => $stats]);
    }
}
