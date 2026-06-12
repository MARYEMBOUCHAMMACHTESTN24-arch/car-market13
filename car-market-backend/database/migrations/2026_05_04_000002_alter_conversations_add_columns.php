<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('conversations', 'message_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->foreignId('message_id')->nullable()->after('id')->constrained('messages')->nullOnDelete();
                $table->foreignId('user_id')->nullable()->after('message_id')->constrained('users')->nullOnDelete();
                $table->string('subject')->nullable()->after('user_id');
                $table->string('guest_name')->nullable()->after('subject');
                $table->string('guest_email')->nullable()->after('guest_name');
                $table->boolean('is_read')->default(false)->after('guest_email');
                $table->timestamp('last_message_at')->nullable()->after('is_read');
            });
        }
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['message_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['message_id', 'user_id', 'subject', 'guest_name', 'guest_email', 'is_read', 'last_message_at']);
        });
    }
};
