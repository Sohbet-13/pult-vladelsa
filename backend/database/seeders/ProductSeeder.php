<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Organization;
use App\Models\Location;
use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\StockBalance;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $orgId = 1;

        // 1. Точка продаж (если ещё нет)
        $location = Location::firstOrCreate(
            ['organization_id' => $orgId, 'name' => 'Кафе «Вкусный день»'],
            ['address' => 'ул. Ленина, 12', 'status' => 'active']
        );

        // 2. Категории
        $catCoffee = ProductCategory::firstOrCreate(['organization_id' => $orgId, 'name' => 'Кофе']);
        $catBakery = ProductCategory::firstOrCreate(['organization_id' => $orgId, 'name' => 'Выпечка']);
        $catDairy  = ProductCategory::firstOrCreate(['organization_id' => $orgId, 'name' => 'Молочные продукты']);

        // 3. Товары
        $p1 = Product::firstOrCreate(['organization_id' => $orgId, 'sku' => 'COF-001'], [
            'name' => 'Кофе Американо', 'category_id' => $catCoffee->id, 'unit_id' => 1, 'minimum_stock' => 10,
        ]);
        $p2 = Product::firstOrCreate(['organization_id' => $orgId, 'sku' => 'COF-002'], [
            'name' => 'Капучино', 'category_id' => $catCoffee->id, 'unit_id' => 1, 'minimum_stock' => 10,
        ]);
        $p3 = Product::firstOrCreate(['organization_id' => $orgId, 'sku' => 'BAK-001'], [
            'name' => 'Круассан', 'category_id' => $catBakery->id, 'unit_id' => 1, 'minimum_stock' => 5,
        ]);
        $p4 = Product::firstOrCreate(['organization_id' => $orgId, 'sku' => 'MLK-001'], [
            'name' => 'Молоко 1.5%', 'category_id' => $catDairy->id, 'unit_id' => 3, 'minimum_stock' => 20,
        ]);
        $p5 = Product::firstOrCreate(['organization_id' => $orgId, 'sku' => 'MLK-002'], [
            'name' => 'Сыр творожный', 'category_id' => $catDairy->id, 'unit_id' => 2, 'minimum_stock' => 5,
        ]);

        // 4. Остатки на точке
        $balances = [
            [$p1->id, 50],
            [$p2->id, 12],
            [$p3->id, 2],  // Низкий остаток (мин. 5)
            [$p4->id, 15], // Низкий остаток (мин. 20)
            [$p5->id, 8],
        ];

        foreach ($balances as [$productId, $qty]) {
            StockBalance::updateOrCreate(
                [
                    'organization_id' => $orgId,
                    'location_id' => $location->id,
                    'product_id' => $productId,
                ],
                ['quantity' => $qty]
            );
        }

        $this->command->info('✅ Тестовые данные товаров и остатков успешно созданы!');
    }
}