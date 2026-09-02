$files = Get-ChildItem "blog\*.html", "*.html", "tool-*.html" | Where-Object { 
    $_.Name -notin @('404.html','tools.html','blog.html','about.html','contact.html','privacy.html','terms.html','index.html') 
}

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '[â€Â]') {
        $fixed = $content
        $fixed = $fixed -replace 'â€"', '—'
        $fixed = $fixed -replace 'â€œ', '"'
        $fixed = $fixed -replace 'â€', '"'
        $fixed = $fixed -replace 'â€˜', ''''
        $fixed = $fixed -replace 'â€™', ''''
        $fixed = $fixed -replace 'Â', ''
        $fixed = $fixed -replace 'â€¢', '•'
        $fixed = $fixed -replace 'â€¦', '…'
        $fixed = $fixed -replace 'â€°', '°'
        $fixed = $fixed -replace 'â€š', '›'
        $fixed = $fixed -replace 'â€¡', '¡'
        $fixed = $fixed -replace 'â‚¬', '€'
        
        [IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.Encoding]::UTF8)
        $count++
        Write-Host "Fixed: $($file.Name)"
    }
}
Write-Host "Total fixed: $count"