<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
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
            'role' => 'client'
        ]);

        $user->assignRole('client');

        return response()->json([
            'message' => 'Account created successfully. Please log in.',
            'user' => $user,
        ], 201);
    }

    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        \Log::info('Login attempt received', [
            'email' => $request->email,
            'has_password' => !empty($request->password),
            'all_inputs' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            \Log::error('Login validation failed', ['errors' => $validator->errors()->toArray()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = trim($request->email);
        $password = trim($request->password);

        $user = User::where('email', $email)->first();

        if (!$user) {
            \Log::error('Login failed: User not found', ['email' => $email]);
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        \Log::info('User found, checking password', [
            'user_id' => $user->id,
            'password_length' => strlen($password)
        ]);

        if (!Hash::check($password, $user->password)) {
            \Log::error('Login failed: Invalid password', ['email' => $email, 'user_id' => $user->id]);
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        \Log::info('Login successful', ['email' => $request->email, 'user_id' => $user->id]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'role' => $user->getRoleNames()->first(),
            'permissions' => $user->getAllPermissions()->pluck('name')
        ]);
    }

    /**
     * Logout user (revoke token and destroy session)
     */
    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }
        
        // Destroy session for SPA auth
        \Illuminate\Support\Facades\Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Get the authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => $user,
            'role' => $user->getRoleNames()->first(),
            'permissions' => $user->getAllPermissions()->pluck('name')
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ]);

        $profileImage = $user->profile_image;

        if ($request->hasFile('profile_image')) {
            if ($profileImage && !preg_match('#^https?://#i', $profileImage)) {
                Storage::disk('public')->delete($profileImage);
                File::delete(public_path('storage/' . $profileImage));
            }

            $profileImage = $request->file('profile_image')->store('profiles', 'public');
            $this->mirrorPublicProfileImage($profileImage);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'profile_image' => $profileImage,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    private function mirrorPublicProfileImage(string $path): void
    {
        $source = storage_path('app/public/' . $path);
        $target = public_path('storage/' . $path);
        $targetDirectory = dirname($target);

        if (!File::isDirectory($targetDirectory)) {
            File::makeDirectory($targetDirectory, 0755, true);
        }

        if (File::exists($source)) {
            File::copy($source, $target);
        }
    }

    /**
     * Send password reset link via Laravel Password Broker + Gmail SMTP
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        Log::info('[ForgotPassword] Request received for: ' . $request->email);

        // Check if user exists — return same message either way for security
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            Log::warning('[ForgotPassword] Email not found in database: ' . $request->email);
            // Return success to prevent email enumeration attacks
            return response()->json([
                'message' => 'If that email address is in our system, we have sent a password reset link.'
            ]);
        }

        Log::info('[ForgotPassword] User found, calling Password::sendResetLink()');

        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            Log::info('[ForgotPassword] Password broker status: ' . $status);

            if ($status === Password::RESET_LINK_SENT) {
                Log::info('[ForgotPassword] Reset link sent successfully to: ' . $request->email);
                return response()->json([
                    'message' => 'Password reset link sent to your email. Please check your inbox.'
                ]);
            }

            // Token throttle or other broker error
            Log::warning('[ForgotPassword] Broker returned: ' . $status);
            return response()->json([
                'message' => __($status)
            ], 429);

        } catch (\Exception $e) {
            Log::error('[ForgotPassword] Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to send reset email. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Reset password using token from email link
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'    => 'required|string',
            'email'    => 'required|string|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        Log::info('[ResetPassword] Reset attempt for: ' . $request->email);

        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    // Revoke all existing tokens so old sessions are invalidated
                    $user->tokens()->delete();

                    event(new PasswordReset($user));
                    Log::info('[ResetPassword] Password updated successfully for user: ' . $user->email);
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => 'Password reset successfully. You can now log in with your new password.'
                ]);
            }

            Log::warning('[ResetPassword] Reset failed with status: ' . $status);
            return response()->json([
                'message' => __($status)
            ], 400);

        } catch (\Exception $e) {
            Log::error('[ResetPassword] Exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to reset password. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Test login using Auth::attempt()
     */
    public function testLogin(Request $request)
    {
        $credentials = $request->only('email', 'password');
        
        \Log::info('Testing Auth::attempt()', ['email' => $credentials['email']]);
        
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            \Log::info('Auth::attempt() successful', ['user_id' => $user->id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Login successful using Auth::attempt()',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ]
            ]);
        }
        
        \Log::error('Auth::attempt() failed', ['email' => $credentials['email']]);
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials using Auth::attempt()'
        ], 401);
    }
}


