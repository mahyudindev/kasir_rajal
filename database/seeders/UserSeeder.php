<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create bendahara account
        $bendahara = User::create([
            'email' => 'bendahara@example.com',
            'password' => Hash::make('123'),
            'role' => 'bendahara',
        ]);
        
        // Create admin record for bendahara
        Admin::create([
            'id_user' => $bendahara->id_user,
            'nama' => 'Bendahara Klinik',
            'jenis_kelamin' => 'L',
            'alamat' => 'Jl. Klinik No. 1',
            'nomor_telpon' => '081234567890',
        ]);

        // Create kasir account
        $kasir = User::create([
            'email' => 'kasir@example.com',
            'password' => Hash::make('123'),
            'role' => 'kasir',
        ]);
        
        // Create admin record for kasir
        Admin::create([
            'id_user' => $kasir->id_user,
            'nama' => 'Kasir Klinik',
            'jenis_kelamin' => 'P',
            'alamat' => 'Jl. Klinik No. 2',
            'nomor_telpon' => '089876543210',
        ]);
    }
}
