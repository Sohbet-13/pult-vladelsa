<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Сводный отчёт за период.
     *
     * Query-параметры:
     *  - date_from: YYYY-MM-DD (по умолчанию: 29 дней назад)
     *  - date_to:   YYYY-MM-DD (по умолчанию: сегодня)
     */
    public function summary(Request $request)
    {
        $orgId = 1;

        $dateTo = $request->filled('date_to')
            ? Carbon::parse($request->input('date_to'))->endOfDay()
            : now()->endOfDay();

        $dateFrom = $request->filled('date_from')
            ? Carbon::parse($request->input('date_from'))->startOfDay()
            : (clone $dateTo)->subDays(29)->startOfDay();

        if ($dateFrom->gt($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo->copy()->startOfDay(), $dateFrom->copy()->endOfDay()];
        }

        // ------------------------------------------------------------------
        // 1) KPI
        // ------------------------------------------------------------------

        // Выручка — фактические суммы оплат из закрытых смен в периоде
        $revenue = (float) DB::table('shift_payments')
            ->join('shifts', 'shifts.id', '=', 'shift_payments.shift_id')
            ->where('shifts.organization_id', $orgId)
            ->whereNotNull('shifts.closed_at')
            ->whereBetween('shifts.closed_at', [$dateFrom, $dateTo])
            ->sum(DB::raw('COALESCE(shift_payments.actual_amount, 0)'));

        // Расходы — себестоимость списаний (unit_cost пока часто NULL → 0)
        $expenses = (float) DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'write_off')
            ->whereNotNull('stock_document_items.unit_cost')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->sum(DB::raw('stock_document_items.quantity * stock_document_items.unit_cost'));

        // Списания — количество документов и суммарное количество товаров
        $writeOffsQuery = StockDocument::where('organization_id', $orgId)
            ->where('type', 'write_off')
            ->whereBetween('occurred_at', [$dateFrom, $dateTo]);

        $writeOffsCount = (clone $writeOffsQuery)->count();

        $writeOffsQuantity = (float) DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'write_off')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->sum('stock_document_items.quantity');

        // Приходы
        $receiptsCount = StockDocument::where('organization_id', $orgId)
            ->where('type', 'receipt')
            ->whereBetween('occurred_at', [$dateFrom, $dateTo])
            ->count();

        $receiptsQuantity = (float) DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'receipt')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->sum('stock_document_items.quantity');

        // Смены
        $shiftsClosed = (int) DB::table('shifts')
            ->where('organization_id', $orgId)
            ->where('status', 'closed')
            ->whereBetween('closed_at', [$dateFrom, $dateTo])
            ->count();

        $shiftsOpen = (int) DB::table('shifts')
            ->where('organization_id', $orgId)
            ->where('status', 'open')
            ->whereBetween('opened_at', [$dateFrom, $dateTo])
            ->count();

        // ------------------------------------------------------------------
        // 2) График по дням
        // ------------------------------------------------------------------

        // Выручка по дням (по дате closed_at)
        $revenueByDay = DB::table('shift_payments')
            ->join('shifts', 'shifts.id', '=', 'shift_payments.shift_id')
            ->where('shifts.organization_id', $orgId)
            ->whereNotNull('shifts.closed_at')
            ->whereBetween('shifts.closed_at', [$dateFrom, $dateTo])
            ->selectRaw('DATE(shifts.closed_at) as d, SUM(COALESCE(shift_payments.actual_amount, 0)) as total')
            ->groupBy('d')
            ->get()
            ->keyBy('d');

        // Списания по дням
        $writeOffsByDay = DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'write_off')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('DATE(stock_documents.occurred_at) as d, SUM(stock_document_items.quantity) as qty')
            ->groupBy('d')
            ->get()
            ->keyBy('d');

        // Приходы по дням
        $receiptsByDay = DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'receipt')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('DATE(stock_documents.occurred_at) as d, SUM(stock_document_items.quantity) as qty')
            ->groupBy('d')
            ->get()
            ->keyBy('d');

        // Заполняем нулями пустые дни
        $chart = [];
        $cursor = $dateFrom->copy();
        while ($cursor->lte($dateTo)) {
            $key = $cursor->toDateString();
            $chart[] = [
                'date'       => $key,
                'revenue'    => (float) ($revenueByDay[$key]->total ?? 0),
                'write_offs' => (float) ($writeOffsByDay[$key]->qty ?? 0),
                'receipts'   => (float) ($receiptsByDay[$key]->qty ?? 0),
            ];
            $cursor->addDay();
        }

        // ------------------------------------------------------------------
        // 3) Топ-5 товаров по списаниям
        // ------------------------------------------------------------------
        $topProducts = DB::table('stock_document_items')
            ->join('stock_documents', 'stock_documents.id', '=', 'stock_document_items.document_id')
            ->join('products', 'products.id', '=', 'stock_document_items.product_id')
            ->leftJoin('units', 'units.id', '=', 'products.unit_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'write_off')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('
                products.id as product_id,
                products.name as product_name,
                products.sku as sku,
                units.code as unit_code,
                units.decimal_places as unit_decimal_places,
                SUM(stock_document_items.quantity) as quantity,
                COUNT(stock_document_items.id) as operations
            ')
            ->groupBy('products.id', 'products.name', 'products.sku', 'units.code', 'units.decimal_places')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'product_id'          => (int) $row->product_id,
                'product_name'        => $row->product_name,
                'sku'                 => $row->sku,
                'unit_code'           => $row->unit_code,
                'unit_decimal_places' => $row->unit_decimal_places !== null ? (int) $row->unit_decimal_places : null,
                'quantity'            => (float) $row->quantity,
                'operations'          => (int) $row->operations,
            ])
            ->all();

        // ------------------------------------------------------------------
        // 4) Топ-5 причин списания
        // ------------------------------------------------------------------
        $topReasons = DB::table('stock_documents')
            ->join('stock_reasons', 'stock_reasons.id', '=', 'stock_documents.reason_id')
            ->where('stock_documents.organization_id', $orgId)
            ->where('stock_documents.type', 'write_off')
            ->whereBetween('stock_documents.occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('
                stock_reasons.id as reason_id,
                stock_reasons.name as reason_name,
                COUNT(*) as count
            ')
            ->groupBy('stock_reasons.id', 'stock_reasons.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'reason_id'   => (int) $row->reason_id,
                'reason_name' => $row->reason_name,
                'count'       => (int) $row->count,
            ])
            ->all();

        // ------------------------------------------------------------------
        // 5) Топ-5 сотрудников по количеству действий
        //    (документы: created_by; смены: opened_by)
        // ------------------------------------------------------------------
        $docsByUser = DB::table('stock_documents')
            ->where('organization_id', $orgId)
            ->whereBetween('occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('created_by as user_id, COUNT(*) as cnt')
            ->groupBy('created_by')
            ->pluck('cnt', 'user_id');

        $shiftsByUser = DB::table('shifts')
            ->where('organization_id', $orgId)
            ->whereBetween('opened_at', [$dateFrom, $dateTo])
            ->selectRaw('opened_by as user_id, COUNT(*) as cnt')
            ->groupBy('opened_by')
            ->pluck('cnt', 'user_id');

        $userTotals = [];
        foreach ($docsByUser as $uid => $cnt) {
            $userTotals[$uid] = ($userTotals[$uid] ?? 0) + (int) $cnt;
        }
        foreach ($shiftsByUser as $uid => $cnt) {
            $userTotals[$uid] = ($userTotals[$uid] ?? 0) + (int) $cnt;
        }
        arsort($userTotals);
        $topUserIds = array_slice(array_keys($userTotals), 0, 5, true);

        $users = DB::table('users')->whereIn('id', $topUserIds)->pluck('name', 'id');

        $topEmployees = [];
        foreach ($topUserIds as $uid) {
            $topEmployees[] = [
                'user_id' => (int) $uid,
                'name'    => $users[$uid] ?? '—',
                'count'   => (int) $userTotals[$uid],
            ];
        }

        // ------------------------------------------------------------------
        // 6) Разбивка по типам документов
        // ------------------------------------------------------------------
        $byType = DB::table('stock_documents')
            ->where('organization_id', $orgId)
            ->whereBetween('occurred_at', [$dateFrom, $dateTo])
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->map(fn ($row) => [
                'type'  => $row->type,
                'count' => (int) $row->count,
            ])
            ->all();

        // ------------------------------------------------------------------
        // Ответ
        // ------------------------------------------------------------------
        return response()->json([
            'period' => [
                'from' => $dateFrom->toDateString(),
                'to'   => $dateTo->toDateString(),
            ],
            'kpi' => [
                'revenue'            => $revenue,
                'expenses'           => $expenses,
                'write_offs_count'   => $writeOffsCount,
                'write_offs_quantity'=> $writeOffsQuantity,
                'receipts_count'     => $receiptsCount,
                'receipts_quantity'  => $receiptsQuantity,
                'shifts_closed'      => $shiftsClosed,
                'shifts_open'        => $shiftsOpen,
            ],
            'chart'         => $chart,
            'top_products'  => $topProducts,
            'top_reasons'   => $topReasons,
            'top_employees' => $topEmployees,
            'by_type'       => $byType,
        ]);
    }
}