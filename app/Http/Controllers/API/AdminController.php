<?php
// Controller 8: AdminController
// app/Http/Controllers/API/AdminController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Session;
use App\Models\Payment;
use App\Models\Feedback;
use App\Models\Counsellor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // Middleware to ensure only admins can access these methods
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if ($request->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            return $next($request);
        });
    }

    // Dashboard Overview
    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'total_clients' => User::where('role', 'client')->count(),
            'total_counselors' => User::where('role', 'counselor')->count(),
            'pending_counselors' => Counsellor::where('approved', false)->count(),
            'total_sessions' => Session::count(),
            'completed_sessions' => Session::where('status', 'completed')->count(),
            'pending_sessions' => Session::where('status', 'scheduled')->count(),
            'total_payments' => Payment::where('status', 'completed')->sum('amount'),
            'pending_payments' => Payment::where('status', 'pending')->count(),
            'total_feedbacks' => Feedback::count(),
            'average_rating' => Feedback::avg('rating'),
        ];

        // Monthly revenue chart data
        $monthlyRevenue = Payment::where('status', 'completed')
            ->selectRaw('MONTH(created_at) as month, SUM(amount) as revenue')
            ->whereYear('created_at', date('Y'))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Recent activities
        $recentSessions = Session::with(['client', 'counselor'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => $stats,
            'monthly_revenue' => $monthlyRevenue,
            'recent_sessions' => $recentSessions,
        ]);
    }

    // User Management
    public function getUsers(Request $request)
    {
        $query = User::with(['counsellor']);

        // Filter by role if specified
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:client,counselor,admin',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'email_verified_at' => now(),
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'role' => 'sometimes|in:client,counselor,admin',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only([
            'name', 'email', 'role', 'phone', 'date_of_birth', 'gender', 'status'
        ]));

        return response()->json($user->load(['counsellor']));
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting admin users
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'Cannot delete admin users'
            ], 400);
        }

        // Check if user has active sessions
        $activeSessions = Session::where(function($query) use ($id) {
            $query->where('client_id', $id)->orWhere('counselor_id', $id);
        })->whereIn('status', ['scheduled', 'in_progress'])->count();

        if ($activeSessions > 0) {
            return response()->json([
                'message' => 'Cannot delete user with active sessions'
            ], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // Counselor Management
    public function getCounselors(Request $request)
    {
        $query = Counsellor::with(['user']);

        // Filter by approval status
        if ($request->has('approved')) {
            $query->where('approved', $request->approved === 'true');
        }

        $counselors = $query->orderBy('created_at', 'desc')->paginate(15);

        // Transform data to match frontend expectations
        $counselors->getCollection()->transform(function ($counselor) {
            return [
                'id' => $counselor->id,
                'name' => $counselor->user->name,
                'email' => $counselor->user->email,
                'specialties' => explode(',', $counselor->specialties),
                'experience_years' => $counselor->experience_years,
                'hourly_rate' => $counselor->hourly_rate,
                'approved' => $counselor->approved,
                'bio' => $counselor->bio,
                'qualifications' => $counselor->qualifications,
                'created_at' => $counselor->created_at,
            ];
        });

        return response()->json($counselors);
    }

    public function approveCounselor($id)
    {
        $counselor = Counsellor::findOrFail($id);
        $counselor->update(['approved' => true, 'approved_at' => now()]);

        // Send approval notification email here if needed

        return response()->json([
            'message' => 'Counselor approved successfully',
            'counselor' => $counselor->load(['user'])
        ]);
    }

    public function denyCounselor($id)
    {
        $counselor = Counsellor::findOrFail($id);
        $counselor->update(['approved' => false, 'approved_at' => null]);

        // Send denial notification email here if needed

        return response()->json([
            'message' => 'Counselor approval denied',
            'counselor' => $counselor->load(['user'])
        ]);
    }

    // Session Management
    public function getSessions(Request $request)
    {
        $query = Session::with(['client', 'counselor', 'payment', 'feedback']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('session_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('session_date', '<=', $request->end_date);
        }

        $sessions = $query->orderBy('session_date', 'desc')->paginate(15);

        // Transform data to match frontend expectations
        $sessions->getCollection()->transform(function ($session) {
            return [
                'id' => $session->id,
                'client_name' => $session->client->name,
                'counselor_name' => $session->counselor->name,
                'status' => $session->status,
                'date' => $session->session_date->format('Y-m-d H:i'),
                'duration' => $session->duration,
                'session_type' => $session->session_type,
                'payment_status' => $session->payment_status,
                'created_at' => $session->created_at,
            ];
        });

        return response()->json($sessions);
    }

    public function updateSessionStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:scheduled,in_progress,completed,cancelled,no_show',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $session = Session::findOrFail($id);
        $session->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'updated_by_admin' => true,
        ]);

        return response()->json([
            'message' => 'Session status updated successfully',
            'session' => $session->load(['client', 'counselor'])
        ]);
    }

    // Feedback Management
    public function getFeedbacks(Request $request)
    {
        $query = Feedback::with(['session.client', 'session.counselor']);

        // Filter by rating
        if ($request->has('min_rating')) {
            $query->where('rating', '>=', $request->min_rating);
        }

        $feedbacks = $query->orderBy('created_at', 'desc')->paginate(15);

        // Transform data to match frontend expectations
        $feedbacks->getCollection()->transform(function ($feedback) {
            return [
                'id' => $feedback->id,
                'user_name' => $feedback->session->client->name,
                'session_id' => $feedback->session_id,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'counselor_name' => $feedback->session->counselor->name,
                'created_at' => $feedback->created_at,
            ];
        });

        return response()->json($feedbacks);
    }

    public function deleteFeedback($id)
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->delete();

        return response()->json(['message' => 'Feedback deleted successfully']);
    }

    // Payment Management
    public function getPayments(Request $request)
    {
        $query = Payment::with(['session.client', 'session.counselor']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($payments);
    }

    public function refundPayment(Request $request, $id)
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

        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Can only refund completed payments'
            ], 400);
        }

        $refundAmount = $request->amount ?? $payment->amount;

        $payment->update([
            'status' => 'refunded',
            'refund_amount' => $refundAmount,
            'refund_reason' => $request->reason,
            'refunded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment refunded successfully',
            'payment' => $payment->load(['session.client'])
        ]);
    }

    // Reports and Analytics
    public function getReports(Request $request)
    {
        $period = $request->get('period', 'month'); // day, week, month, year

        $reports = [
            'user_registrations' => $this->getUserRegistrationStats($period),
            'session_statistics' => $this->getSessionStats($period),
            'revenue_stats' => $this->getRevenueStats($period),
            'counselor_performance' => $this->getCounselorPerformance(),
            'feedback_analysis' => $this->getFeedbackAnalysis(),
        ];

        return response()->json($reports);
    }

    private function getUserRegistrationStats($period)
    {
        $format = $this->getDateFormat($period);
        
        return User::selectRaw("DATE_FORMAT(created_at, '{$format}') as period, COUNT(*) as count")
            ->where('created_at', '>=', $this->getPeriodStart($period))
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    private function getSessionStats($period)
    {
        $format = $this->getDateFormat($period);
        
        return Session::selectRaw("DATE_FORMAT(session_date, '{$format}') as period, status, COUNT(*) as count")
            ->where('session_date', '>=', $this->getPeriodStart($period))
            ->groupBy('period', 'status')
            ->orderBy('period')
            ->get();
    }

    private function getRevenueStats($period)
    {
        $format = $this->getDateFormat($period);
        
        return Payment::selectRaw("DATE_FORMAT(created_at, '{$format}') as period, SUM(amount) as revenue")
            ->where('status', 'completed')
            ->where('created_at', '>=', $this->getPeriodStart($period))
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    private function getCounselorPerformance()
    {
        return DB::table('sessions')
            ->join('users', 'sessions.counselor_id', '=', 'users.id')
            ->select(
                'users.name as counselor_name',
                DB::raw('COUNT(sessions.id) as total_sessions'),
                DB::raw('COUNT(CASE WHEN sessions.status = "completed" THEN 1 END) as completed_sessions'),
                DB::raw('AVG(CASE WHEN feedbacks.rating IS NOT NULL THEN feedbacks.rating END) as avg_rating')
            )
            ->leftJoin('feedbacks', 'sessions.id', '=', 'feedbacks.session_id')
            ->where('users.role', 'counselor')
            ->groupBy('users.id', 'users.name')
            ->orderBy('completed_sessions', 'desc')
            ->limit(10)
            ->get();
    }

    private function getFeedbackAnalysis()
    {
        return [
            'rating_distribution' => Feedback::selectRaw('rating, COUNT(*) as count')
                ->groupBy('rating')
                ->orderBy('rating')
                ->get(),
            'average_rating' => Feedback::avg('rating'),
            'total_feedbacks' => Feedback::count(),
            'recent_low_ratings' => Feedback::with(['session.client', 'session.counselor'])
                ->where('rating', '<=', 2)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];
    }

    private function getDateFormat($period)
    {
        switch ($period) {
            case 'day':
                return '%Y-%m-%d';
            case 'week':
                return '%Y-%u';
            case 'month':
                return '%Y-%m';
            case 'year':
                return '%Y';
            default:
                return '%Y-%m';
        }
    }

    private function getPeriodStart($period)
    {
        switch ($period) {
            case 'day':
                return now()->subDays(30);
            case 'week':
                return now()->subWeeks(12);
            case 'month':
                return now()->subMonths(12);
            case 'year':
                return now()->subYears(5);
            default:
                return now()->subMonths(12);
        }
    }

    // System Settings (if needed)
    public function getSystemSettings()
    {
        // Return system-wide settings
        $settings = [
            'max_session_duration' => 120,
            'default_session_price' => 50,
            'commission_rate' => 0.15,
            'auto_approve_counselors' => false,
            'maintenance_mode' => false,
        ];

        return response()->json($settings);
    }

    public function updateSystemSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'max_session_duration' => 'sometimes|integer|min:30|max:300',
            'default_session_price' => 'sometimes|numeric|min:0',
            'commission_rate' => 'sometimes|numeric|min:0|max:1',
            'auto_approve_counselors' => 'sometimes|boolean',
            'maintenance_mode' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // In a real application, you might store these in a settings table
        // For now, we'll just return the updated settings
        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $request->all()
        ]);
    }
}
