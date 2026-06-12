<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_users',
            'manage_users',
            'view_cars',
            'manage_cars',
            'view_orders',
            'manage_orders',
            'view_offers',
            'manage_offers',
            'view_categories',
            'manage_categories',
            'view_messages',
            'manage_messages',
            'view_settings',
            'manage_settings',
            'view_ai_analytics',
            'view_bi_dashboard',
            'view_revenue',
            'view_notifications',
            'admins.view',
            'admins.create',
            'admins.edit',
            'admins.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Create roles and assign permissions
        $adminRole = Role::findOrCreate('admin');
        $adminRole->syncPermissions(Permission::all());

        $managerRole = Role::findOrCreate('manager');
        $managerRole->syncPermissions([
            'view_dashboard',
            'view_cars',
            'view_orders',
            'view_users',
            'view_messages',
            'view_categories',
        ]);

        $clientRole = Role::findOrCreate('client');
        $clientRole->syncPermissions([]);

        // Create initial admin user if not exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );
        $admin->assignRole($adminRole);

        // Create initial manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@admin.com'],
            [
                'name' => 'System Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
            ]
        );
        $manager->assignRole($managerRole);

        // Assign 'client' role to existing users if they don't have a role
        $users = User::whereNotIn('email', ['admin@admin.com', 'manager@admin.com'])->get();
        foreach ($users as $user) {
            if ($user->role === 'super_admin' || $user->role === 'admin') {
                $user->assignRole($adminRole);
            } else {
                $user->assignRole($clientRole);
            }
        }
    }
}
