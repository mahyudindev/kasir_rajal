<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $users = User::with('admin')->get()->map(function ($user) {
            return [
                'id_user' => $user->id_user,
                'email' => $user->email,
                'role' => $user->role,
                'nama' => $user->admin->nama ?? $user->email,
                'jenis_kelamin' => $user->admin->jenis_kelamin ?? null,
                'alamat' => $user->admin->alamat ?? null,
                'nomor_telpon' => $user->admin->nomor_telpon ?? null,
                'id_admin' => $user->admin->id_admin ?? null,
            ];
        });

        return Inertia::render('pengguna/index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('pengguna/create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $messages = [
            'email.required' => 'Email harus diisi',
            'email.email' => 'Format email tidak valid',
            'email.max' => 'Email maksimal 255 karakter',
            'email.unique' => 'Email sudah digunakan',
            'password.required' => 'Password harus diisi',
            'password.min' => 'Password minimal 8 karakter',
            'role.required' => 'Role harus dipilih',
            'role.in' => 'Role harus kasir atau bendahara',
            'nama.required' => 'Nama harus diisi',
            'nama.max' => 'Nama maksimal 50 karakter',
            'jenis_kelamin.required' => 'Jenis kelamin harus dipilih',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P',
            'alamat.required' => 'Alamat harus diisi',
            'alamat.max' => 'Alamat maksimal 50 karakter',
            'nomor_telpon.required' => 'Nomor telepon harus diisi',
            'nomor_telpon.max' => 'Nomor telepon maksimal 13 karakter',
        ];
        
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:kasir,bendahara',
            'nama' => 'required|string|max:50',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'required|string|max:50',
            'nomor_telpon' => 'required|string|max:13',
        ], $messages);

        \DB::beginTransaction();

        try {
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);

            Admin::create([
                'id_user' => $user->id_user,
                'nama' => $request->nama,
                'jenis_kelamin' => $request->jenis_kelamin,
                'alamat' => $request->alamat,
                'nomor_telpon' => $request->nomor_telpon,
            ]);

            \DB::commit();

            return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil ditambahkan');
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menambahkan pengguna: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit($id_user)
    {
        $pengguna = User::findOrFail($id_user);
        $pengguna->load('admin');
        
        $user = [
            'id_user' => $pengguna->id_user,
            'email' => $pengguna->email,
            'role' => $pengguna->role,
            'nama' => $pengguna->admin->nama ?? '',
            'jenis_kelamin' => $pengguna->admin->jenis_kelamin ?? '',
            'alamat' => $pengguna->admin->alamat ?? '',
            'nomor_telpon' => $pengguna->admin->nomor_telpon ?? '',
        ];

        return Inertia::render('pengguna/edit', [
            'user' => $user
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id_user)
    {
        $pengguna = User::findOrFail($id_user);
        
        $rules = [
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($pengguna->id_user, 'id_user')],
            'role' => 'required|in:kasir,bendahara',
            'nama' => 'required|string|max:50',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'required|string|max:50',
            'nomor_telpon' => 'required|string|max:13',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'string|min:8';
        }

        $messages = [
            'email.required' => 'Email harus diisi',
            'email.email' => 'Format email tidak valid',
            'email.max' => 'Email maksimal 255 karakter',
            'email.unique' => 'Email sudah digunakan',
            'password.min' => 'Password minimal 8 karakter',
            'role.required' => 'Role harus dipilih',
            'role.in' => 'Role harus kasir atau bendahara',
            'nama.required' => 'Nama harus diisi',
            'nama.max' => 'Nama maksimal 50 karakter',
            'jenis_kelamin.required' => 'Jenis kelamin harus dipilih',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P',
            'alamat.required' => 'Alamat harus diisi',
            'alamat.max' => 'Alamat maksimal 50 karakter',
            'nomor_telpon.required' => 'Nomor telepon harus diisi',
            'nomor_telpon.max' => 'Nomor telepon maksimal 13 karakter',
        ];

        $validated = $request->validate($rules, $messages);

        \DB::beginTransaction();

        try {
            $userData = [
                'email' => $validated['email'],
                'role' => $validated['role'],
            ];
            
            if ($request->filled('password') && !empty($request->password)) {
                $userData['password'] = Hash::make($request->password);
            }
            
            \DB::table('users')->where('id_user', $id_user)->update($userData);
            
            $adminData = [
                'nama' => $validated['nama'],
                'jenis_kelamin' => $validated['jenis_kelamin'],
                'alamat' => $validated['alamat'],
                'nomor_telpon' => $validated['nomor_telpon'],
            ];
            
            $admin = Admin::where('id_user', $id_user)->first();
            
            if ($admin) {
                \DB::table('admin')
                    ->where('id_user', $id_user)
                    ->update($adminData);
            } else {
                $adminData['id_user'] = $id_user;
                \DB::table('admin')->insert($adminData);
            }

            \DB::commit();

            return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil diperbarui');
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat memperbarui pengguna: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id_user)
    {
        $pengguna = User::findOrFail($id_user);
        try {
            $pengguna->delete();
            return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menghapus pengguna: ' . $e->getMessage()]);
        }
    }
}
