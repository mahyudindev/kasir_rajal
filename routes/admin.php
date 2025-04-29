<?php

use App\Http\Controllers\Admin\LayananController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    // Layanan routes
    Route::resource('layanan', LayananController::class);
});
