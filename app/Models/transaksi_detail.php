<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class transaksi_detail extends Model
{
    protected $table = 'transaksi_detail';
    protected $primaryKey = 'id_transaksi_detail';

    protected $fillable = [
        'id_transaksi_detail',
        'id_transaksi',
        'id_layanan',
    ];

    protected $casts = [
        'id_transaksi' => 'integer',
        'id_layanan' => 'integer',
    ];
}
