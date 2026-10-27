<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\ProductCategory;
use App\Models\StockReason;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SettingsController extends Controller
{
    private function orgId(): int
    {
        return 1;
    }

    private function currentUserRole(Request $request): string
    {
        $userId = $request->user()?->id;
        if (! $userId) {
            return 'employee';
        }
        $member = OrganizationMember::where('organization_id', $this->orgId())
            ->where('user_id', $userId)
            ->first();

        return $member?->role ?? 'employee';
    }

    private function canEdit(Request $request): bool
    {
        return in_array($this->currentUserRole($request), ['owner', 'manager'], true);
    }

    private function canEditOrg(Request $request): bool
    {
        return $this->currentUserRole($request) === 'owner';
    }

    public function index(Request $request)
    {
        $orgId = $this->orgId();

        $organization = Organization::find($orgId);

        $locations = Location::where('organization_id', $orgId)
            ->orderBy('id')
            ->get(['id', 'name', 'address', 'status']);

        $memberRows = OrganizationMember::where('organization_id', $orgId)->get();
        $userIds = $memberRows->pluck('user_id');
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $members = $memberRows->map(function ($m) use ($users) {
            $u = $users->get($m->user_id);

            return [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'name' => $u?->name ?? '—',
                'email' => $u?->email ?? '—',
                'role' => $m->role,
                'status' => $m->status,
            ];
        })->values();

        $categories = ProductCategory::where('organization_id', $orgId)
            ->orderBy('name')
            ->get(['id', 'name', 'status']);

        $reasons = StockReason::where('organization_id', $orgId)
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'type', 'name', 'requires_comment', 'status']);

        $units = Unit::orderBy('id')->get(['id', 'code', 'name', 'decimal_places']);

        $role = $this->currentUserRole($request);

        return response()->json([
            'organization' => $organization ? [
                'id' => $organization->id,
                'name' => $organization->name,
                'currency' => $organization->currency,
                'timezone' => $organization->timezone,
                'status' => $organization->status,
            ] : null,
            'locations' => $locations,
            'members' => $members,
            'categories' => $categories,
            'reasons' => $reasons,
            'units' => $units,
            'meta' => [
                'current_user_role' => $role,
                'can_edit' => in_array($role, ['owner', 'manager'], true),
                'can_edit_org' => $role === 'owner',
            ],
        ]);
    }

    public function updateOrganization(Request $request)
    {
        if (! $this->canEditOrg($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'currency' => 'required|string|size:3',
            'timezone' => 'required|string|max:64',
        ]);

        $organization = Organization::findOrFail($this->orgId());
        $organization->update($data);

        return response()->json(['message' => 'Организация обновлена']);
    }

    // ---------- LOCATIONS ----------

    public function storeLocation(Request $request)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        Location::create([
            'organization_id' => $this->orgId(),
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Точка добавлена'], 201);
    }

    public function updateLocation(Request $request, Location $location)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }
        if ((int) $location->organization_id !== $this->orgId()) {
            return response()->json(['message' => 'Не найдено'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'status' => 'required|in:active,closed',
        ]);

        if ($data['status'] === 'closed' && $location->status === 'active') {
            $activeCount = Location::where('organization_id', $this->orgId())
                ->where('status', 'active')->count();
            if ($activeCount <= 1) {
                return response()->json(['message' => 'Нельзя закрыть последнюю активную точку'], 422);
            }
        }

        $location->update($data);

        return response()->json(['message' => 'Точка обновлена']);
    }

    public function destroyLocation(Request $request, Location $location)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }
        if ((int) $location->organization_id !== $this->orgId()) {
            return response()->json(['message' => 'Не найдено'], 404);
        }
        if ($location->status === 'active') {
            $activeCount = Location::where('organization_id', $this->orgId())
                ->where('status', 'active')->count();
            if ($activeCount <= 1) {
                return response()->json(['message' => 'Нельзя закрыть последнюю активную точку'], 422);
            }
        }

        $location->update(['status' => 'closed']);

        return response()->json(['message' => 'Точка закрыта']);
    }

    // ---------- MEMBERS ----------

    public function storeMember(Request $request)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:owner,manager,employee',
        ]);

        // Только owner может создать ещё одного owner
        if ($data['role'] === 'owner' && ! $this->canEditOrg($request)) {
            return response()->json(['message' => 'Только владелец может назначить владельца'], 403);
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'status' => 'active',
            ]);

            OrganizationMember::create([
                'organization_id' => $this->orgId(),
                'user_id' => $user->id,
                'role' => $data['role'],
                'status' => 'active',
            ]);

            DB::commit();

            return response()->json(['message' => 'Сотрудник добавлен'], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['message' => 'Ошибка: '.$e->getMessage()], 500);
        }
    }

    public function updateMember(Request $request, User $user)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $member = OrganizationMember::where('organization_id', $this->orgId())
            ->where('user_id', $user->id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|in:owner,manager,employee',
            'status' => 'required|in:active,inactive',
        ]);

        // Ограничение: если меняем owner → не-owner или inactive
        if ($member->role === 'owner' && ($data['role'] !== 'owner' || $data['status'] !== 'active')) {
            $activeOwners = OrganizationMember::where('organization_id', $this->orgId())
                ->where('role', 'owner')->where('status', 'active')->count();

            if ($activeOwners <= 1) {
                return response()->json(['message' => 'В организации должен остаться хотя бы один владелец'], 422);
            }
        }

        // Назначить нового owner может только owner
        if ($data['role'] === 'owner' && $member->role !== 'owner' && ! $this->canEditOrg($request)) {
            return response()->json(['message' => 'Только владелец может назначить владельца'], 403);
        }

        try {
            DB::beginTransaction();
            $user->update(['name' => $data['name']]);
            $member->update(['role' => $data['role'], 'status' => $data['status']]);
            DB::commit();

            return response()->json(['message' => 'Сотрудник обновлён']);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['message' => 'Ошибка: '.$e->getMessage()], 500);
        }
    }

    public function destroyMember(Request $request, User $user)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $member = OrganizationMember::where('organization_id', $this->orgId())
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($member->role === 'owner') {
            $activeOwners = OrganizationMember::where('organization_id', $this->orgId())
                ->where('role', 'owner')->where('status', 'active')->count();

            if ($activeOwners <= 1) {
                return response()->json(['message' => 'Нельзя деактивировать единственного владельца'], 422);
            }
        }

        $member->update(['status' => 'inactive']);

        return response()->json(['message' => 'Сотрудник деактивирован']);
    }

    // ---------- CATEGORIES ----------

    public function storeCategory(Request $request)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $exists = ProductCategory::where('organization_id', $this->orgId())
            ->where('name', $data['name'])->exists();

        if ($exists) {
            return response()->json(['message' => 'Категория с таким названием уже есть'], 422);
        }

        ProductCategory::create([
            'organization_id' => $this->orgId(),
            'name' => $data['name'],
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Категория добавлена'], 201);
    }

    public function updateCategory(Request $request, ProductCategory $category)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }
        if ((int) $category->organization_id !== $this->orgId()) {
            return response()->json(['message' => 'Не найдено'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,archived',
        ]);

        $category->update($data);

        return response()->json(['message' => 'Категория обновлена']);
    }

    // ---------- REASONS ----------

    public function storeReason(Request $request)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }

        $data = $request->validate([
            'type' => 'required|in:write_off,receipt,adjustment',
            'name' => 'required|string|max:255',
            'requires_comment' => 'boolean',
        ]);

        StockReason::create([
            'organization_id' => $this->orgId(),
            'type' => $data['type'],
            'name' => $data['name'],
            'requires_comment' => (bool) ($data['requires_comment'] ?? false),
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Причина добавлена'], 201);
    }

    public function updateReason(Request $request, StockReason $reason)
    {
        if (! $this->canEdit($request)) {
            return response()->json(['message' => 'Недостаточно прав'], 403);
        }
        if ((int) $reason->organization_id !== $this->orgId()) {
            return response()->json(['message' => 'Не найдено'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'requires_comment' => 'boolean',
            'status' => 'required|in:active,archived',
        ]);

        $reason->update($data);

        return response()->json(['message' => 'Причина обновлена']);
    }
}