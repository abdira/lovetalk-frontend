<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\SessionController;
use App\Http\Controllers\API\FeedbackController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\CounselorController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\ChatController;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Protect everything else
Route::middleware('auth:sanctum')->group(function () {
    // Authenticated user info
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // User profile
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'update']);

    // Sessions (bookings)
    Route::apiResource('sessions', SessionController::class);
    Route::get('/sessions/upcoming', [SessionController::class, 'getUpcoming']);

    // Payments
    Route::apiResource('payments', PaymentController::class);
    Route::get('/payments/history', [PaymentController::class, 'history']);

    // Feedback
    Route::apiResource('feedback', FeedbackController::class);

    // Counselors (browse, info)
    Route::apiResource('counsellors', CounselorController::class);

    // Admin-specific actions
    Route::apiResource('admins', AdminController::class);

    // Chat routes (optional)
    Route::get('/chat/{sessionId}/messages', [ChatController::class, 'index']);
    Route::post('/chat/{sessionId}/messages', [ChatController::class, 'store']);
});

