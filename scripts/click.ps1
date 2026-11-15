param([int]$X, [int]$Y, [string]$TitleLike = "", [switch]$Double)
Add-Type @"
using System; using System.Runtime.InteropServices;
public class M {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
"@
[M]::SetProcessDPIAware() | Out-Null
if ($TitleLike) {
  $p = Get-Process | Where-Object { $_.MainWindowTitle -like $TitleLike } | Select-Object -First 1
  if ($p) { [M]::SetForegroundWindow($p.MainWindowHandle) | Out-Null; Start-Sleep -Milliseconds 400 }
}
[M]::SetCursorPos($X, $Y) | Out-Null
Start-Sleep -Milliseconds 150
$n = 1; if ($Double) { $n = 2 }
for ($i = 0; $i -lt $n; $i++) { [M]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero); [M]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 80 }
"clicked $X,$Y"
