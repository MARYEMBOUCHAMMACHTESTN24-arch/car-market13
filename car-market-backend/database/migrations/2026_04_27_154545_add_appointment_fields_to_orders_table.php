<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->date('appointment_date')->nullable()->after('status');
            $table->time('appointment_time')->nullable()->after('appointment_date');
            $table->string('appointment_location')->nullable()->after('appointment_time');
            $table->text('appointment_note')->nullable()->after('appointment_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['appointment_date', 'appointment_time', 'appointment_location', 'appointment_note']);
        });
    }
};
