import json, os, sys

OUT = sys.argv[1]
SERVER = sys.argv[2] if len(sys.argv) > 2 else r"localhost\SQLEXPRESS"
DB = "AdventureWorksDW2019"
NAME = "HW1_AdventureWorks"

TABLES = {
    "FactInternetSales": [
        ("SalesOrderNumber", "string"), ("ProductKey", "int64"), ("CustomerKey", "int64"),
        ("OrderDateKey", "int64"), ("SalesTerritoryKey", "int64"), ("OrderQuantity", "int64"),
        ("SalesAmount", "double"), ("TotalProductCost", "double"),
    ],
    "DimProduct": [("ProductKey", "int64"), ("ProductSubcategoryKey", "int64"),
                   ("EnglishProductName", "string"), ("Color", "string")],
    "DimProductSubcategory": [("ProductSubcategoryKey", "int64"), ("ProductCategoryKey", "int64"),
                              ("EnglishProductSubcategoryName", "string")],
    "DimProductCategory": [("ProductCategoryKey", "int64"), ("EnglishProductCategoryName", "string")],
    "DimCustomer": [("CustomerKey", "int64"), ("Gender", "string"), ("MaritalStatus", "string"),
                    ("EnglishEducation", "string"), ("YearlyIncome", "double")],
    "DimDate": [("DateKey", "int64"), ("CalendarYear", "int64"), ("MonthNumberOfYear", "int64"),
                ("EnglishMonthName", "string")],
    "DimSalesTerritory": [("SalesTerritoryKey", "int64"), ("SalesTerritoryRegion", "string"),
                          ("SalesTerritoryCountry", "string"), ("SalesTerritoryGroup", "string")],
}

MEASURES = {
    "FactInternetSales": [
        ("Toplam Satış", "SUM(FactInternetSales[SalesAmount])", "#,0"),
        ("Toplam Maliyet", "SUM(FactInternetSales[TotalProductCost])", "#,0"),
        ("Brüt Kâr", "[Toplam Satış] - [Toplam Maliyet]", "#,0"),
        ("Sipariş Sayısı", "DISTINCTCOUNT(FactInternetSales[SalesOrderNumber])", "#,0"),
        ("Satılan Adet", "SUM(FactInternetSales[OrderQuantity])", "#,0"),
    ]
}

RELS = [
    ("FactInternetSales", "ProductKey", "DimProduct", "ProductKey"),
    ("FactInternetSales", "CustomerKey", "DimCustomer", "CustomerKey"),
    ("FactInternetSales", "OrderDateKey", "DimDate", "DateKey"),
    ("FactInternetSales", "SalesTerritoryKey", "DimSalesTerritory", "SalesTerritoryKey"),
    ("DimProduct", "ProductSubcategoryKey", "DimProductSubcategory", "ProductSubcategoryKey"),
    ("DimProductSubcategory", "ProductCategoryKey", "DimProductCategory", "ProductCategoryKey"),
]


def m_expr(table, cols):
    names = ", ".join(f'"{c}"' for c, _ in cols)
    return [
        "let",
        f'    Kaynak = Sql.Database("{SERVER}", "{DB}"),',
        f'    Tablo = Kaynak{{[Schema="dbo",Item="{table}"]}}[Data],',
        f"    Secilen = Table.SelectColumns(Tablo, {{{names}}})",
        "in",
        "    Secilen",
    ]


tables = []
for t, cols in TABLES.items():
    tj = {
        "name": t,
        "columns": [
            {"name": c, "dataType": dt, "sourceColumn": c,
             **({"summarizeBy": "none"} if (c.endswith("Key") or c in ("CalendarYear", "MonthNumberOfYear")) else {}),
             **({"sortByColumn": "MonthNumberOfYear"} if c == "EnglishMonthName" else {})}
            for c, dt in cols
        ],
        "partitions": [{"name": t, "mode": "import",
                        "source": {"type": "m", "expression": m_expr(t, cols)}}],
    }
    if t in MEASURES:
        tj["measures"] = [{"name": n, "expression": e, "formatString": f} for n, e, f in MEASURES[t]]
    tables.append(tj)

model = {
    "compatibilityLevel": 1550,
    "model": {
        "culture": "tr-TR",
        "dataAccessOptions": {"legacyRedirects": True, "returnErrorValuesAsNull": True},
        "defaultPowerBIDataSourceVersion": "powerBI_V3",
        "sourceQueryCulture": "tr-TR",
        "tables": tables,
        "relationships": [
            {"name": f"r{i}", "fromTable": a, "fromColumn": b, "toTable": c, "toColumn": d}
            for i, (a, b, c, d) in enumerate(RELS)
        ],
    },
}


