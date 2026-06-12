<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Route to serve local car images from the backend/car/ directory
Route::get('/car/{brand}/{model}/{image}', function ($brand, $model, $image) {
    $path = base_path("car/{$brand}/{$model}/{$image}");
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->where('image', '.*');

Route::get('/storage/{path}', function ($path) {
    $storagePath = storage_path('app/public/' . $path);
    $publicPath = public_path('storage/' . $path);

    if (file_exists($storagePath)) {
        return response()->file($storagePath);
    }

    if (file_exists($publicPath)) {
        return response()->file($publicPath);
    }

    abort(404);
})->where('path', '.*');
