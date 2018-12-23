set /P smartTemplateRev=<revision.txt
set /a oldRev=%smartTemplateRev%
set /a smartTemplateRev+=1
pwsh -Command "(gc -en UTF8NoBOM install.rdf) -replace 'pre%oldRev%', 'pre%smartTemplateRev%' | Out-File install.rdf"
"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplate.zip install.rdf chrome.manifest content defaults locale skin license.txt icon.png 
echo %smartTemplateRev% > revision.txt
move smartTemplate-*.xpi "..\..\Release\_Test Versions\2.0\"
rename smartTemplate.zip smartTemplate-2.0pre%smartTemplateRev%.xpi