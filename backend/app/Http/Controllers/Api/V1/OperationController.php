<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StockDocument;
use App\Models\StockReason;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class OperationController extends Controller
{
    /**
     * История операций: объединяет stock_documents и shifts в единый список,
     * сортирует по дате (desc) и пагинирует через LengthAwarePaginator.
     *
     * Параметры запроса:
     *  - type:        all | write_off | receipt | transfer | inventory_adjustment | shift_open | shift_close
     *  - location_id: int
     *  - date_from:   YYYY-MM-DD
     *  - date_to:     YYYY-MM-DD
     *  - search:      строка (ищет по товару, сотруднику, локации, причине)
     *  - page:        int (>=1)
     *  - per_page:    int (5..100, по умолчанию 20)
     */
    public function index(Request $request)
    {
        $orgId    = 1;
        $perPage  = (int) $request->input('per_page', 20);
        $perPage  = max(5, min($perPage, 100));
        $page     = max(1, (int) $request->input('page', 1));
        $type     = $request->input('type', 'all');
        $locationId = $request->integer('location_id') ?: null;

        $dateFrom = $request->filled('date_from')
            ? Carbon::parse($request->input('date_from'))->startOfDay()
            : null;
        $dateTo = $request->filled('date_to')
            ? Carbon::parse($request->input('date_to'))->endOfDay()
            : null;

        $search = trim((string) $request->input('search', ''));

        $operations = collect();

        // ------------------------------------------------------------------
        // 1) Складские документы (write_off / receipt / transfer / inventory_adjustment)
        // ------------------------------------------------------------------
        $stockTypes = ['write_off', 'receipt', 'transfer', 'inventory_adjustment'];
        $shouldLoadDocs = $type === 'all' || in_array($type, $stockTypes, true);

        if ($shouldLoadDocs) {
            $docs = StockDocument::with(['items'])
                ->where('organization_id', $orgId)
                ->when($type !== 'all', fn ($q) => $q->where('type', $type))
                ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
                ->when($dateFrom, fn ($q) => $q->where('occurred_at', '>=', $dateFrom))
                ->when($dateTo,   fn ($q) => $q->where('occurred_at', '<=', $dateTo))
                ->orderByDesc('occurred_at')
                ->limit(500)
                ->get();

            $reasonIds   = $docs->pluck('reason_id')->filter()->unique()->values();
            $userIds     = $docs->pluck('created_by')->filter()->unique()->values();
            $locationIds = $docs->pluck('location_id')->filter()->unique()->values();
            $productIds  = $docs->flatMap(fn ($d) => $d->items->pluck('product_id'))->unique()->values();

            $reasons   = StockReason::whereIn('id', $reasonIds)->get()->keyBy('id');
            $users     = User::whereIn('id', $userIds)->get()->keyBy('id');
            $locations = Location::whereIn('id', $locationIds)->get()->keyBy('id');
            $products  = Product::whereIn('id', $productIds)->get()->keyBy('id');
            $units     = Unit::all()->keyBy('id');

            foreach ($docs as $doc) {
                $items = $doc->items->map(function ($item) use ($products, $units) {
                    $product = $products->get($item->product_id);
                    $unit    = $product ? $units->get($product->unit_id) : null;

                    return [
                        'product_id'   => $item->product_id,
                        'product_name' => $product?->name ?? '—',
                        'sku'          => $product?->sku,
                        'quantity'     => (float) $item->quantity,
                        'unit_cost'    => $item->unit_cost !== null ? (float) $item->unit_cost : null,
                        'unit'         => $unit ? [
                            'code'           => $unit->code,
                            'name'           => $unit->name,
                            'decimal_places' => (int) $unit->decimal_places,
                        ] : null,
                    ];
                })->all();

                $occurredAt = $doc->occurred_at
                    ? Carbon::parse($doc->occurred_at)->toIso8601String()
                    : null;

                $operations->push([
                    'id'           => 'doc-' . $doc->id,
                    'source'       => 'stock_document',
                    'document_id'  => $doc->id,
                    'type'         => $doc->type,
                    'status'       => $doc->status,
                    'occurred_at'  => $occurredAt,
                    'location'     => $locations->get($doc->location_id)?->only(['id', 'name']),
                    'user'         => $users->get($doc->created_by)?->only(['id', 'name']),
                    'reason'       => $reasons->get($doc->reason_id)?->only(['id', 'name']),
                    'items'        => $items,
                    'comment'      => null,
                    'closing_note' => null,
                ]);
            }
        }

        // ------------------------------------------------------------------
        // 2) Смены (shift_open / shift_close)
        // ------------------------------------------------------------------
        $shouldLoadShifts = $type === 'all' || in_array($type, ['shift_open', 'shift_close'], true);

        if ($shouldLoadShifts) {
            $shifts = Shift::with(['openedBy:id,name'])
                ->where('organization_id', $orgId)
                ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
                ->orderByDesc('opened_at')
                ->limit(200)
                ->get();

            $shiftLocationIds = $shifts->pluck('location_id')->filter()->unique()->values();
            $shiftLocations   = Location::whereIn('id', $shiftLocationIds)->get()->keyBy('id');

            foreach ($shifts as $shift) {
                $shiftType = $shift->status === 'open' ? 'shift_open' : 'shift_close';

                if ($type !== 'all' && $type !== $shiftType) {
                    continue;
                }

                $occurred = $shift->status === 'closed' && $shift->closed_at
                    ? $shift->closed_at
                    : $shift->opened_at;

                if ($dateFrom && $occurred && $occurred->lt($dateFrom)) {
                    continue;
                }
                if ($dateTo && $occurred && $occurred->gt($dateTo)) {
                    continue;
                }

                $operations->push([
                    'id'           => 'shift-' . $shift->id,
                    'source'       => 'shift',
                    'shift_id'     => $shift->id,
                    'type'         => $shiftType,
                    'status'       => $shift->status,
                    'occurred_at'  => $occurred ? Carbon::parse($occurred)->toIso8601String() : null,
                    'location'     => $shiftLocations->get($shift->location_id)?->only(['id', 'name']),
                    'user'         => $shift->openedBy
                        ? ['id' => $shift->openedBy->id, 'name' => $shift->openedBy->name]
                        : null,
                    'reason'       => null,
                    'items'        => [],
                    'comment'      => null,
                    'closing_note' => $shift->closing_note,
                ]);
            }
        }

        // ------------------------------------------------------------------
        // 3) Текстовый поиск (по сотруднику, локации, причине, товарам)
        // ------------------------------------------------------------------
        if ($search !== '') {
            $needle = mb_strtolower($search);

            $operations = $operations->filter(function (array $op) use ($needle) {
                $productNames = implode(' ', array_map(
                    fn ($i) => $i['product_name'] ?? '',
                    $op['items'] ?? []
                ));

                $haystack = mb_strtolower(implode(' ', array_filter([
                    $op['user']['name']     ?? '',
                    $op['location']['name'] ?? '',
                    $op['reason']['name']   ?? '',
                    $productNames,
                    $op['closing_note']     ?? '',
                ])));

                return str_contains($haystack, $needle);
            })->values();
        }

        // ------------------------------------------------------------------
        // 4) Сортировка по occurred_at desc
        // ------------------------------------------------------------------
        $sorted = $operations
            ->sortByDesc(fn (array $op) => $op['occurred_at'] ?? '')
            ->values();

        // ------------------------------------------------------------------
        // 5) Пагинация (LengthAwarePaginator поверх Collection)
        // ------------------------------------------------------------------
        $total  = $sorted->count();
        $sliced = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $sliced->all(),
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($paginator);
    }
}