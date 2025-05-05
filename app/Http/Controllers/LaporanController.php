<?php

namespace App\Http\Controllers;

use App\Models\transaksi;
use App\Models\transaksi_detail;
use App\Models\layanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function harian(Request $request)
    {
        return Inertia::render('laporan/harian');
    }

    public function mingguan(Request $request)
    {
        return Inertia::render('laporan/mingguan');
    }

    public function bulanan(Request $request)
    {
        return Inertia::render('laporan/bulanan');
    }

    public function apiHarian(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->date;

        $transactions = transaksi::whereDate('created_at', $date)->get();
        $transactionIds = $transactions->pluck('id_transaksi')->toArray();

        if (empty($transactionIds)) {
            $layananStats = DB::table('layanan')
                ->select(
                    'layanan.id_layanan',
                    'layanan.nama_layanan',
                    DB::raw('0 as jumlah_transaksi'),
                    'layanan.total_harga as harga',
                    DB::raw('0 as total')
                )
                ->orderBy('layanan.id_layanan', 'asc')
                ->get();
                
            return response()->json([
                'layananStats' => $layananStats,
                'totalTransactions' => 0,
                'totalAmount' => 0,
                'tanggal' => $date
            ]);
        }

        $layananStats = DB::table('layanan')
            ->select(
                'layanan.id_layanan',
                'layanan.nama_layanan',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi), 0) as jumlah_transaksi'),
                'layanan.total_harga as harga',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi) * layanan.total_harga, 0) as total')
            )
            ->leftJoin('transaksi_detail', 'layanan.id_layanan', '=', 'transaksi_detail.id_layanan')
            ->leftJoin('transaksi', function($join) use ($date, $transactionIds) {
                $join->on('transaksi_detail.id_transaksi', '=', 'transaksi.id_transaksi')
                     ->whereDate('transaksi.created_at', $date)
                     ->whereIn('transaksi.id_transaksi', $transactionIds);
            })
            ->groupBy('layanan.id_layanan', 'layanan.nama_layanan', 'layanan.total_harga')
            ->orderBy('layanan.id_layanan', 'asc')
            ->get();

        $totalTransactions = count($transactionIds);
        $totalAmount = $layananStats->sum('total');

        return response()->json([
            'layananStats' => $layananStats,
            'totalTransactions' => $totalTransactions,
            'totalAmount' => $totalAmount,
            'tanggal' => $date
        ]);
    }

    public function apiMingguan(Request $request)
    {
        $request->validate([
            'startDate' => 'required|date_format:Y-m-d',
            'endDate' => 'required|date_format:Y-m-d|after_or_equal:startDate',
        ]);

        $startDate = $request->startDate;
        $endDate = $request->endDate;

        $transactions = transaksi::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->get();
        $transactionIds = $transactions->pluck('id_transaksi')->toArray();

        if (empty($transactionIds)) {
            $layananStats = DB::table('layanan')
                ->select(
                    'layanan.id_layanan',
                    'layanan.nama_layanan',
                    DB::raw('0 as jumlah_transaksi'),
                    'layanan.total_harga as harga',
                    DB::raw('0 as total')
                )
                ->orderBy('layanan.id_layanan', 'asc')
                ->get();
                
            return response()->json([
                'layananStats' => $layananStats,
                'totalTransactions' => 0,
                'totalAmount' => 0,
                'startDate' => $startDate,
                'endDate' => $endDate
            ]);
        }

        $layananStats = DB::table('layanan')
            ->select(
                'layanan.id_layanan',
                'layanan.nama_layanan',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi), 0) as jumlah_transaksi'),
                'layanan.total_harga as harga',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi) * layanan.total_harga, 0) as total')
            )
            ->leftJoin('transaksi_detail', 'layanan.id_layanan', '=', 'transaksi_detail.id_layanan')
            ->leftJoin('transaksi', function($join) use ($startDate, $endDate, $transactionIds) {
                $join->on('transaksi_detail.id_transaksi', '=', 'transaksi.id_transaksi')
                     ->whereBetween(DB::raw('DATE(transaksi.created_at)'), [$startDate, $endDate])
                     ->whereIn('transaksi.id_transaksi', $transactionIds);
            })
            ->groupBy('layanan.id_layanan', 'layanan.nama_layanan', 'layanan.total_harga')
            ->orderBy('layanan.id_layanan', 'asc')
            ->get();

        $totalTransactions = count($transactionIds);
        $totalAmount = $layananStats->sum('total');

        return response()->json([
            'layananStats' => $layananStats,
            'totalTransactions' => $totalTransactions,
            'totalAmount' => $totalAmount,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]);
    }

    public function apiBulanan(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $month = $request->month;
        $year = $request->year;

        $transactions = transaksi::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->get();
        $transactionIds = $transactions->pluck('id_transaksi')->toArray();

        if (empty($transactionIds)) {
            $layananStats = DB::table('layanan')
                ->select(
                    'layanan.id_layanan',
                    'layanan.nama_layanan',
                    DB::raw('0 as jumlah_transaksi'),
                    'layanan.total_harga as harga',
                    DB::raw('0 as total')
                )
                ->orderBy('layanan.id_layanan', 'asc')
                ->get();
                
            return response()->json([
                'layananStats' => $layananStats,
                'totalTransactions' => 0,
                'totalAmount' => 0,
                'month' => $month,
                'year' => $year
            ]);
        }

        $layananStats = DB::table('layanan')
            ->select(
                'layanan.id_layanan',
                'layanan.nama_layanan',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi), 0) as jumlah_transaksi'),
                'layanan.total_harga as harga',
                DB::raw('COALESCE(COUNT(transaksi_detail.id_transaksi) * layanan.total_harga, 0) as total')
            )
            ->leftJoin('transaksi_detail', 'layanan.id_layanan', '=', 'transaksi_detail.id_layanan')
            ->leftJoin('transaksi', function($join) use ($year, $month, $transactionIds) {
                $join->on('transaksi_detail.id_transaksi', '=', 'transaksi.id_transaksi')
                     ->whereYear('transaksi.created_at', $year)
                     ->whereMonth('transaksi.created_at', $month)
                     ->whereIn('transaksi.id_transaksi', $transactionIds);
            })
            ->groupBy('layanan.id_layanan', 'layanan.nama_layanan', 'layanan.total_harga')
            ->orderBy('layanan.id_layanan', 'asc')
            ->get();

        $totalTransactions = count($transactionIds);
        $totalAmount = $layananStats->sum('total');

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        return response()->json([
            'layananStats' => $layananStats,
            'totalTransactions' => $totalTransactions,
            'totalAmount' => $totalAmount,
            'month' => $month,
            'year' => $year,
            'monthName' => $monthNames[$month]
        ]);
    }
}
