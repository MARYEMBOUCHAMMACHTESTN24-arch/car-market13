<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);

        $admins = [
            [
                'email' => 'admin@admin.com',
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'role' => 'admin'
            ],
            [
                'email' => 'admin@test.com',
                'name' => 'Test Admin',
                'password' => Hash::make('123456'),
                'role' => 'admin'
            ],
            [
                'email' => 'manager@admin.com',
                'name' => 'System Manager',
                'password' => Hash::make('password'),
                'role' => 'manager'
            ],
        ];

        foreach ($admins as $data) {
            $user = User::updateOrCreate(['email' => $data['email']], $data);
            $user->assignRole($data['role'] === 'admin' ? $adminRole : $managerRole);
        }
    }
}
