<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Unit;
use App\Models\StockBalance;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $organizationId = 1;

        $query = Product::where('organization_id', $organizationId)
            ->where('status', 'active');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->paginate(15);

        // Загружаем связанные данные вручную (безопаснее)
        $categoryIds = $products->pluck('category_id')->filter()->unique();
        $unitIds = $products->pluck('unit_id')->filter()->unique();

        $categories = ProductCategory::whereIn('id', $categoryIds)->get()->keyBy('id');
        $units = Unit::whereIn('id', $unitIds)->get()->keyBy('id');

        $products->getCollection()->transform(function ($product) use ($categories, $units, $organizationId) {
            $product->category = $categories->get($product->category_id);
            $product->unit = $units->get($product->unit_id);
            $product->total_stock = StockBalance::where('product_id', $product->id)->sum('quantity') ?? 0;
            return $product;
        });

        return response()->json($products);
    }
}