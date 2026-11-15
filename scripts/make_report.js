const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat,
  PageBreak, Footer, PageNumber, TableOfContents,
} = require("docx");

const IMG = path.join(__dirname, "rep");
const OUT = process.argv[2];
const FONT = "Calibri";
const CONTENT_W = 9026; // A4 width 11906 - 2*1440 margins

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}

let fig = 0;
function figure(file, caption) {
  const { w, h, data } = pngSize(path.join(IMG, file));
  const maxW = 600; // px at 96 dpi ~ 15.9 cm
  const width = maxW, height = Math.round((h / w) * maxW);
  fig += 1;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
      children: [new ImageRun({ type: "png", data, transformation: { width, height },
        altText: { title: caption, description: caption, name: file } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 240 },
      children: [new TextRun({ text: `Şekil ${fig}. `, bold: true, italics: true, size: 20 }),
                 new TextRun({ text: caption, italics: true, size: 20 })],
    }),
  ];
}

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 140, line: 300 }, alignment: AlignmentType.JUSTIFIED,
  children: Array.isArray(text) ? text : [new TextRun(text)], ...opts,
});
const b = (t) => new TextRun({ text: t, bold: true });
const t = (s) => new TextRun(s);
const h1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(s)] });
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s)] });
const bullet = (runs) => new Paragraph({
  numbering: { reference: "bullets", level: 0 }, spacing: { after: 80, line: 290 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)],
});
const step = (runs) => new Paragraph({
  numbering: { reference: "steps", level: 0 }, spacing: { after: 80, line: 290 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)],
});
const code = (lines) => lines.map((l, i) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: "F2F2F2", color: "auto" },
  spacing: { before: i === 0 ? 120 : 0, after: i === lines.length - 1 ? 200 : 0 },
  indent: { left: 200, right: 200 },
  children: [new TextRun({ text: l || " ", font: "Consolas", size: 18 })],
}));

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths) {
  const total = widths.reduce((a, c) => a + c, 0);
  const cell = (text, w, head) => new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: "1F4E79", color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: head, color: head ? "FFFFFF" : undefined, size: 20 })] })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((x, i) => cell(x, widths[i], true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((x, i) => cell(x, widths[i], false)) })),
    ],
  });
}
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

// ---------------- content ----------------
const cover = [
  new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "YZM503", size: 28, color: "595959" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "İŞ ZEKÂSI (BUSINESS INTELLIGENCE)", size: 40, bold: true, color: "1F4E79" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1600 },
    children: [new TextRun({ text: "Ödev 1 – MS SQL Server, AdventureWorks ve Power BI ile Raporlama", size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Hazırlayan", size: 22, color: "595959" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Akif Dalak – 269797001", size: 30, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600 },
    children: [new TextRun({ text: "Kasım 2026", size: 24, color: "595959" })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

const toc = [
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "İçindekiler", bold: true, size: 32, color: "1F4E79" })] }),
  new TableOfContents("İçindekiler", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
];

const body = [
  h1("1. Giriş"),
  p("Bu ödevde bir iş zekâsı (BI) ortamı uçtan uca kurulmuştur. Önce Microsoft SQL Server veritabanı sunucusu ve yönetim aracı SQL Server Management Studio (SSMS) kurulmuş, ardından Microsoft’un örnek veri ambarı AdventureWorksDW sunucuya eklenmiştir. Son adımda Power BI Desktop ile bu veri ambarına bağlanılmış, yıldız şemalı bir veri modeli oluşturulmuş ve iki sayfalık etkileşimli bir satış raporu hazırlanmıştır. Her adımın ekran görüntüsü raporda yer almaktadır."),

  h1("2. Kullanılan Ortam ve Araçlar"),
  p("Ödev metninde MS SQL Server 2008 istenmektedir. Ancak SQL Server 2008’in Microsoft desteği sona ermiştir ve Windows 11 üzerine kurulamamaktadır. Bu nedenle aynı işlevi gören güncel SQL Server 2019 sürümü ve onunla uyumlu AdventureWorksDW2019 veritabanı kullanılmıştır. Örnek ödev raporunda da aynı sürümler tercih edilmiştir."),
  table(["Bileşen", "Sürüm", "Açıklama"], [
    ["İşletim sistemi", "Windows 11 Pro", "64-bit"],
    ["Microsoft SQL Server 2019", "15.0.2000.5", "Varsayılan örnek (MSSQLSERVER), Windows kimlik doğrulaması"],
    ["SQL Server Management Studio", "18.12.1", "Veritabanı yönetimi ve sorgu çalıştırma"],
    ["AdventureWorksDW2019", ".bak yedeği", "Microsoft’un örnek veri ambarı (sql-server-samples)"],
    ["Power BI Desktop", "2.159.1231.0", "Microsoft Store sürümü, rapor ve veri modeli"],
  ], [2700, 1900, 4426]),
  spacer(),

  h1("3. Kurulum Adımları"),
  h2("3.1 MS SQL Server Kurulumu"),
  p([t("SQL Server 2019, Microsoft’un kurulum sihirbazı ile varsayılan örnek ("), b("MSSQLSERVER"), t(") olarak kurulmuştur. Kurulum sonunda veritabanı motoru, SQL Server tarayıcısı, ODBC/OLE DB sürücüleri ve T-SQL dil hizmeti bilgisayara eklenmiştir. Kurulu bileşenler Windows Ayarlar > Uygulamalar ekranında Şekil 1’deki gibi görülmektedir.")]),
  ...figure("01_sql_server_kurulu.png", "SQL Server 2019 ve SSMS bileşenlerinin kurulu uygulamalar listesinde görünümü"),
  h2("3.2 Power BI Desktop Kurulumu"),
  p("Power BI Desktop, Microsoft Store üzerinden ücretsiz olarak kurulmuştur. Store sürümü otomatik güncellenir ve yönetici izni gerektirmez."),
  ...figure("02_powerbi_kurulu.png", "Power BI Desktop’ın kurulu uygulamalar listesinde görünümü"),

  h2("3.3 AdventureWorks Veritabanının Eklenmesi"),
  p([t("AdventureWorksDW2019 yedek dosyası (AdventureWorksDW2019.bak, yaklaşık 100 MB), Microsoft’un resmî GitHub deposundan (microsoft/sql-server-samples) indirilmiştir. Yedek, sunucuya aşağıdaki "), b("RESTORE DATABASE"), t(" komutuyla geri yüklenmiştir. MOVE seçenekleri, veri ve log dosyalarını bu bilgisayardaki SQL Server veri klasörüne (<DATA> = C:\\Program Files\\Microsoft SQL Server\\MSSQL15.MSSQLSERVER\\MSSQL\\DATA) yerleştirir.")]),
  ...code([
    "RESTORE DATABASE AdventureWorksDW2019",
    "FROM DISK = 'C:\\AWBackup\\AdventureWorksDW2019.bak'",
    "WITH MOVE 'AdventureWorksDW2019'     TO '<DATA>\\AdventureWorksDW2019.mdf',",
    "     MOVE 'AdventureWorksDW2019_log' TO '<DATA>\\AdventureWorksDW2019_log.ldf',",
    "     REPLACE, STATS = 25;",
  ]),
  p("Geri yükleme 12.226 sayfa işlenerek başarıyla tamamlanmıştır. Veritabanı, SSMS’teki Object Explorer penceresinde Databases klasörü altında görünmektedir (Şekil 3)."),
  ...figure("03_ssms_veritabani.png", "SSMS Object Explorer’da AdventureWorksDW2019 veritabanı"),

  h2("3.4 Verinin SSMS ile Kontrol Edilmesi"),
  p("Veritabanının doğru yüklendiğini görmek için SSMS’te bir sorgu yazılmıştır. Sorgu, FactInternetSales olgu tablosunu ürün boyut tablolarıyla birleştirir ve kategori bazında satış toplamını hesaplar. Sonuçta Bikes kategorisi 28.318.144,65, Accessories 700.759,96, Clothing ise 339.772,61 tutarında satış göstermektedir (Şekil 4)."),
  ...figure("04_ssms_sorgu.png", "SSMS’te kategori bazında satış sorgusu ve sonucu"),

  h1("4. Power BI ile Veri Bağlantısı ve Modelleme"),
  h2("4.1 SQL Server’a Bağlanma"),
  p([t("Power BI Desktop’ta "), b("Giriş > Veri al > SQL Server"), t(" seçeneği kullanılmıştır (Şekil 5). Sunucu adı olarak "), b("localhost"), t(", veritabanı olarak "), b("AdventureWorksDW2019"), t(" yazılmış ve veri bağlantı modu “İçeri aktar” olarak bırakılmıştır. Kimlik doğrulama ekranında “Mevcut kimlik bilgilerimi kullan” (Windows) seçilerek Bağlan’a tıklanmıştır (Şekil 6).")]),
  ...figure("05_pbi_veri_al.png", "Power BI Desktop – Veri al menüsünde SQL Server seçeneği"),
  ...figure("06_pbi_baglanti.png", "SQL Server veritabanı bağlantısı için Windows kimlik doğrulaması"),

  h2("4.2 Tabloların Seçilmesi ve Yıldız Şema"),
  p("Veri ambarındaki tablolardan internet satışlarını analiz etmeye yetecek bir olgu (fact) tablosu ve altı boyut (dimension) tablosu seçilmiştir. Her tablodan yalnızca analizde kullanılan sütunlar alınmıştır. Tablolar arasındaki ilişkiler Tablo 1’de, model görünümündeki yıldız şema ise Şekil 7’de verilmiştir."),
  table(["Olgu tablosu (çok)", "Boyut tablosu (bir)", "İlişki anahtarı"], [
    ["FactInternetSales", "DimProduct", "ProductKey"],
    ["FactInternetSales", "DimCustomer", "CustomerKey"],
    ["FactInternetSales", "DimDate", "OrderDateKey → DateKey"],
    ["FactInternetSales", "DimSalesTerritory", "SalesTerritoryKey"],
    ["DimProduct", "DimProductSubcategory", "ProductSubcategoryKey"],
    ["DimProductSubcategory", "DimProductCategory", "ProductCategoryKey"],
  ], [3000, 3000, 3026]),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
    children: [new TextRun({ text: "Tablo 1. Veri modelindeki ilişkiler (hepsi çoka-bir, tek yönlü filtre)", italics: true, size: 20 })] }),
  ...figure("08_model_iliskiler.png", "Power BI model görünümü – FactInternetSales merkezli yıldız şema"),
  p("Veri yüklendikten sonra tablo görünümünde kayıtlar incelenmiştir. FactInternetSales tablosunda 60.398 satır, DimCustomer tablosunda ise 18.484 müşteri bulunmaktadır (Şekil 8)."),
  ...figure("09_veri_tablosu.png", "Power BI tablo (veri) görünümü"),

  h2("4.3 DAX Ölçüleri"),
  p("Raporlarda kullanılmak üzere FactInternetSales tablosuna aşağıdaki DAX ölçüleri eklenmiştir:"),
  table(["Ölçü", "DAX ifadesi"], [
    ["Toplam Satış", "SUM(FactInternetSales[SalesAmount])"],
    ["Toplam Maliyet", "SUM(FactInternetSales[TotalProductCost])"],
    ["Brüt Kâr", "[Toplam Satış] - [Toplam Maliyet]"],
    ["Sipariş Sayısı", "DISTINCTCOUNT(FactInternetSales[SalesOrderNumber])"],
    ["Satılan Adet", "SUM(FactInternetSales[OrderQuantity])"],
  ], [2400, 6626]),
  spacer(),

  h1("5. Power BI Raporları"),
  h2("5.1 Sayfa 1 – Satış Özeti"),
  p("İlk rapor sayfası, internet satışlarının genel görünümünü tek ekranda sunar:"),
  bullet([b("Kartlar: "), t("Toplam Satış, Brüt Kâr, Sipariş Sayısı ve Satılan Adet.")]),
  bullet([b("Pasta grafik: "), t("Ürün kategorisine göre satış dağılımı.")]),
  bullet([b("Sütun grafik: "), t("Yıllara göre toplam satış.")]),
  bullet([b("Çubuk grafik: "), t("Ülkelere göre toplam satış.")]),
  bullet([b("Tablo: "), t("Alt kategori bazında satış tutarı ve satılan adet (örnek rapordaki tablo görünümüne karşılık gelir).")]),
  bullet([b("Halka grafik: "), t("Müşteri cinsiyetine göre satış.")]),
  bullet([b("Dilimleyici: "), t("Takvim yılına göre filtre. Bir yıl seçildiğinde sayfadaki tüm görseller o yıla göre süzülür.")]),
  ...figure("10_rapor_sayfa1.png", "Rapor sayfası 1 – Satış Özeti"),
  h2("5.2 Sayfa 2 – Trend ve Müşteri Analizi"),
  bullet([b("Çizgi grafik: "), t("Aylara göre satış trendi, her yıl ayrı bir çizgi olarak.")]),
  bullet([b("Ağaç haritası: "), t("Bölge grubuna göre satış (North America, Pacific, Europe).")]),
  bullet([b("Sütun grafik: "), t("Müşterilerin eğitim düzeyine göre satış.")]),
  bullet([b("Tablo: "), t("Ürün bazında toplam satış ve brüt kâr.")]),
  ...figure("11_rapor_sayfa2.png", "Rapor sayfası 2 – Trend ve Müşteri Analizi"),

  h1("6. Analiz ve Bulgular"),
  bullet([t("İnternet satışlarının toplamı "), b("29.358.677"), t(", brüt kâr "), b("12.080.884"), t("’tür. Bu, yaklaşık %41’lik bir brüt kâr marjına karşılık gelir. Toplam 27.659 siparişte 60.398 adet ürün satılmıştır.")]),
  bullet([t("Satışların "), b("%96,5’i Bikes"), t(" kategorisinden gelmektedir. Alt kategorilerde Road Bikes (14,52 M), Mountain Bikes (9,95 M) ve Touring Bikes (3,84 M) ilk üç sıradadır. Aksesuar ve giyim ürünleri adet olarak çok satılsa da tutar olarak küçük kalmaktadır.")]),
  bullet([t("Yıllara göre en yüksek satış "), b("2013"), t(" yılındadır (16,35 M). 2010 ve 2014 yıllarında yalnızca birkaç aylık veri bulunduğu için bu yılların toplamları düşüktür.")]),
  bullet([t("Ülke bazında "), b("ABD (9,39 M)"), t(" ve "), b("Avustralya (9,06 M)"), t(" öne çıkmaktadır. Bölge grubu olarak en büyük pay North America’dadır (11,37 M).")]),
  bullet([t("Cinsiyete göre satışlar neredeyse eşittir: kadın müşteriler 14,81 M (%50,5), erkek müşteriler 14,55 M (%49,5).")]),
  bullet([t("Eğitim düzeyine göre en yüksek satış lisans mezunu (Bachelors) müşterilerdedir (9,9 M).")]),

  h1("7. Sonuç"),
  p("Bu çalışmada SQL Server üzerinde çalışan bir veri ambarı ile Power BI arasında uçtan uca bir iş zekâsı akışı kurulmuştur. AdventureWorksDW2019 veri ambarındaki olgu ve boyut tabloları Power BI’a aktarılmış, yıldız şema ilişkileri ve DAX ölçüleri tanımlanmıştır. Bu model üzerinde iki sayfalık etkileşimli bir rapor oluşturulmuştur. Raporda satışların hangi ürün, dönem, bölge ve müşteri grubundan geldiği görsel olarak izlenebilmekte, dilimleyici ile yıl bazında filtreleme yapılabilmektedir. Power BI raporlarındaki toplamların SSMS’teki sorgu sonuçlarıyla birebir aynı olması, veri bağlantısının ve modelin doğru kurulduğunu göstermektedir."),
];

const doc = new Document({
  creator: "Akif Dalak",
  title: "YZM503 Ödev 1 – Power BI Raporlama",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 30, bold: true, color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 25, bold: true, color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  features: { updateFields: true },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: cover },
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Akif Dalak – YZM503 Ödev 1    |    ", size: 18, color: "7F7F7F" }),
                   new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "7F7F7F" })] })] }) },
      children: [...toc, ...body] },
  ],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("written", OUT, buf.length); });
