<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('chat_messages', 'conversation_id')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->foreignId('conversation_id')->after('id')->constrained('conversations')->cascadeOnDelete();
                $table->foreignId('sender_id')->nullable()->after('conversation_id')->constrained('users')->nullOnDelete();
                $table->string('sender_name')->after('sender_id');
                $table->enum('sender_role', ['client', 'admin'])->default('client')->after('sender_name');
                $table->text('body')->after('sender_role');
            });
        }
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['conversation_id']);
            $table->dropForeign(['sender_id']);
            $table->dropColumn(['conversation_id', 'sender_id', 'sender_name', 'sender_role', 'body']);
        });
    }
};
