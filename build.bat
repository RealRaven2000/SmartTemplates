"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplate.zip install.rdf chrome.manifest content defaults locale skin license.txt icon.png 
set /P smartTemplateRev=<revision.txt
set /a smartTemplateRev+=1
echo %smartTemplateRev% > revision.txt
move *.xpi "..\..\Release\_Test Versions\1.5.2\"
rename smartTemplate.zip smartTemplate-1.5.2pre%smartTemplateRev%.xpi