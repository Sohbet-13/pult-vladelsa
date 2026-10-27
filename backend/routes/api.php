<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\StockDocumentController;
use App\Http\Controllers\Api\V1\ShiftController;
use App\Http\Controllers\Api\V1\OperationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SettingsController;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);

    Route::get('/stock/reasons', [StockDocumentController::class, 'getReasons']);
    Route::post('/stock/write-off', [StockDocumentController::class, 'writeOff']);
    Route::post('/stock/receipt', [StockDocumentController::class, 'receipt']);

    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::get('/shifts/active', [ShiftController::class, 'getActive']);
    Route::post('/shifts/open', [ShiftController::class, 'open']);
    Route::post('/shifts/{shift}/close', [ShiftController::class, 'close']);

    Route::get('/operations', [OperationController::class, 'index']);
    Route::get('/reports/summary', [ReportController::class, 'summary']);

    // Управление
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);

        Route::put('/organization', [SettingsController::class, 'updateOrganization']);

        Route::post('/locations', [SettingsController::class, 'storeLocation']);
        Route::put('/locations/{location}', [SettingsController::class, 'updateLocation']);
        Route::delete('/locations/{location}', [SettingsController::class, 'destroyLocation']);

        Route::post('/members', [SettingsController::class, 'storeMember']);
        Route::put('/members/{user}', [SettingsController::class, 'updateMember']);
        Route::delete('/members/{user}', [SettingsController::class, 'destroyMember']);

        Route::post('/categories', [SettingsController::class, 'storeCategory']);
        Route::put('/categories/{category}', [SettingsController::class, 'updateCategory']);

        Route::post('/reasons', [SettingsController::class, 'storeReason']);
        Route::put('/reasons/{reason}', [SettingsController::class, 'updateReason']);
    });
});