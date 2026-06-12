<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request)
    {
        $this->syncAdminMessageNotifications($request->user());

        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->get();
        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->update(['read' => true]);

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, string $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    private function syncAdminMessageNotifications(User $user): void
    {
        $adminMessages = ChatMessage::with('conversation.message')
            ->where('sender_role', 'admin')
            ->whereHas('conversation', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('guest_email', $user->email)
                    ->orWhereHas('message', function ($messageQuery) use ($user) {
                        $messageQuery->where('user_id', $user->id)
                            ->orWhere('email', $user->email);
                    });
            })
            ->latest()
            ->get();

        foreach ($adminMessages as $chatMessage) {
            $messageId = $chatMessage->conversation?->message?->id;
            $link = '/client-dashboard/contact?message=' . ($messageId ?: 'conversation-' . $chatMessage->conversation_id) . '&chat=' . $chatMessage->id;

            Notification::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'type'    => 'admin_message',
                    'link'    => $link,
                ],
                [
                    'title'   => 'New message from admin',
                    'message' => trim($chatMessage->body) !== '' ? $chatMessage->body : 'Admin sent you a message.',
                    'read'    => false,
                ]
            );
        }
    }
}
