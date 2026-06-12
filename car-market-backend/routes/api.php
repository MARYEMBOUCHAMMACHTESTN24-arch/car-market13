<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\BusinessIntelligenceController;
use App\Http\Controllers\Api\AiAdvisorController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\ContactController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/test-login', [AuthController::class, 'testLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Contact Form
Route::post('/contact', [ContactController::class, 'send']);

Route::post('/messages', [MessageController::class, 'store']);
Route::get('/offers', [OfferController::class, 'index']);

// Public car routes (for browsing)
Route::get('/cars', [CarController::class, 'index']);
// NOTE: /cars/featured MUST be before /cars/{id} to avoid the wildcard eating it
Route::get('/cars/featured', [CarController::class, 'featured']);
Route::get('/cars/premium', [CarController::class, 'premium']);
Route::get('/brands', [CarController::class, 'brands']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/cities', [CarController::class, 'cities']);

// Public AI advisor routes. Laravel owns the catalog/database; FastAPI owns ranking.
Route::prefix('ai')->group(function () {
    Route::get('/search', function () {
        return response()->json([
            'message' => 'The AI advisor is online. Please use the marketplace search form to ask for vehicle recommendations.',
            'expected_method' => 'POST',
            'example_payload' => [
                'query' => 'reliable Toyota daily cars',
                'limit' => 5,
            ],
        ]);
    });
    Route::post('/search', [AiAdvisorController::class, 'search']);
    Route::post('/similar-cars', [AiAdvisorController::class, 'similarCars']);
    Route::post('/compare', [AiAdvisorController::class, 'compare']);
});

// -----------------------------------------------------------------------
// Protected routes — all require a valid Sanctum Bearer token
// NOTE: Do NOT use 'role:xxx,web' Spatie middleware here!
//       That middleware uses auth('web')->user() (session guard) which
//       always returns null for Bearer-token Sanctum requests.
//       Use 'can:permission' instead — it works with Sanctum correctly.
// -----------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::match(['post', 'patch'], '/user', [AuthController::class, 'updateProfile']);
    Route::get('/my-messages', [MessageController::class, 'myMessages']);
    Route::get('/client/messages', [MessageController::class, 'clientMessages']);

    // Favorites routes
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites/{carId}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{carId}', [FavoriteController::class, 'destroy']);

    // Car routes (permission based) - SEPARATE permissions for each action
    Route::post('/cars', [CarController::class, 'store'])->middleware('can:manage_cars');
    Route::put('/cars/{id}/premium', [CarController::class, 'togglePremium'])->middleware('can:manage_cars');
    Route::put('/cars/{id}', [CarController::class, 'update'])->middleware('can:manage_cars');
    Route::delete('/cars/{id}', [CarController::class, 'destroy'])->middleware('can:manage_cars');
    Route::get('/cars/admin', [CarController::class, 'adminIndex'])->middleware('can:view_cars');

    // Offer routes
    Route::get('/offers/admin', [OfferController::class, 'adminIndex']);
    Route::post('/offers', [OfferController::class, 'store']);
    Route::put('/offers/{id}', [OfferController::class, 'update']);
    Route::delete('/offers/{id}', [OfferController::class, 'destroy']);

    // Admin-specific Offer routes as requested by user
    Route::get('/admin/offers', [OfferController::class, 'adminIndex'])->middleware('can:view_offers');
    Route::post('/admin/offers', [OfferController::class, 'store'])->middleware('can:manage_offers');
    Route::put('/admin/offers/{id}', [OfferController::class, 'update'])->middleware('can:manage_offers');
    Route::delete('/admin/offers/{id}', [OfferController::class, 'destroy'])->middleware('can:manage_offers');


    // Category routes
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('can:manage_categories');
    Route::put('/categories/{id}', [CategoryController::class, 'update'])->middleware('can:manage_categories');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('can:manage_categories');

    // Order routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update'])->middleware('can:manage_orders');
    Route::delete('/orders/{id}', [OrderController::class, 'destroy'])->middleware('can:manage_orders');

    // Invoice routes (Legacy)
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::post('/invoices', [InvoiceController::class, 'store'])->middleware('can:manage_orders');

    // Facture routes (New)
    Route::get('/factures', [FactureController::class, 'index']);
    Route::get('/factures/{id}', [FactureController::class, 'show']);
    Route::get('/factures/{id}/pdf', [FactureController::class, 'downloadPdf']);
    Route::post('/factures/generate/{orderId}', [FactureController::class, 'generate'])->middleware('can:manage_orders');
    Route::put('/factures/{id}/status', [FactureController::class, 'updateStatus'])->middleware('can:manage_orders');
    Route::put('/orders/{orderId}/appointment', [FactureController::class, 'scheduleAppointment'])->middleware('can:manage_orders');

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // AI Recommendation routes
    Route::post('/recommend', [AiAdvisorController::class, 'recommend']);
    Route::post('/ai/track', [AiAdvisorController::class, 'track']);
    
    // AI Analytics Admin Route
    Route::get('/ai/analytics', [\App\Http\Controllers\Api\AiAnalyticsController::class, 'getAnalytics'])->middleware('can:view_ai_analytics');

    // Analytics routes — accessible to any authenticated user; Gate::before gives admin full access
    Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('can:view_dashboard');
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'getDashboardData'])->middleware('can:view_dashboard');

    // Business Intelligence Route
    Route::get('/bi/dashboard', [BusinessIntelligenceController::class, 'index'])->middleware('can:view_bi_dashboard');

    // Users routes
    Route::get('/users', [UserController::class, 'index'])->middleware('can:view_users');

    // Message routes
    Route::get('/messages', [MessageController::class, 'index'])->middleware('can:view_messages');
    Route::get('/messages/{id}/conversation', [MessageController::class, 'getConversation'])->middleware('can:view_messages');
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead'])->middleware('can:view_messages');
    Route::post('/messages/{id}/reply', [MessageController::class, 'reply'])->middleware('can:manage_messages');
    Route::delete('/messages/{id}', [MessageController::class, 'destroy'])->middleware('can:manage_messages');

    // Settings routes
    Route::get('/settings', [SettingController::class, 'index'])->middleware('can:view_settings');
    Route::post('/settings', [SettingController::class, 'update'])->middleware('can:manage_settings');

    // Admin management routes — authorization handled inside controller
    // using $request->user()->hasRole('admin', 'web') with explicit web guard
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::put('/admins/{id}', [AdminController::class, 'update']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
    Route::get('/permissions', [AdminController::class, 'getPermissions']);
    Route::get('/roles', [AdminController::class, 'getRoles']);
});

Route::get('/cars/{id}', [CarController::class, 'show']);
