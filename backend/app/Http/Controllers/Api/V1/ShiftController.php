<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::with(['openedBy', 'payments'])
            ->where('organization_id', 1)
            ->orderBy('opened_at', 'desc')
            ->paginate(10);

        return response()->json($shifts);
    }

    public function open(Request $request)
    {
        $orgId = 1;
        $userId = Auth::id() ?? 1;

        // Проверяем, нет ли уже открытой смены на этой точке
        $active = Shift::where('organization_id', $orgId)
            ->where('location_id', 1)
            ->where('status', 'open')
            ->first();

        if ($active) {
            return response()->json(['message' => 'На этой точке уже есть открытая смена'], 422);
        }

        $shift = Shift::create([
            'organization_id' => $orgId,
            'location_id' => 1,
            'opened_by' => $userId,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return response()->json(['message' => 'Смена открыта', 'shift' => $shift]);
    }

    public function close(Request $request, Shift $shift)
    {
        $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'actual_card' => 'required|numeric|min:0',
            'closing_note' => 'nullable|string|max:500',
        ]);

        if ($shift->status === 'closed') {
            return response()->json(['message' => 'Смена уже закрыта'], 422);
        }

        try {
            DB::beginTransaction();

            $userId = Auth::id() ?? 1;

            // В реальной системе "expected_amount" берется из интеграции с кассой.
            // Пока ставим моки для демонстрации: наличные 8500, карта 15000.
            $expectedCash = 8500.00;
            $expectedCard = 15000.00;

            $shift->update([
                'status' => 'closed',
                'closed_by' => $userId,
                'closed_at' => now(),
                'closing_note' => $request->closing_note,
            ]);

            // Создаем записи по способам оплаты
            ShiftPayment::create([
                'shift_id' => $shift->id,
                'payment_method' => 'cash',
                'expected_amount' => $expectedCash,
                'actual_amount' => $request->actual_cash,
                'difference_amount' => $request->actual_cash - $expectedCash,
            ]);

            ShiftPayment::create([
                'shift_id' => $shift->id,
                'payment_method' => 'card',
                'expected_amount' => $expectedCard,
                'actual_amount' => $request->actual_card,
                'difference_amount' => $request->actual_card - $expectedCard,
            ]);

            DB::commit();
            return response()->json(['message' => 'Смена закрыта']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Ошибка: ' . $e->getMessage()], 500);
        }
    }

    public function getActive()
    {
        $shift = Shift::where('organization_id', 1)
            ->where('location_id', 1)
            ->where('status', 'open')
            ->first();

        return response()->json(['active_shift' => $shift]);
    }
}