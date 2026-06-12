<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    private function isRootAdmin(Request $request): bool
    {
        $user = $request->user();
        return $user && $user->hasRole('admin');
    }

    private function hasPermission(Request $request, string $permission): bool
    {
        $user = $request->user();
        if (!$user) return false;
        
        return $user->hasRole('admin') || $user->can($permission);
    }

    public function index(Request $request)
    {
        if (!$this->hasPermission($request, 'admins.view')) {
            return response()->json(['message' => 'Unauthorized. Missing admins.view permission.'], 403);
        }

        // Fetch users who have either 'admin' or 'manager' role
        $admins = User::role(['admin', 'manager'], 'web')
            ->with(['roles', 'permissions'])
            ->get();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        if (!$this->hasPermission($request, 'admins.create')) {
            return response()->json(['message' => 'Unauthorized. Missing admins.create permission.'], 403);
        }

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role'     => ['required', Rule::in(['admin', 'manager'])],
        ]);

        $admin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        $admin->assignRole($request->role);

        if ($request->role === 'manager' && $request->has('permissions')) {
            // Only Root Admin can assign permissions
            if ($this->isRootAdmin($request)) {
                $admin->syncPermissions($request->permissions);
            }
        }

        return response()->json($admin->load(['roles', 'permissions']), 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->hasPermission($request, 'admins.edit')) {
            return response()->json(['message' => 'Unauthorized. Missing admins.edit permission.'], 403);
        }

        $admin = User::findOrFail($id);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($admin->id)],
            'password' => 'nullable|string|min:8',
            'role'     => ['required', Rule::in(['admin', 'manager'])],
        ]);

        $admin->name  = $request->name;
        $admin->email = $request->email;
        $admin->role  = $request->role;

        if ($request->password) {
            $admin->password = Hash::make($request->password);
        }

        $admin->save();
        $admin->syncRoles([$request->role]);

        if ($request->role === 'manager' && $request->has('permissions')) {
            // Only Root Admin can assign permissions
            if ($this->isRootAdmin($request)) {
                $admin->syncPermissions($request->permissions);
            }
        } elseif ($request->role === 'admin') {
            // Admin gets all permissions via role — clear direct ones
            // Only Root Admin can promote to admin and clear direct perms safely
            if ($this->isRootAdmin($request)) {
                $admin->syncPermissions([]);
            }
        }

        return response()->json($admin->load(['roles', 'permissions']));
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->hasPermission($request, 'admins.delete')) {
            return response()->json(['message' => 'Unauthorized. Missing admins.delete permission.'], 403);
        }

        $admin = User::findOrFail($id);

        if (auth()->id() == $admin->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $admin->delete();
        return response()->json(['message' => 'Admin deleted successfully']);
    }

    public function getPermissions(Request $request)
    {
        if (!$this->hasPermission($request, 'admins.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(Permission::orderBy('name')->get());
    }

    public function getRoles(Request $request)
    {
        if (!$this->hasPermission($request, 'admins.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(Role::with('permissions')
            ->whereIn('name', ['admin', 'manager'])
            ->get());
    }
}
