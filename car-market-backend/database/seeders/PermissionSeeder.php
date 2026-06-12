<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Cars
            'view cars',
            'manage cars',
            'edit cars',
            'delete cars',
            // Orders
            'view orders',
            'manage orders',
            // Users / Clients
            'view clients',
            'manage clients',
            // Messages
            'view messages',
            'manage messages',
            // Analytics
            'view analytics',
            // Revenue
            'view revenue',
            // Users
            'view users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign ALL permissions to admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        // Assign default permissions to manager role
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $managerRole->syncPermissions([
            'view cars',
            'manage cars',
            'edit cars',
            'view orders',
            'manage orders',
            'view messages',
            'view clients',
        ]);

        // Ensure client role exists
        Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);

        $this->command->info('Permissions seeded successfully.');
    }
}
