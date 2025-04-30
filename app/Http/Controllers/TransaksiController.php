<?php

namespace App\Http\Controllers;

use App\Models\transaksi;
use App\Models\transaksi_detail;
use App\Models\layanan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TransaksiController extends Controller
{
    /**
     * Display a listing of the transactions.
     */
    public function index()
    {
        // Load transaction data with a new approach to ensure layanan is included
        $transaksiCollection = transaksi::with('transaksiDetails.layanan')->latest()->get();
        
        // Map the collection to ensure layanan data is explicitly included
        $transaksi = $transaksiCollection->map(function($item) {
            // Get the transaction details with layanan loaded
            $details = $item->transaksiDetails->map(function($detail) {
                // Explicitly load the layanan for this detail
                $layanan = layanan::find($detail->id_layanan);
                
                // Create a detail array with explicit layanan data
                return [
                    'id_transaksi_detail' => $detail->id_transaksi_detail,
                    'id_transaksi' => $detail->id_transaksi,
                    'id_layanan' => $detail->id_layanan,
                    'created_at' => $detail->created_at,
                    'updated_at' => $detail->updated_at,
                    'layanan' => $layanan ? [
                        'id_layanan' => $layanan->id_layanan,
                        'nama_layanan' => $layanan->nama_layanan,
                        'trf_kunjungan' => $layanan->trf_kunjungan,
                        'layanan_dokter' => $layanan->layanan_dokter,
                        'layanan_tindakan' => $layanan->layanan_tindakan,
                        'total_harga' => $layanan->total_harga,
                        'created_at' => $layanan->created_at,
                        'updated_at' => $layanan->updated_at,
                    ] : null
                ];
            });
            
            // Create a transaction array with details array
            return [
                'id_transaksi' => $item->id_transaksi,
                'id_admin' => $item->id_admin,
                'nama_pasien' => $item->nama_pasien,
                'total_harga' => $item->total_harga,
                'total_bayar' => $item->total_bayar,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
                'transaksiDetails' => $details->toArray()
            ];
        });
        
        // Get all services
        $layanan = layanan::all();

        // Get popular services
        $popularLayanan = layanan::select('layanan.*')
            ->selectRaw('COUNT(transaksi_detail.id_layanan) as transaction_count')
            ->leftJoin('transaksi_detail', 'layanan.id_layanan', '=', 'transaksi_detail.id_layanan')
            ->groupBy('layanan.id_layanan', 'layanan.nama_layanan', 'layanan.trf_kunjungan', 
                     'layanan.layanan_dokter', 'layanan.layanan_tindakan', 'layanan.total_harga',
                     'layanan.created_at', 'layanan.updated_at')
            ->orderByDesc('transaction_count')
            ->limit(10)
            ->get();

        // If no popular services yet, just use all services as popular
        if ($popularLayanan->isEmpty() && $layanan->isNotEmpty()) {
            $popularLayanan = $layanan->map(function($item) {
                $item->transaction_count = 0;
                return $item;
            })->take(10);
        }

        return Inertia::render('transaksi/index', [
            'transaksi' => $transaksi,
            'layanan' => $layanan,
            'popularLayanan' => $popularLayanan
        ]);
    }

    /**
     * Store a newly created transaction in storage.
     */
    public function store(Request $request)
    {
        $messages = [
            'nama_pasien.required' => 'Nama pasien harus diisi',
            'nama_pasien.max' => 'Nama pasien maksimal 50 karakter',
            'layanan_ids.required' => 'Layanan harus dipilih',
            'total_bayar.required' => 'Nominal bayar harus diisi',
            'total_bayar.numeric' => 'Nominal bayar harus berupa angka',
        ];
        
        $validated = $request->validate([
            'nama_pasien' => 'required|string|max:50',
            'layanan_ids' => 'required|array',
            'layanan_ids.*' => 'exists:layanan,id_layanan',
            'total_harga' => 'required|numeric',
            'total_bayar' => 'required|numeric',
        ], $messages);

        DB::beginTransaction();
        try {
            // Create transaction
            $transaksi = new transaksi();
            $transaksi->nama_pasien = $request->nama_pasien;
            $transaksi->total_harga = $request->total_harga;
            $transaksi->total_bayar = $request->total_bayar;
            $transaksi->save();

            // Create transaction details
            foreach ($request->layanan_ids as $layanan_id) {
                $detail = new transaksi_detail();
                $detail->id_transaksi = $transaksi->id_transaksi;
                $detail->id_layanan = $layanan_id;
                $detail->save();
            }

            DB::commit();
            return redirect()->route('transaksi.index')->with('success', 'Transaksi berhasil disimpan');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('transaksi.index')->with('error', 'Transaksi gagal disimpan: ' . $e->getMessage());
        }
    }

    /**
     * Get layanan by ID or name for search functionality
     */
    public function searchLayanan(Request $request)
    {
        $search = $request->input('search');
        
        $layanan = layanan::where('nama_layanan', 'LIKE', "%{$search}%")
            ->orWhere('id_layanan', 'LIKE', "%{$search}%")
            ->select('id_layanan', 'nama_layanan', 'total_harga')
            ->get();
        
        return response()->json($layanan);
    }
}
