<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // User management routes
    Route::get('/pengguna', [UserController::class, 'index'])->name('pengguna.index');
    Route::get('/pengguna/create', [UserController::class, 'create'])->name('pengguna.create');
    Route::post('/pengguna', [UserController::class, 'store'])->name('pengguna.store');
    Route::get('/pengguna/{id_user}/edit', [UserController::class, 'edit'])->name('pengguna.edit');
    Route::put('/pengguna/{id_user}', [UserController::class, 'update'])->name('pengguna.update');
    Route::delete('/pengguna/{id_user}', [UserController::class, 'destroy'])->name('pengguna.destroy');
    Route::get('/pengguna/{id_user}', [UserController::class, 'show'])->name('pengguna.show');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
