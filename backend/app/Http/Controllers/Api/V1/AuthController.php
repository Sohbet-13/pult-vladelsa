<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OrganizationMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Пытаемся авторизоваться
        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль.'],
            ]);
        }

        // Если auth:attempt прошел успешно, текущий пользователь доступен так:
        $user = Auth::user();
        
        // Ищем организацию пользователя (без привязки к pivot-таблицам, чтобы не упасть)
        $member = OrganizationMember::where('user_id', $user->id)->first();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $member ? $member->role : 'employee',
                'organization_id' => $member ? $member->organization_id : null,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        if ($request->session()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Вы вышли из системы']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $member = OrganizationMember::where('user_id', $user->id)->first();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $member ? $member->role : 'employee',
            'organization_id' => $member ? $member->organization_id : null,
        ]);
    }
}