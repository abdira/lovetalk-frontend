<?php
// Controller 5: ChatController
// app/Http/Controllers/API/ChatController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Events\ChatMessageSent;

class ChatController extends Controller
{
    public function getMessages(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = Session::findOrFail($sessionId);

        // Check authorization
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = ChatMessage::with('sender')
            ->forSession($sessionId)
            ->paginate(50);

        // Mark messages as read for the current user
        ChatMessage::where('session_id', $sessionId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = Session::findOrFail($sessionId);

        // Check authorization
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required_without:file|string|max:1000',
            'type' => 'required|in:text,file,image,emoji',
            'file' => 'required_if:type,file,image|file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $messageData = [
            'session_id' => $sessionId,
            'sender_id' => $user->id,
            'message' => $request->message ?? '',
            'type' => $request->type,
        ];

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('chat_files', 'public');
            
            $messageData['file_path'] = $path;
            $messageData['file_name'] = $file->getClientOriginalName();
            $messageData['message'] = $messageData['message'] ?: $file->getClientOriginalName();
        }

	$message = ChatMessage::create($messageData);

	broadcast(new ChatMessageSent($message))->toOthers();

        // Broadcast message via Socket.IO (implement in your socket server)
        // broadcast($session->chat_room_id, 'new_message', $message->load('sender'));

        return response()->json([
            'message' => $message->load('sender')
        ], 201);
    }

    public function markAsRead(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = Session::findOrFail($sessionId);

        // Check authorization
        if (!in_array($user->id, [$session->client_id, $session->counselor_id])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        ChatMessage::where('session_id', $sessionId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Messages marked as read']);
    }

    public function getUnreadCount(Request $request)
    {
        $user = $request->user();

        $unreadCount = ChatMessage::whereHas('session', function($q) use ($user) {
            $q->where('client_id', $user->id)->orWhere('counselor_id', $user->id);
        })
        ->where('sender_id', '!=', $user->id)
        ->where('is_read', false)
        ->count();

        return response()->json(['unread_count' => $unreadCount]);
    }
}
