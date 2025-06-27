<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Counselor;
use App\Models\CounselorAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CounselorController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['counselor'])
            ->where('role', 'counselor')
            ->where('is_active', true)
            ->whereHas('counselor', function($q) {
                $q->where('is_verified', true)->where('is_available', true);
            });

        // Filter by specialization
        if ($request->has('specialization')) {
            $query->whereHas('counselor', function($q) use ($request) {
                $q->where('specialization', 'like', '%' . $request->specialization . '%');
            });
        }

        // Filter by rating
        if ($request->has('min_rating')) {
            $query->whereHas('counselor', function($q) use ($request) {
                $q->where('rating', '>=', $request->min_rating);
            });
        }

        // Sort by rating or experience
        $sortBy = $request->get('sort_by', 'rating');
        $sortOrder = $request->get('sort_order', 'desc');

        if ($sortBy === 'rating') {
            $query->join('counselors', 'users.id', '=', 'counselors.user_id')
                  ->orderBy('counselors.rating', $sortOrder)
                  ->select('users.*');
        } elseif ($sortBy === 'experience') {
            $query->join('counselors', 'users.id', '=', 'counselors.user_id')
                  ->orderBy('counselors.years_experience', $sortOrder)
                  ->select('users.*');
        }

        $counselors = $query->paginate(12);

        return response()->json($counselors);
    }

    public function show($id)
    {
        $counselor = User::with(['counselor', 'counselorFeedback' => function($q) {
            $q->latest()->limit(5);
        }])
        ->where('role', 'counselor')
        ->where('is_active', true)
        ->findOrFail($id);

        return response()->json([
            'counselor' => $counselor
        ]);
    }

    // NEW store() method to create a counselor profile
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'counselor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'license_number' => 'required|string|max:100',
            'specialization' => 'required|string|max:255',
            'years_experience' => 'required|integer|min:0',
            'education' => 'required|string',
            'approach' => 'nullable|string',
            'hourly_rate' => 'required|numeric|min:0',
            'available_days' => 'nullable|array',
            'available_from' => 'required|date_format:H:i',
            'available_to' => 'required|date_format:H:i',
            'timezone' => 'required|string',
            'is_verified' => 'boolean',
            'is_available' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Make sure user doesn't already have a counselor profile
        if ($user->counselor) {
            return response()->json([
                'message' => 'Counselor profile already exists.'
            ], 400);
        }

        $counselor = $user->counselor()->create($request->all());

        return response()->json([
            'message' => 'Counselor profile created successfully',
            'counselor' => $counselor
        ]);
    }

    public function updateCounselorProfile(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'counselor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'license_number' => 'sometimes|string|max:100',
            'specialization' => 'sometimes|string|max:255',
            'years_experience' => 'sometimes|integer|min:0',
            'education' => 'sometimes|string',
            'approach' => 'sometimes|string',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'available_days' => 'sometimes|array',
            'available_from' => 'sometimes|date_format:H:i',
            'available_to' => 'sometimes|date_format:H:i',
            'timezone' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $counselor = $user->counselor;
        $counselor->update($request->all());

        return response()->json([
            'message' => 'Counselor profile updated successfully',
            'counselor' => $counselor->fresh()
        ]);
    }

    public function getAvailability(Request $request, $counselorId)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $availability = CounselorAvailability::where('counselor_id', $counselorId)
            ->where('date', $request->date)
            ->where('is_available', true)
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'availability' => $availability
        ]);
    }

    public function setAvailability(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'counselor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'availabilities' => 'required|array',
            'availabilities.*.date' => 'required|date|after_or_equal:today',
            'availabilities.*.start_time' => 'required|date_format:H:i',
            'availabilities.*.end_time' => 'required|date_format:H:i|after:availabilities.*.start_time',
            'availabilities.*.is_available' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->availabilities as $availability) {
            CounselorAvailability::updateOrCreate(
                [
                    'counselor_id' => $user->id,
                    'date' => $availability['date'],
                    'start_time' => $availability['start_time'],
                ],
                [
                    'end_time' => $availability['end_time'],
                    'is_available' => $availability['is_available'] ?? true,
                ]
            );
        }

        return response()->json([
            'message' => 'Availability updated successfully'
        ]);
    }
}

