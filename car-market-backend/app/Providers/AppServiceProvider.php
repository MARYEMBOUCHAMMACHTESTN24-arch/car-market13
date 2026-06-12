<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->role === 'admin' || $user->hasRole('admin', 'web') ? true : null;
        });

        // Override the password reset URL to point to the React SPA frontend dynamically
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            // Use the request origin so it works from any device (phone, tablet, etc.)
            $frontendUrl = request()->header('origin') ?: env('FRONTEND_URL', 'http://localhost:5173');

            // Use query-string format: /reset-password?token=...&email=...
            // This is the safest format — no path-encoding issues with the 64-char token
            return rtrim($frontendUrl, '/') . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
