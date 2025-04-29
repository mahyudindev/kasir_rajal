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
        $transaksi = transaksi::with(['transaksiDetails.layanan' => function($query) {
            $query->select('id_layanan', 'nama_layanan', 'total_harga');
        }])->select([
            'id_transaksi',
            'id_admin',
            'nama_pasien',
            'total_harga',
            'total_bayar',
            'created_at'
        ])->orderBy('created_at', 'desc')->get();

        $layanan = layanan::select([
            'id_layanan',
            'nama_layanan',
            'total_harga'
        ])->get();

        return Inertia::render('transaksi/index', [
            'transaksi' => $transaksi,
            'layanan' => $layanan
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
            $transaksi = transaksi::create([
                'id_admin' => auth()->user()->id ?? 1,
                'nama_pasien' => $validated['nama_pasien'],
                'total_harga' => $validated['total_harga'],
                'total_bayar' => $validated['total_bayar'],
            ]);

            // Create transaction details
            foreach ($validated['layanan_ids'] as $layanan_id) {
                transaksi_detail::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_layanan' => $layanan_id,
                ]);
            }

            DB::commit();
            return redirect()->route('transaksi.index')->with('success', 'Transaksi berhasil disimpan')->with('saved_transaction_id', $transaksi->id_transaksi);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menyimpan transaksi: ' . $e->getMessage()]);
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
