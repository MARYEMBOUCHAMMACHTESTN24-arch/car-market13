<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // Return only requested fields
        $users = User::select(['id', 'name', 'email', 'role'])->get();
        return response()->json($users);
    }
}
