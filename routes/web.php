<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\LayananController;
use App\Http\Controllers\TransaksiController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // User management routes
    Route::resource('pengguna', UserController::class)->parameters([
        'pengguna' => 'id_user'
    ]);
    
    // Layanan management routes
    Route::resource('layanan', LayananController::class);
    
    // Transaksi routes
    Route::resource('transaksi', TransaksiController::class);
    Route::get('search-layanan', [TransaksiController::class, 'searchLayanan'])->name('transaksi.search-layanan');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
