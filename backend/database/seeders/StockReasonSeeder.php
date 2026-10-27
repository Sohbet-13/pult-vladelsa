<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockReason;

class StockReasonSeeder extends Seeder
{
    public function run(): void
    {
        $writeOffReasons = [
            ['name' => 'Порча', 'requires_comment' => true],
            ['name' => 'Истечение срока годности', 'requires_comment' => false],
            ['name' => 'Брак', 'requires_comment' => true],
            ['name' => 'Внутреннее использование', 'requires_comment' => false],
            ['name' => 'Ошибка учета', 'requires_comment' => true],
            ['name' => 'Другое', 'requires_comment' => true],
        ];

        $receiptReasons = [
            ['name' => 'Закупка у поставщика', 'requires_comment' => false],
            ['name' => 'Возврат от клиента', 'requires_comment' => true],
            ['name' => 'Инвентаризация (излишек)', 'requires_comment' => false],
            ['name' => 'Другое', 'requires_comment' => true],
        ];

        foreach ($writeOffReasons as $reason) {
            StockReason::firstOrCreate(
                ['organization_id' => 1, 'name' => $reason['name'], 'type' => 'write_off'],
                ['requires_comment' => $reason['requires_comment'], 'status' => 'active']
            );
        }

        foreach ($receiptReasons as $reason) {
            StockReason::firstOrCreate(
                ['organization_id' => 1, 'name' => $reason['name'], 'type' => 'receipt'],
                ['requires_comment' => $reason['requires_comment'], 'status' => 'active']
            );
        }
    }
}