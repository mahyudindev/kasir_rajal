<?php

// This script fixes the relationship between transaksi_detail and layanan
// Run with: php fix_transaksi_details.php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\transaksi;
use App\Models\transaksi_detail;
use App\Models\layanan;
use Illuminate\Support\Facades\DB;

// Get all transactions
$transaksis = transaksi::all();
echo "Found " . $transaksis->count() . " transactions\n";

$fixedCount = 0;
$errorCount = 0;

// For each transaction
foreach ($transaksis as $t) {
    echo "Processing transaction ID: " . $t->id_transaksi . "\n";
    
    // Get all transaction details
    $details = transaksi_detail::where('id_transaksi', $t->id_transaksi)->get();
    echo "  Found " . $details->count() . " transaction details\n";
    
    // For each transaction detail
    foreach ($details as $detail) {
        // Check if layanan exists
        $layanan = layanan::find($detail->id_layanan);
        
        if ($layanan) {
            echo "  ✓ Found layanan " . $layanan->nama_layanan . " for transaction detail " . $detail->id_transaksi_detail . "\n";
            $fixedCount++;
        } else {
            echo "  ✗ Error: Layanan with ID " . $detail->id_layanan . " not found for transaction detail " . $detail->id_transaksi_detail . "\n";
            $errorCount++;
        }
    }
    echo "\n";
}

echo "Repair summary:\n";
echo "Total transactions: " . $transaksis->count() . "\n";
echo "Fixed relationships: " . $fixedCount . "\n";
echo "Errors: " . $errorCount . "\n";

// Now force Laravel to reload relationships properly
echo "\nRefreshing relationship cache...\n";

// Clear Laravel's cache
$exitCode = Artisan::call('cache:clear');
echo "Cache cleared: " . ($exitCode === 0 ? "success" : "failed") . "\n";
$exitCode = Artisan::call('config:clear');
echo "Config cleared: " . ($exitCode === 0 ? "success" : "failed") . "\n";

echo "\nDone!\n";
