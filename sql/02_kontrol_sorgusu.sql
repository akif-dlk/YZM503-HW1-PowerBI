-- YZM503 HW1 - AdventureWorksDW2019 kontrol sorgusu (kategori bazında internet satışları)
USE AdventureWorksDW2019;
GO
SELECT c.EnglishProductCategoryName AS Kategori,
       COUNT(*)                     AS SatirSayisi,
       SUM(f.SalesAmount)           AS ToplamSatis
FROM dbo.FactInternetSales f
JOIN dbo.DimProduct p            ON p.ProductKey = f.ProductKey
JOIN dbo.DimProductSubcategory s ON s.ProductSubcategoryKey = p.ProductSubcategoryKey
JOIN dbo.DimProductCategory c    ON c.ProductCategoryKey = s.ProductCategoryKey
GROUP BY c.EnglishProductCategoryName
ORDER BY ToplamSatis DESC;
-- Beklenen sonuç: Bikes 28.318.144,65 | Accessories 700.759,96 | Clothing 339.772,61
