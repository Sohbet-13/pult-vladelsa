<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // В реальности здесь будут запросы к БД (stock_balances, shifts, stock_documents)
        // Пока возвращаем реалистичные моки для отрисовки интерфейса
        
        return response()->json([
            'kpi' => [
                'revenue' => ['value' => 48230, 'change' => 12, 'previous' => 42980],
                'stock' => ['value' => 126, 'low_stock' => 5],
                'write_offs' => ['value' => 4320, 'change' => -8, 'previous' => 4700],
                'shifts' => ['closed' => 2, 'total' => 3, 'open' => 1],
            ],
            'revenue_chart' => [
                ['date' => '08.04', 'revenue' => 32000, 'expenses' => 18000],
                ['date' => '09.04', 'revenue' => 41000, 'expenses' => 22000],
                ['date' => '10.04', 'revenue' => 45000, 'expenses' => 21000],
                ['date' => '11.04', 'revenue' => 38000, 'expenses' => 19000],
                ['date' => '12.04', 'revenue' => 42000, 'expenses' => 24000],
                ['date' => '13.04', 'revenue' => 49000, 'expenses' => 21000],
                ['date' => '14.04', 'revenue' => 48230, 'expenses' => 22410],
            ],
            'expense_structure' => [
                ['name' => 'Продукты', 'value' => 42, 'amount' => 9412],
                ['name' => 'Фонд з/п', 'value' => 18, 'amount' => 4034],
                ['name' => 'Коммунальные', 'value' => 12, 'amount' => 2689],
                ['name' => 'Транспорт', 'value' => 8, 'amount' => 1793],
                ['name' => 'Прочее', 'value' => 20, 'amount' => 4482],
            ],
            'recent_operations' => [
                ['id' => 1, 'type' => 'write_off', 'date' => '14.04.2025 09:17', 'item' => 'Молоко 1.5% (2 шт.)', 'user' => 'Сергей М.'],
                ['id' => 2, 'type' => 'receipt', 'date' => '14.04.2025 08:52', 'item' => 'Овощи (поставка)', 'user' => 'Алексей К.'],
                ['id' => 3, 'type' => 'shift_close', 'date' => '14.04.2025 08:21', 'item' => 'Смена №427', 'user' => 'Игорь С.'],
                ['id' => 4, 'type' => 'write_off', 'date' => '14.04.2025 07:56', 'item' => 'Сыр творожный', 'user' => 'Мария П.'],
                ['id' => 5, 'type' => 'inventory', 'date' => '14.04.2025 06:45', 'item' => 'Все товары', 'user' => 'Дмитрий К.'],
            ],
            'alerts' => [
                ['id' => 1, 'type' => 'low_stock', 'title' => 'Низкий остаток', 'desc' => 'Молоко 1.5% — 2 шт. (Кафе)', 'time' => 'Сегодня, 09:12'],
                ['id' => 2, 'type' => 'shift_open', 'title' => 'Смена не закрыта', 'desc' => 'Кафе «Вкусный день» — Смена №428', 'time' => 'Начата 08:15'],
                ['id' => 3, 'type' => 'cash_diff', 'title' => 'Кассовое расхождение', 'desc' => 'Наличные: 8 500 ₽ / По учету: 9 200 ₽', 'time' => 'Сегодня, 07:50'],
            ],
        ]);
    }
}