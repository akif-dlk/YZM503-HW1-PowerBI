param([string]$Out, [string]$TitleLike = "")
# Captures the window whose title matches $TitleLike (brought to front), or the full primary screen.
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int s);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int L, T, R, B; }
}
"@
[W]::SetProcessDPIAware() | Out-Null
$rect = $null
if ($TitleLike) {
  $p = Get-Process | Where-Object { $_.MainWindowTitle -like $TitleLike } | Select-Object -First 1
  if ($p) {
    [W]::ShowWindow($p.MainWindowHandle, 3) | Out-Null   # maximize
    [W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 1200
    $r = New-Object W+RECT
    [W]::DwmGetWindowAttribute($p.MainWindowHandle, 9, [ref]$r, 16) | Out-Null
    $rect = $r
  } else { Write-Output "window not found: $TitleLike" }
}
if (-not $rect) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $rect = New-Object W+RECT; $rect.L = $b.X; $rect.T = $b.Y; $rect.R = $b.Right; $rect.B = $b.Bottom
}
$w = $rect.R - $rect.L; $h = $rect.B - $rect.T
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.L, $rect.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $Out ($w x $h)"
