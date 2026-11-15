import json, os, sys, shutil, uuid, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
SERVER = sys.argv[2]
sys.argv = [sys.argv[0], OUT, SERVER]
src = open(os.path.join(HERE, "gen_model_part.py"), encoding="utf-8-sig").read()
ns = {"__name__": "model_part"}
exec(src, ns)  # defines model, NAME, DB etc.
model, NAME = ns["model"], ns["NAME"]
BLANK = os.path.join(HERE, "blank", "blank.Report")

S = 1.5  # scale 1280x720 layout to 1920x1080


def w(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)


def lit(v):
    return {"expr": {"Literal": {"Value": v}}}


def proj(t, p, is_m):
    kind = "Measure" if is_m else "Column"
    d = {"field": {kind: {"Expression": {"SourceRef": {"Entity": t}}, "Property": p}},
         "queryRef": f"{t}.{p}", "nativeQueryRef": p}
    if not is_m:
        d["active"] = True
    return d


def visual(vid, vtype, x, y, wd, h, roles, title, z=0, objects=None):
    v = {
        "visualType": vtype,
        "query": {"queryState": {r: {"projections": [proj(*f) for f in fs]} for r, fs in roles.items()}},
        "visualContainerObjects": {"title": [{"properties": {"show": lit("true"), "text": lit(f"'{title}'"),
                                                             "fontSize": lit("14D")}}]},
        "drillFilterOtherVisuals": True,
    }
    if objects:
        v["objects"] = objects
    return {
        "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.4.0/schema.json",
        "name": vid,
        "position": {"x": x * S, "y": y * S, "z": z, "height": h * S, "width": wd * S, "tabOrder": z},
        "visual": v,
    }


F = "FactInternetSales"
satis = (F, "Toplam Satış", True)
kar = (F, "Brüt Kâr", True)
siparis = (F, "Sipariş Sayısı", True)
adet = (F, "Satılan Adet", True)
labels_on = {"labels": [{"properties": {"show": lit("true")}}]}

pages = {
    "Satış Özeti": [
        visual("card1", "card", 20, 20, 300, 110, {"Values": [satis]}, "Toplam Satış", 0),
        visual("card2", "card", 335, 20, 300, 110, {"Values": [kar]}, "Brüt Kâr", 1),
        visual("card3", "card", 650, 20, 300, 110, {"Values": [siparis]}, "Sipariş Sayısı", 2),
        visual("card4", "card", 965, 20, 295, 110, {"Values": [adet]}, "Satılan Adet", 3),
        visual("pie1", "pieChart", 20, 145, 400, 280,
               {"Category": [("DimProductCategory", "EnglishProductCategoryName", False)], "Y": [satis]},
               "Ürün Kategorisine Göre Satış", 4),
        visual("col1", "clusteredColumnChart", 435, 145, 420, 280,
               {"Category": [("DimDate", "CalendarYear", False)], "Y": [satis]},
               "Yıllara Göre Satış", 5, labels_on),
        visual("bar1", "clusteredBarChart", 870, 145, 390, 280,
               {"Category": [("DimSalesTerritory", "SalesTerritoryCountry", False)], "Y": [satis]},
               "Ülkelere Göre Satış", 6),
        visual("tbl1", "tableEx", 20, 440, 620, 265,
               {"Values": [("DimProductSubcategory", "EnglishProductSubcategoryName", False), satis, adet]},
               "Alt Kategori Bazında Satış Tablosu", 7),
        visual("donut1", "donutChart", 655, 440, 300, 265,
               {"Category": [("DimCustomer", "Gender", False)], "Y": [satis]}, "Cinsiyete Göre Satış", 8),
        visual("slc1", "slicer", 970, 440, 290, 265,
               {"Values": [("DimDate", "CalendarYear", False)]}, "Yıl Filtresi", 9),
    ],
    "Trend ve Müşteri Analizi": [
        visual("line1", "lineChart", 20, 20, 820, 330,
               {"Category": [("DimDate", "EnglishMonthName", False)],
                "Series": [("DimDate", "CalendarYear", False)], "Y": [satis]},
               "Aylara ve Yıllara Göre Satış Trendi", 0),
        visual("tree1", "treemap", 855, 20, 405, 330,
               {"Group": [("DimSalesTerritory", "SalesTerritoryGroup", False)], "Values": [satis]},
               "Bölge Grubuna Göre Satış", 1),
        visual("col2", "clusteredColumnChart", 20, 365, 620, 340,
               {"Category": [("DimCustomer", "EnglishEducation", False)], "Y": [satis]},
               "Müşteri Eğitim Düzeyine Göre Satış", 2, labels_on),
        visual("tbl2", "tableEx", 655, 365, 605, 340,
               {"Values": [("DimProduct", "EnglishProductName", False), satis, kar]},
               "Ürün Bazında Satış ve Kâr", 3),
    ],
}

# ---------- write ----------
if os.path.exists(OUT):
    shutil.rmtree(OUT)
rep = os.path.join(OUT, f"{NAME}.Report")
sm = os.path.join(OUT, f"{NAME}.SemanticModel")

w(os.path.join(OUT, f"{NAME}.pbip"),
  {"version": "1.0", "artifacts": [{"report": {"path": f"{NAME}.Report"}}], "settings": {"enableAutoRecovery": True}})
w(os.path.join(rep, "definition.pbir"),
  {"version": "4.0", "datasetReference": {"byPath": {"path": f"../{NAME}.SemanticModel"}}})
for f in ("definition/report.json", "definition/version.json"):
    os.makedirs(os.path.dirname(os.path.join(rep, f)), exist_ok=True)
    shutil.copy(os.path.join(BLANK, f), os.path.join(rep, f))
shutil.copytree(os.path.join(BLANK, "StaticResources"), os.path.join(rep, "StaticResources"))

page_ids = []
for i, (disp, vis) in enumerate(pages.items()):
    pid = hashlib.md5(disp.encode()).hexdigest()[:20]
    page_ids.append(pid)
    pdir = os.path.join(rep, "definition", "pages", pid)
    w(os.path.join(pdir, "page.json"), {
        "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
        "name": pid, "displayName": disp, "displayOption": "FitToPage", "height": 1080, "width": 1920})
    for v in vis:
        w(os.path.join(pdir, "visuals", v["name"], "visual.json"), v)
w(os.path.join(rep, "definition", "pages", "pages.json"), {
    "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.1.0/schema.json",
    "pageOrder": page_ids, "activePageName": page_ids[0]})

w(os.path.join(sm, "definition.pbism"), {"version": "1.0", "settings": {}})
w(os.path.join(sm, "model.bim"), model)
print("ok", OUT)
