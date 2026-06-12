<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class MessageController extends Controller
{
    // -----------------------------------------------------------------------
    // GET /messages  — list all messages for admin inbox
    // -----------------------------------------------------------------------
    public function index()
    {
        $messages = Message::with(['user', 'conversation.latestMessage'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($msg) {
                // Attach conversation read status + last activity to root message
                $conv = $msg->conversation;
                $msg->is_read    = $conv ? $conv->is_read    : $msg->is_read;
                $msg->status     = $conv ? ($conv->is_read ? 'read' : ($msg->status === 'replied' ? 'replied' : 'pending')) : $msg->status;
                $msg->conv_id    = $conv?->id;
                $msg->last_message_at = $conv?->last_message_at ?? $msg->created_at;
                return $msg;
            });

        return response()->json($messages);
    }

    // -----------------------------------------------------------------------
    // POST /messages  — create new message (contact form) + seed conversation
    // -----------------------------------------------------------------------
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $userId = auth('sanctum')->id();
        if ($userId) {
            $validated['user_id'] = $userId;
        }

        // 1. Create root message
        $message = Message::create($validated);

        // 2. Create conversation for this message
        $conversation = Conversation::create([
            'message_id'      => $message->id,
            'user_id'         => $userId,
            'subject'         => $validated['subject'] ?? null,
            'guest_name'      => $userId ? null : $validated['name'],
            'guest_email'     => $userId ? null : $validated['email'],
            'is_read'         => false,
            'last_message_at' => now(),
        ]);

        // 3. Seed the first chat message from the contact form body
        $senderName = $userId ? (auth('sanctum')->user()->name ?? $validated['name']) : $validated['name'];
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $userId,
            'sender_name'     => $senderName,
            'sender_role'     => 'client',
            'body'            => $validated['message'],
        ]);

        // 4. Link message → conversation
        $message->update(['conversation_id' => $conversation->id]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data'    => $message->load('conversation.chatMessages'),
        ], 201);
    }

    // -----------------------------------------------------------------------
    // GET /messages/{id}/conversation  — return full chat thread
    // -----------------------------------------------------------------------
    public function getConversation(Request $request, $id)
    {
        $message = Message::with('user')->findOrFail($id);

        // Auto-create conversation if this is an old message with no conversation
        $conversation = $message->conversation;
        if (!$conversation) {
            $conversation = $this->seedConversationForLegacyMessage($message);
        }

        $conversation->load(['chatMessages', 'user', 'message']);

        return response()->json($conversation);
    }

    // -----------------------------------------------------------------------
    // POST /messages/{id}/reply  — admin sends a reply into the thread
    // -----------------------------------------------------------------------
    public function reply(Request $request, $id)
    {
        $request->validate([
            'reply' => 'nullable|string',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf,doc,docx|max:5120',
        ]);

        $message = Message::findOrFail($id);

        // Auto-create conversation for legacy messages
        $conversation = $message->conversation;
        if (!$conversation) {
            $conversation = $this->seedConversationForLegacyMessage($message);
        }

        $admin = $request->user();

        $filePath = null;
        $fileType = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('chat_attachments', 'public');
            $fileType = $file->getMimeType();
            $fileName = $file->getClientOriginalName();
        }

        // Append new admin chat message
        $chatMsg = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $admin->id,
            'sender_name'     => $admin->name ?? 'Admin',
            'sender_role'     => 'admin',
            'body'            => $request->reply ?? '',
            'file_path'       => $filePath,
            'file_type'       => $fileType,
            'file_name'       => $fileName,
        ]);

        $client = $this->resolveConversationClient($conversation, $message);
        if ($client) {
            Notification::firstOrCreate(
                [
                    'user_id' => $client->id,
                    'type'    => 'admin_message',
                    'link'    => '/client-dashboard/contact?message=' . $message->id . '&chat=' . $chatMsg->id,
                ],
                [
                    'title'   => 'New message from admin',
                    'message' => trim($chatMsg->body) !== '' ? $chatMsg->body : 'Admin sent you an attachment.',
                    'read'    => false,
                ]
            );
        }

        // Update conversation metadata
        $conversation->update([
            'is_read'         => true,
            'last_message_at' => now(),
        ]);

        // Keep legacy reply column updated for backward compatibility
        $message->update([
            'reply'   => $request->reply,
            'status'  => 'replied',
            'is_read' => true,
        ]);

        return response()->json([
            'message' => 'Reply sent successfully.',
            'data'    => $chatMsg,
        ]);
    }

    // -----------------------------------------------------------------------
    // PUT /messages/{id}/read  — mark conversation as read
    // -----------------------------------------------------------------------
    public function markAsRead($id)
    {
        $message = Message::findOrFail($id);
        $message->update(['is_read' => true]);

        if ($message->conversation) {
            $message->conversation->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Message marked as read.', 'data' => $message]);
    }

    // -----------------------------------------------------------------------
    // DELETE /messages/{id}
    // -----------------------------------------------------------------------
    public function destroy($id)
    {
        $message = Message::findOrFail($id);

        // Cascade: conversation + chat_messages deleted via DB cascade
        if ($message->conversation) {
            $message->conversation->delete();
        }

        $message->delete();

        return response()->json(['message' => 'Message deleted successfully.']);
    }

    // -----------------------------------------------------------------------
    // GET /my-messages  — client's own messages
    // -----------------------------------------------------------------------
    public function myMessages(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([], 401);
        }

        $messages = Message::with(['conversation.chatMessages'])
            ->where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    // -----------------------------------------------------------------------
    // GET /client/messages  — admin messages sent to the logged-in client
    // -----------------------------------------------------------------------
    public function clientMessages(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['messages' => [], 'unread_count' => 0], 401);
        }

        $belongsToClient = function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhere('guest_email', $user->email)
                ->orWhereHas('message', function ($messageQuery) use ($user) {
                    $messageQuery->where('user_id', $user->id)
                        ->orWhere('email', $user->email);
                });
        };

        $chatMessages = ChatMessage::with(['conversation.message', 'sender'])
            ->where('sender_role', 'admin')
            ->whereHas('conversation', $belongsToClient)
            ->latest()
            ->get()
            ->map(function (ChatMessage $chatMessage) {
                $conversation = $chatMessage->conversation;
                $rootMessage = $conversation?->message;

                return [
                    'id' => 'chat-' . $chatMessage->id,
                    'message_id' => $rootMessage?->id,
                    'conversation_id' => $conversation?->id,
                    'sender_id' => $chatMessage->sender_id,
                    'sender_name' => $chatMessage->sender_name ?: 'Admin',
                    'subject' => $conversation?->subject ?: $rootMessage?->subject,
                    'message' => $chatMessage->body,
                    'file_url' => $chatMessage->file_url,
                    'file_name' => $chatMessage->file_name,
                    'created_at' => $chatMessage->created_at,
                    'is_read' => false,
                    'source' => 'chat_messages',
                ];
            });

        $legacyReplies = Message::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('email', $user->email);
            })
            ->whereNotNull('reply')
            ->whereDoesntHave('conversation.chatMessages', function ($query) {
                $query->where('sender_role', 'admin');
            })
            ->latest('updated_at')
            ->get()
            ->map(function (Message $message) {
                return [
                    'id' => 'message-' . $message->id,
                    'message_id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => null,
                    'sender_name' => 'Admin',
                    'subject' => $message->subject,
                    'message' => $message->reply,
                    'file_url' => null,
                    'file_name' => null,
                    'created_at' => $message->updated_at ?? $message->created_at,
                    'is_read' => (bool) $message->is_read,
                    'source' => 'messages',
                ];
            });

        $messages = Collection::make($chatMessages)
            ->merge($legacyReplies)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'messages' => $messages,
            'unread_count' => $messages->where('is_read', false)->count(),
        ]);
    }

    // -----------------------------------------------------------------------
    // Helper: build conversation + first chat message for legacy messages
    // -----------------------------------------------------------------------
    private function seedConversationForLegacyMessage(Message $message): Conversation
    {
        $conversation = Conversation::create([
            'message_id'      => $message->id,
            'user_id'         => $message->user_id,
            'subject'         => $message->subject,
            'guest_name'      => $message->user_id ? null : $message->name,
            'guest_email'     => $message->user_id ? null : $message->email,
            'is_read'         => $message->is_read,
            'last_message_at' => $message->updated_at ?? $message->created_at,
        ]);

        // Seed first message from the original contact body
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $message->user_id,
            'sender_name'     => $message->name,
            'sender_role'     => 'client',
            'body'            => $message->message,
        ]);

        // If there was an existing reply, seed it too
        if ($message->reply) {
            $admin = User::where('role', 'admin')->first();
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $admin?->id,
                'sender_name'     => $admin?->name ?? 'Admin',
                'sender_role'     => 'admin',
                'body'            => $message->reply,
            ]);
        }

        // Link message → conversation
        $message->update(['conversation_id' => $conversation->id]);

        return $conversation->load('chatMessages');
    }

    private function resolveConversationClient(Conversation $conversation, Message $message): ?User
    {
        if ($conversation->user_id) {
            return User::find($conversation->user_id);
        }

        if ($message->user_id) {
            return User::find($message->user_id);
        }

        $email = $conversation->guest_email ?: $message->email;

        return $email ? User::where('email', $email)->first() : null;
    }
}
