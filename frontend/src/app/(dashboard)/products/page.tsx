"use client";

import { useState } from "react";
import { useProducts, Product } from "@/hooks/use-products";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { WriteOffDialog } from "@/components/dashboard/write-off-dialog";
import { ReceiptDialog } from "@/components/dashboard/receipt-dialog";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { data, isLoading } = useProducts(search);

  const handleOpenDialog = (product: Product, type: 'write_off' | 'receipt') => {
    setSelectedProduct(product);
    if (type === 'write_off') setWriteOffOpen(true);
    if (type === 'receipt') setReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Товары и остатки</h1>
          <p className="text-text-secondary mt-1">Управление каталогом и контроль запасов</p>
        </div>
      </div>

      <Card className="p-4 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input 
            placeholder="Поиск по названию или SKU..." 
            className="pl-9 bg-surface-2 border-white/[0.06] text-text-primary focus-visible:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3">
          <Filter className="w-4 h-4" /> Категории
        </Button>
      </Card>

      <Card className="bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full bg-surface-2" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Наименование</TableHead>
                <TableHead>SKU / Артикул</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Остаток</TableHead>
                <TableHead className="text-right">Мин. запас</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[180px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((product) => {
                const isLowStock = product.total_stock <= product.minimum_stock;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-text-primary">{product.name}</TableCell>
                    <TableCell className="text-text-tertiary font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-surface-2 text-text-secondary border-white/[0.06]">
                        {product.category?.name || "Без категории"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-text-primary">
                      {product.total_stock} {product.unit?.code === 'pcs' ? 'шт' : product.unit?.code}
                    </TableCell>
                    <TableCell className="text-right text-text-tertiary tabular-nums">
                      {product.minimum_stock}
                    </TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10">
                          Низкий остаток
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                          В норме
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 px-2"
                          onClick={() => handleOpenDialog(product, 'receipt')}
                        >
                          <ArrowUpRight className="w-4 h-4" /> Приход
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1 px-2"
                          onClick={() => handleOpenDialog(product, 'write_off')}
                        >
                          <ArrowDownRight className="w-4 h-4" /> Списать
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <WriteOffDialog open={writeOffOpen} onOpenChange={setWriteOffOpen} product={selectedProduct} />
      <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} product={selectedProduct} />
    </div>
  );
}