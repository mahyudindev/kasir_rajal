<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class layanan extends Model
{
    //
    protected $table = 'layanan';
    protected $primaryKey = 'id_layanan';

    protected $fillable = [
        'id_layanan',
        'nama_layanan',
        'trf_kunjungan',
        'trf_tindakan',
        'trf_layanan',
        'total_harga',
    ];

    protected $casts = [
        'trf_kunjungan' => 'decimal:2',
        'trf_tindakan' => 'decimal:2',
        'trf_layanan' => 'decimal:2',
        'total_harga' => 'decimal:2',
    ];
}
