<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockDocument;
use App\Models\StockDocumentItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockDocumentController extends Controller
{
    public function writeOff(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'location_id' => 'required|exists:locations,id',
            'quantity' => 'required|numeric|min:0.001',
            'reason_id' => 'required|exists:stock_reasons,id',
            'comment' => 'nullable|string|max:500',
        ]);

        $orgId = 1;
        $userId = Auth::id() ?? 1;

        try {
            DB::beginTransaction();

            $balance = DB::table('stock_balances')
                ->where('organization_id', $orgId)
                ->where('location_id', $request->location_id)
                ->where('product_id', $request->product_id)
                ->lockForUpdate()
                ->first();

            if (!$balance || $balance->quantity < $request->quantity) {
                $available = $balance ? $balance->quantity : 0;
                return response()->json([
                    'message' => "Недостаточно товара. В наличии: {$available}"
                ], 422);
            }

            $doc = StockDocument::create([
                'organization_id' => $orgId,
                'location_id' => $request->location_id,
                'type' => 'write_off',
                'status' => 'posted',
                'reason_id' => $request->reason_id,
                'created_by' => $userId,
                'occurred_at' => now(),
            ]);

            StockDocumentItem::create([
                'document_id' => $doc->id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
            ]);

            DB::table('stock_balances')
                ->where('organization_id', $orgId)
                ->where('location_id', $request->location_id)
                ->where('product_id', $request->product_id)
                ->update([
                    'quantity' => DB::raw('quantity - ' . (float) $request->quantity),
                    'updated_at' => now(),
                ]);

            DB::commit();

            return response()->json(['message' => 'Списание успешно проведено', 'document_id' => $doc->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Ошибка: ' . $e->getMessage()], 500);
        }
    }

    public function receipt(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'location_id' => 'required|exists:locations,id',
            'quantity' => 'required|numeric|min:0.001',
            'reason_id' => 'required|exists:stock_reasons,id',
            'comment' => 'nullable|string|max:500',
        ]);

        $orgId = 1;
        $userId = Auth::id() ?? 1;

        try {
            DB::beginTransaction();

            $doc = StockDocument::create([
                'organization_id' => $orgId,
                'location_id' => $request->location_id,
                'type' => 'receipt',
                'status' => 'posted',
                'reason_id' => $request->reason_id,
                'created_by' => $userId,
                'occurred_at' => now(),
            ]);

            StockDocumentItem::create([
                'document_id' => $doc->id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
            ]);

            // Обновляем или создаем остаток
            $updated = DB::table('stock_balances')
                ->where('organization_id', $orgId)
                ->where('location_id', $request->location_id)
                ->where('product_id', $request->product_id)
                ->update([
                    'quantity' => DB::raw('quantity + ' . (float) $request->quantity),
                    'updated_at' => now(),
                ]);

            if ($updated === 0) {
                DB::table('stock_balances')->insert([
                    'organization_id' => $orgId,
                    'location_id' => $request->location_id,
                    'product_id' => $request->product_id,
                    'quantity' => (float) $request->quantity,
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json(['message' => 'Приход успешно оформлен', 'document_id' => $doc->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Ошибка: ' . $e->getMessage()], 500);
        }
    }

    public function getReasons(Request $request)
    {
        $type = $request->query('type', 'write_off');
        $reasons = \App\Models\StockReason::where('organization_id', 1)
            ->where('type', $type)
            ->where('status', 'active')
            ->get();
        return response()->json($reasons);
    }
}