<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\layanan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LayananController extends Controller
{
    /**
     * Display a listing of the services.
     */
    public function index()
    {
        $layanan = layanan::select([
            'id_layanan',
            'nama_layanan',
            'trf_kunjungan',
            'layanan_dokter',
            'layanan_tindakan',
            'total_harga'
        ])->get();

        return Inertia::render('layanan/index', [
            'layanan' => $layanan
        ]);
    }

    /**
     * Show the form for creating a new service.
     */
    public function create()
    {
        return Inertia::render('layanan/create');
    }

    /**
     * Store a newly created service in storage.
     */
    public function store(Request $request)
    {
        $messages = [
            'nama_layanan.required' => 'Nama layanan harus diisi',
            'nama_layanan.max' => 'Nama layanan maksimal 50 karakter',
            'trf_kunjungan.required' => 'Tarif kunjungan harus diisi',
            'trf_kunjungan.numeric' => 'Tarif kunjungan harus berupa angka',
            'layanan_dokter.required' => 'Layanan dokter harus diisi',
            'layanan_dokter.numeric' => 'Layanan dokter harus berupa angka',
            'layanan_tindakan.required' => 'Layanan tindakan harus diisi',
            'layanan_tindakan.numeric' => 'Layanan tindakan harus berupa angka',
        ];
        
        $validated = $request->validate([
            'nama_layanan' => 'required|string|max:50',
            'trf_kunjungan' => 'required|numeric',
            'layanan_dokter' => 'required|numeric',
            'layanan_tindakan' => 'required|numeric',
        ], $messages);

        // Calculate total price
        $total_harga = $validated['trf_kunjungan'] + $validated['layanan_dokter'] + $validated['layanan_tindakan'];

        try {
            layanan::create([
                'nama_layanan' => $validated['nama_layanan'],
                'trf_kunjungan' => (int)$validated['trf_kunjungan'],
                'layanan_dokter' => (int)$validated['layanan_dokter'],
                'layanan_tindakan' => (int)$validated['layanan_tindakan'],
                'total_harga' => (int)$total_harga,
            ]);

            return redirect()->route('layanan.index')->with('success', 'Layanan berhasil ditambahkan');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menambahkan layanan: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit($id_layanan)
    {
        $layanan = layanan::findOrFail($id_layanan);
        
        return Inertia::render('layanan/edit', [
            'layanan' => $layanan
        ]);
    }

    /**
     * Update the specified service in storage.
     */
    public function update(Request $request, $id_layanan)
    {
        $layanan = layanan::findOrFail($id_layanan);
        
        $messages = [
            'nama_layanan.required' => 'Nama layanan harus diisi',
            'nama_layanan.max' => 'Nama layanan maksimal 50 karakter',
            'trf_kunjungan.required' => 'Tarif kunjungan harus diisi',
            'trf_kunjungan.numeric' => 'Tarif kunjungan harus berupa angka',
            'layanan_dokter.required' => 'Layanan dokter harus diisi',
            'layanan_dokter.numeric' => 'Layanan dokter harus berupa angka',
            'layanan_tindakan.required' => 'Layanan tindakan harus diisi',
            'layanan_tindakan.numeric' => 'Layanan tindakan harus berupa angka',
        ];
        
        $validated = $request->validate([
            'nama_layanan' => 'required|string|max:50',
            'trf_kunjungan' => 'required|numeric',
            'layanan_dokter' => 'required|numeric',
            'layanan_tindakan' => 'required|numeric',
        ], $messages);

        // Calculate total price
        $total_harga = $validated['trf_kunjungan'] + $validated['layanan_dokter'] + $validated['layanan_tindakan'];

        try {
            \DB::table('layanan')->where('id_layanan', $id_layanan)->update([
                'nama_layanan' => $validated['nama_layanan'],
                'trf_kunjungan' => (int)$validated['trf_kunjungan'],
                'layanan_dokter' => (int)$validated['layanan_dokter'],
                'layanan_tindakan' => (int)$validated['layanan_tindakan'],
                'total_harga' => (int)$total_harga,
            ]);

            return redirect()->route('layanan.index')->with('success', 'Layanan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat memperbarui layanan: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified service from storage.
     */
    public function destroy($id_layanan)
    {
        $layanan = layanan::findOrFail($id_layanan);
        try {
            $layanan->delete();
            return redirect()->route('layanan.index')->with('success', 'Layanan berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menghapus layanan: ' . $e->getMessage()]);
        }
    }
}
